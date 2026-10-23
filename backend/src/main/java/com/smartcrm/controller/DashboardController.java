package com.smartcrm.controller;

import com.smartcrm.dto.ApiResponse;
import com.smartcrm.dto.DashboardMetricsDto;
import com.smartcrm.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "Endpoints for executive KPIs, sales metrics, and pipeline analytics")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/metrics")
    @Operation(summary = "Get overall CRM dashboard metrics and pipeline statistics")
    public ResponseEntity<ApiResponse<DashboardMetricsDto>> getMetrics() {
        DashboardMetricsDto metrics = dashboardService.getDashboardMetrics();
        return ResponseEntity.ok(ApiResponse.success("Lấy số liệu tổng quan thành công", metrics));
    }
}
