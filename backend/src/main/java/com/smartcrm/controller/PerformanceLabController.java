package com.smartcrm.controller;

import com.smartcrm.dto.*;
import com.smartcrm.service.PerformanceLabService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/performance")
@Tag(name = "Performance Lab & Observability", description = "Endpoints for real-time observability, automated benchmarking, and before/after optimization analytics")
public class PerformanceLabController {

    private final PerformanceLabService performanceLabService;

    public PerformanceLabController(PerformanceLabService performanceLabService) {
        this.performanceLabService = performanceLabService;
    }

    @GetMapping("/metrics")
    @Operation(summary = "Get real-time system metrics (CPU, RAM, Cache, Uptime, SLO)")
    public ResponseEntity<ApiResponse<SystemMetricsDto>> getRealtimeMetrics() {
        SystemMetricsDto metrics = performanceLabService.getRealtimeSystemMetrics();
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @PostMapping("/benchmarks")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Execute an isolated benchmark scenario on local/test environment (Admin only)")
    public ResponseEntity<ApiResponse<BenchmarkResultDto>> runBenchmark(
            @Valid @RequestBody BenchmarkRunRequest request,
            Principal principal
    ) {
        BenchmarkResultDto result = performanceLabService.runBenchmark(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thực thi bài đo benchmark thành công", result));
    }

    @GetMapping("/comparisons")
    @Operation(summary = "Get before vs after optimization comparisons with latency & throughput deltas")
    public ResponseEntity<ApiResponse<List<BenchmarkComparisonDto>>> getComparisons() {
        List<BenchmarkComparisonDto> comparisons = performanceLabService.getScenarioComparisons();
        return ResponseEntity.ok(ApiResponse.success(comparisons));
    }

    @GetMapping("/history")
    @Operation(summary = "Get paginated history of executed performance benchmarks")
    public ResponseEntity<ApiResponse<PageResponse<BenchmarkResultDto>>> getBenchmarkHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PageResponse<BenchmarkResultDto> response = performanceLabService.getBenchmarkHistory(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/benchmarks/{runUuid}")
    @Operation(summary = "Get benchmark result details by run UUID")
    public ResponseEntity<ApiResponse<BenchmarkResultDto>> getBenchmarkByUuid(@PathVariable String runUuid) {
        BenchmarkResultDto result = performanceLabService.getBenchmarkByUuid(runUuid);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
