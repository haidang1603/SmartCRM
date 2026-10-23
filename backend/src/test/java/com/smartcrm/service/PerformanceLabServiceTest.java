package com.smartcrm.service;

import com.smartcrm.dto.BenchmarkComparisonDto;
import com.smartcrm.dto.BenchmarkResultDto;
import com.smartcrm.dto.BenchmarkRunRequest;
import com.smartcrm.dto.SystemMetricsDto;
import com.smartcrm.enums.BenchmarkScenario;
import com.smartcrm.service.impl.PerformanceLabServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class PerformanceLabServiceTest {

    @Autowired
    private PerformanceLabService performanceLabService;

    @Test
    @DisplayName("Unit Test: Percentile calculation logic (p50, p95, p99)")
    void testPercentileCalculations() {
        // Sorted dataset of 100 values from 1.0 to 100.0
        List<Double> data = java.util.stream.IntStream.rangeClosed(1, 100)
                .mapToDouble(i -> (double) i)
                .boxed()
                .toList();

        double p50 = PerformanceLabServiceImpl.calculatePercentile(data, 50);
        double p95 = PerformanceLabServiceImpl.calculatePercentile(data, 95);
        double p99 = PerformanceLabServiceImpl.calculatePercentile(data, 99);

        assertEquals(50.0, p50, 0.01, "p50 of 1..100 must be 50.0");
        assertEquals(95.0, p95, 0.01, "p95 of 1..100 must be 95.0");
        assertEquals(99.0, p99, 0.01, "p99 of 1..100 must be 99.0");
    }

    @Test
    @DisplayName("Unit Test: Delta comparison and improvement percentage calculations")
    void testComparisonImprovements() {
        BenchmarkResultDto baseline = new BenchmarkResultDto();
        baseline.setP50LatencyMs(60.0);
        baseline.setP95LatencyMs(85.0);
        baseline.setAvgLatencyMs(58.0);
        baseline.setThroughputRps(16.7);

        BenchmarkResultDto optimized = new BenchmarkResultDto();
        optimized.setP50LatencyMs(0.03);
        optimized.setP95LatencyMs(0.04);
        optimized.setAvgLatencyMs(0.03);
        optimized.setThroughputRps(6250.0);

        BenchmarkComparisonDto comparison = new BenchmarkComparisonDto(
                BenchmarkScenario.DASHBOARD_METRICS,
                "Dashboard Metrics",
                baseline,
                optimized
        );

        assertTrue(comparison.getP50ImprovementPct() > 99.0, "p50 latency improvement must be > 99%");
        assertTrue(comparison.getP95ImprovementPct() > 99.0, "p95 latency improvement must be > 99%");
        assertTrue(comparison.getThroughputImprovementPct() > 1000.0, "Throughput improvement must be huge");
    }

    @Test
    @DisplayName("Observability: Real-time system metrics must be positive and within realistic JVM ranges")
    void testGetRealtimeSystemMetrics() {
        SystemMetricsDto metrics = performanceLabService.getRealtimeSystemMetrics();

        assertNotNull(metrics);
        assertTrue(metrics.getJvmMemoryUsedMb() > 0, "JVM used memory must be positive");
        assertTrue(metrics.getJvmMemoryMaxMb() > metrics.getJvmMemoryUsedMb(), "Max memory must be greater than used memory");
        assertTrue(metrics.getAvailableProcessors() >= 1, "Available processors must be >= 1");
        assertTrue(metrics.getCpuUsagePercent() >= 0.0 && metrics.getCpuUsagePercent() <= 100.0, "CPU percent must be between 0 and 100");
        assertEquals(500.0, metrics.getTargetSloP95Ms());
    }

    @Test
    @DisplayName("Benchmark Execution: Runs scenario workload with multi-user concurrency and returns valid stats")
    @Transactional
    void testRunBenchmarkScenario() {
        BenchmarkRunRequest req = new BenchmarkRunRequest();
        req.setScenarioName(BenchmarkScenario.DASHBOARD_METRICS);
        req.setVirtualUsers(3);
        req.setIterations(15);
        req.setNotes("Automated service test execution");

        BenchmarkResultDto result = performanceLabService.runBenchmark(req, "test_admin");

        assertNotNull(result);
        assertNotNull(result.getRunUuid());
        assertEquals(45, result.getTotalRequests(), "Total requests must be 3 VUs * 15 iterations = 45");
        assertEquals(45, result.getSuccessfulRequests());
        assertEquals(0, result.getFailedRequests());
        assertEquals(0.0, result.getErrorRate());
        assertTrue(result.getP50LatencyMs() > 0.0 || result.getP50LatencyMs() == 0.0);
        assertTrue(result.getThroughputRps() > 0.0);
    }
}
