package com.smartcrm.dto;

import com.smartcrm.entity.PerformanceBenchmark;
import com.smartcrm.enums.BenchmarkRunType;
import com.smartcrm.enums.BenchmarkScenario;

import java.time.Instant;

public class BenchmarkResultDto {

    private String runUuid;
    private BenchmarkScenario scenarioName;
    private String scenarioDisplayName;
    private BenchmarkRunType runType;
    private String environment;
    private int virtualUsers;
    private int iterations;
    private int totalRequests;
    private int successfulRequests;
    private int failedRequests;
    private long durationMs;
    private double throughputRps;
    private double minLatencyMs;
    private double avgLatencyMs;
    private double p50LatencyMs;
    private double p95LatencyMs;
    private double p99LatencyMs;
    private double maxLatencyMs;
    private double errorRate;
    private Double cpuUsagePct;
    private Double memoryUsedMb;
    private Double cacheHitRatio;
    private String executedBy;
    private String notes;
    private Instant createdAt;

    public BenchmarkResultDto() {}

    public static BenchmarkResultDto fromEntity(PerformanceBenchmark entity) {
        BenchmarkResultDto dto = new BenchmarkResultDto();
        dto.setRunUuid(entity.getRunUuid());
        dto.setScenarioName(entity.getScenarioName());
        dto.setScenarioDisplayName(entity.getScenarioName() != null ? entity.getScenarioName().getDisplayName() : "");
        dto.setRunType(entity.getRunType());
        dto.setEnvironment(entity.getEnvironment());
        dto.setVirtualUsers(entity.getVirtualUsers());
        dto.setIterations(entity.getIterations());
        dto.setTotalRequests(entity.getTotalRequests());
        dto.setSuccessfulRequests(entity.getSuccessfulRequests());
        dto.setFailedRequests(entity.getFailedRequests());
        dto.setDurationMs(entity.getDurationMs());
        dto.setThroughputRps(entity.getThroughputRps());
        dto.setMinLatencyMs(entity.getMinLatencyMs());
        dto.setAvgLatencyMs(entity.getAvgLatencyMs());
        dto.setP50LatencyMs(entity.getP50LatencyMs());
        dto.setP95LatencyMs(entity.getP95LatencyMs());
        dto.setP99LatencyMs(entity.getP99LatencyMs());
        dto.setMaxLatencyMs(entity.getMaxLatencyMs());
        dto.setErrorRate(entity.getErrorRate());
        dto.setCpuUsagePct(entity.getCpuUsagePct());
        dto.setMemoryUsedMb(entity.getMemoryUsedMb());
        dto.setCacheHitRatio(entity.getCacheHitRatio());
        dto.setExecutedBy(entity.getExecutedBy());
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
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

    public String getScenarioDisplayName() {
        return scenarioDisplayName;
    }

    public void setScenarioDisplayName(String scenarioDisplayName) {
        this.scenarioDisplayName = scenarioDisplayName;
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
