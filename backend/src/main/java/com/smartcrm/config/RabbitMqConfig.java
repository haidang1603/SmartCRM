package com.smartcrm.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    @Value("${app.reports.queue-name:smartcrm.report.queue}")
    private String queueName;

    @Value("${app.reports.exchange-name:smartcrm.report.exchange}")
    private String exchangeName;

    @Value("${app.reports.routing-key:smartcrm.report.routingKey}")
    private String routingKey;

    @Value("${app.reports.dlq-name:smartcrm.report.dlq}")
    private String dlqName;

    @Value("${app.reports.dlx-name:smartcrm.report.dlx}")
    private String dlxName;

    @Bean
    public DirectExchange reportExchange() {
        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(dlxName, true, false);
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(dlqName).build();
    }

    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(deadLetterQueue()).to(deadLetterExchange()).with(dlqName);
    }

    @Bean
    public Queue reportQueue() {
        return QueueBuilder.durable(queueName)
                .withArgument("x-dead-letter-exchange", dlxName)
                .withArgument("x-dead-letter-routing-key", dlqName)
                .withArgument("x-message-ttl", 1800000) // 30 minutes TTL in queue
                .build();
    }

    @Bean
    public Binding reportBinding() {
        return BindingBuilder.bind(reportQueue()).to(reportExchange()).with(routingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
