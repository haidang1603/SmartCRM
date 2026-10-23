package com.smartcrm.entity;

import com.smartcrm.enums.BenchmarkRunType;
import com.smartcrm.enums.BenchmarkScenario;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "performance_benchmarks", indexes = {
    @Index(name = "idx_perf_scenario_type", columnList = "scenario_name, run_type"),
    @Index(name = "idx_perf_created_at", columnList = "created_at DESC")
})
public class PerformanceBenchmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_uuid", nullable = false, unique = true, length = 36)
    private String runUuid;

    @Enumerated(EnumType.STRING)
    @Column(name = "scenario_name", nullable = false, length = 60)
    private BenchmarkScenario scenarioName;

    @Enumerated(EnumType.STRING)
    @Column(name = "run_type", nullable = false, length = 30)
    private BenchmarkRunType runType;

    @Column(nullable = false, length = 30)
    private String environment = "LOCAL_TEST";

    @Column(name = "virtual_users", nullable = false)
    private int virtualUsers = 1;

    @Column(nullable = false)
    private int iterations = 50;

    @Column(name = "total_requests", nullable = false)
    private int totalRequests;

    @Column(name = "successful_requests", nullable = false)
    private int successfulRequests;

    @Column(name = "failed_requests", nullable = false)
    private int failedRequests = 0;

    @Column(name = "duration_ms", nullable = false)
    private long durationMs;

    @Column(name = "throughput_rps", nullable = false)
    private double throughputRps;

    @Column(name = "min_latency_ms", nullable = false)
    private double minLatencyMs;

    @Column(name = "avg_latency_ms", nullable = false)
    private double avgLatencyMs;

    @Column(name = "p50_latency_ms", nullable = false)
    private double p50LatencyMs;

    @Column(name = "p95_latency_ms", nullable = false)
    private double p95LatencyMs;

    @Column(name = "p99_latency_ms", nullable = false)
    private double p99LatencyMs;

    @Column(name = "max_latency_ms", nullable = false)
    private double maxLatencyMs;

    @Column(name = "error_rate", nullable = false)
    private double errorRate = 0.0;

    @Column(name = "cpu_usage_pct")
    private Double cpuUsagePct;

    @Column(name = "memory_used_mb")
    private Double memoryUsedMb;

    @Column(name = "cache_hit_ratio")
    private Double cacheHitRatio;

    @Column(name = "executed_by", nullable = false, length = 100)
    private String executedBy;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public PerformanceBenchmark() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRunUuid() {
        return runUuid;
    }

    public void setRunUuid(String runUuid) {
        this.runUuid = runUuid;
    }

    public BenchmarkScenario getScenarioName() {
        return scenarioName;
    }

    public void setScenarioName(BenchmarkScenario scenarioName) {
        this.scenarioName = scenarioName;
    }

    public BenchmarkRunType getRunType() {
        return runType;
    }

    public void setRunType(BenchmarkRunType runType) {
        this.runType = runType;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public int getVirtualUsers() {
        return virtualUsers;
    }

    public void setVirtualUsers(int virtualUsers) {
        this.virtualUsers = virtualUsers;
    }

    public int getIterations() {
        return iterations;
    }

    public void setIterations(int iterations) {
        this.iterations = iterations;
    }

    public int getTotalRequests() {
        return totalRequests;
    }

    public void setTotalRequests(int totalRequests) {
        this.totalRequests = totalRequests;
    }

    public int getSuccessfulRequests() {
        return successfulRequests;
    }

    public void setSuccessfulRequests(int successfulRequests) {
        this.successfulRequests = successfulRequests;
    }

    public int getFailedRequests() {
        return failedRequests;
    }

    public void setFailedRequests(int failedRequests) {
        this.failedRequests = failedRequests;
    }

    public long getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(long durationMs) {
        this.durationMs = durationMs;
    }

    public double getThroughputRps() {
        return throughputRps;
    }

    public void setThroughputRps(double throughputRps) {
        this.throughputRps = throughputRps;
    }

    public double getMinLatencyMs() {
        return minLatencyMs;
    }

    public void setMinLatencyMs(double minLatencyMs) {
        this.minLatencyMs = minLatencyMs;
    }

    public double getAvgLatencyMs() {
        return avgLatencyMs;
    }

    public void setAvgLatencyMs(double avgLatencyMs) {
        this.avgLatencyMs = avgLatencyMs;
    }

    public double getP50LatencyMs() {
        return p50LatencyMs;
    }

    public void setP50LatencyMs(double p50LatencyMs) {
        this.p50LatencyMs = p50LatencyMs;
    }

    public double getP95LatencyMs() {
        return p95LatencyMs;
    }

    public void setP95LatencyMs(double p95LatencyMs) {
        this.p95LatencyMs = p95LatencyMs;
    }

    public double getP99LatencyMs() {
        return p99LatencyMs;
    }

    public void setP99LatencyMs(double p99LatencyMs) {
        this.p99LatencyMs = p99LatencyMs;
    }

    public double getMaxLatencyMs() {
        return maxLatencyMs;
    }

    public void setMaxLatencyMs(double maxLatencyMs) {
        this.maxLatencyMs = maxLatencyMs;
    }

    public double getErrorRate() {
        return errorRate;
    }

    public void setErrorRate(double errorRate) {
        this.errorRate = errorRate;
    }

    public Double getCpuUsagePct() {
        return cpuUsagePct;
    }

    public void setCpuUsagePct(Double cpuUsagePct) {
        this.cpuUsagePct = cpuUsagePct;
    }

    public Double getMemoryUsedMb() {
        return memoryUsedMb;
    }

    public void setMemoryUsedMb(Double memoryUsedMb) {
        this.memoryUsedMb = memoryUsedMb;
    }

    public Double getCacheHitRatio() {
        return cacheHitRatio;
    }

    public void setCacheHitRatio(Double cacheHitRatio) {
        this.cacheHitRatio = cacheHitRatio;
    }

    public String getExecutedBy() {
        return executedBy;
    }

    public void setExecutedBy(String executedBy) {
        this.executedBy = executedBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
