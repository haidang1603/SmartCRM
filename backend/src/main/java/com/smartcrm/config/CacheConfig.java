package com.smartcrm.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.scheduling.annotation.EnableAsync;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
@EnableAsync
public class CacheConfig implements CachingConfigurer {

    private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

    public static final String CACHE_DASHBOARD_METRICS = "smartcrm:dashboard:metrics";
    public static final String CACHE_CUSTOMER_SUMMARIES = "smartcrm:customers:summaries";
    public static final String CACHE_ACTIVE_USERS = "smartcrm:users:active";

    @Value("${app.cache.metrics-ttl-seconds:300}")
    private long metricsTtlSeconds;

    @Value("${app.cache.summaries-ttl-seconds:600}")
    private long summariesTtlSeconds;

    @Value("${app.cache.users-ttl-seconds:900}")
    private long usersTtlSeconds;

    @Bean
    @ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis", matchIfMissing = false)
    public RedisCacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put(CACHE_DASHBOARD_METRICS, defaultConfig.entryTtl(Duration.ofSeconds(metricsTtlSeconds)));
        cacheConfigs.put(CACHE_CUSTOMER_SUMMARIES, defaultConfig.entryTtl(Duration.ofSeconds(summariesTtlSeconds)));
        cacheConfigs.put(CACHE_ACTIVE_USERS, defaultConfig.entryTtl(Duration.ofSeconds(usersTtlSeconds)));

        log.info("RedisCacheManager initialized with custom TTLs: metrics={}s, summaries={}s, users={}s",
                metricsTtlSeconds, summariesTtlSeconds, usersTtlSeconds);

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }

    /**
     * Resilient Cache Error Handler:
     * If Redis is down, unreachable, or times out, bypass cache and fall back directly
     * to Database without throwing 500 Internal Server Errors to client!
     */
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Cache GET failure on cache '{}' with key '{}'. Falling back to database: {}",
                        cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("Cache PUT failure on cache '{}' with key '{}': {}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Cache EVICT failure on cache '{}' with key '{}': {}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Cache CLEAR failure on cache '{}': {}", cache.getName(), exception.getMessage());
            }
        };
    }
}
