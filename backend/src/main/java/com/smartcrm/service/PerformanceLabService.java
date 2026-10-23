package com.smartcrm.service;

import com.smartcrm.dto.*;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PerformanceLabService {

    SystemMetricsDto getRealtimeSystemMetrics();

    BenchmarkResultDto runBenchmark(BenchmarkRunRequest request, String executedBy);

    List<BenchmarkComparisonDto> getScenarioComparisons();

    PageResponse<BenchmarkResultDto> getBenchmarkHistory(Pageable pageable);

    BenchmarkResultDto getBenchmarkByUuid(String runUuid);
}
