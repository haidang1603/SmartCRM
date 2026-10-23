package com.smartcrm.dto;

import com.smartcrm.enums.BenchmarkScenario;

public class BenchmarkComparisonDto {

    private BenchmarkScenario scenario;
    private String scenarioDisplayName;
    private BenchmarkResultDto baseline;
    private BenchmarkResultDto optimized;
    private double p50ImprovementPct;
    private double p95ImprovementPct;
    private double throughputImprovementPct;
    private double latencyReductionPct;

    public BenchmarkComparisonDto() {}

    public BenchmarkComparisonDto(
            BenchmarkScenario scenario,
            String scenarioDisplayName,
            BenchmarkResultDto baseline,
            BenchmarkResultDto optimized
    ) {
        this.scenario = scenario;
        this.scenarioDisplayName = scenarioDisplayName;
        this.baseline = baseline;
        this.optimized = optimized;
        calculateImprovements();
    }

    private void calculateImprovements() {
        if (baseline != null && optimized != null) {
            // Latency improvement (% reduction in response time)
            if (baseline.getP50LatencyMs() > 0) {
                this.p50ImprovementPct = Math.max(0, ((baseline.getP50LatencyMs() - optimized.getP50LatencyMs()) / baseline.getP50LatencyMs()) * 100.0);
            }
            if (baseline.getP95LatencyMs() > 0) {
                this.p95ImprovementPct = Math.max(0, ((baseline.getP95LatencyMs() - optimized.getP95LatencyMs()) / baseline.getP95LatencyMs()) * 100.0);
            }
            if (baseline.getAvgLatencyMs() > 0) {
                this.latencyReductionPct = Math.max(0, ((baseline.getAvgLatencyMs() - optimized.getAvgLatencyMs()) / baseline.getAvgLatencyMs()) * 100.0);
            }
            // Throughput improvement (% increase in operations per second)
            if (baseline.getThroughputRps() > 0) {
                this.throughputImprovementPct = ((optimized.getThroughputRps() - baseline.getThroughputRps()) / baseline.getThroughputRps()) * 100.0;
            }
        }
    }

    public BenchmarkScenario getScenario() {
        return scenario;
    }

    public void setScenario(BenchmarkScenario scenario) {
        this.scenario = scenario;
    }

    public String getScenarioDisplayName() {
        return scenarioDisplayName;
    }

    public void setScenarioDisplayName(String scenarioDisplayName) {
        this.scenarioDisplayName = scenarioDisplayName;
    }

    public BenchmarkResultDto getBaseline() {
        return baseline;
    }

    public void setBaseline(BenchmarkResultDto baseline) {
        this.baseline = baseline;
        calculateImprovements();
    }

    public BenchmarkResultDto getOptimized() {
        return optimized;
    }

    public void setOptimized(BenchmarkResultDto optimized) {
        this.optimized = optimized;
        calculateImprovements();
    }

    public double getP50ImprovementPct() {
        return p50ImprovementPct;
    }

    public void setP50ImprovementPct(double p50ImprovementPct) {
        this.p50ImprovementPct = p50ImprovementPct;
    }

    public double getP95ImprovementPct() {
        return p95ImprovementPct;
    }

    public void setP95ImprovementPct(double p95ImprovementPct) {
        this.p95ImprovementPct = p95ImprovementPct;
    }

    public double getThroughputImprovementPct() {
        return throughputImprovementPct;
    }

    public void setThroughputImprovementPct(double throughputImprovementPct) {
        this.throughputImprovementPct = throughputImprovementPct;
    }

    public double getLatencyReductionPct() {
        return latencyReductionPct;
    }

    public void setLatencyReductionPct(double latencyReductionPct) {
        this.latencyReductionPct = latencyReductionPct;
    }
}
