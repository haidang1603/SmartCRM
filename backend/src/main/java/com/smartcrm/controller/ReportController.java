package com.smartcrm.controller;

import com.smartcrm.dto.ApiResponse;
import com.smartcrm.dto.PageResponse;
import com.smartcrm.dto.ReportCreateRequest;
import com.smartcrm.dto.ReportJobDto;
import com.smartcrm.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Asynchronous Reporting", description = "Endpoints for creating, monitoring and downloading async background reports via RabbitMQ")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    @Operation(summary = "Submit a new report generation job to RabbitMQ queue")
    public ResponseEntity<ApiResponse<ReportJobDto>> createReport(
            @Valid @RequestBody ReportCreateRequest request,
            Principal principal
    ) {
        ReportJobDto job = reportService.createReportJob(request, principal.getName());
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Yêu cầu tạo báo cáo đã được tiếp nhận vào hàng đợi xử lý", job));
    }

    @GetMapping("/{jobUuid}")
    @Operation(summary = "Get report job processing status and metadata")
    public ResponseEntity<ApiResponse<ReportJobDto>> getReportStatus(
            @PathVariable String jobUuid,
            Principal principal
    ) {
        ReportJobDto status = reportService.getJobStatus(jobUuid, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    @GetMapping
    @Operation(summary = "Get paginated history of reports requested by user")
    public ResponseEntity<ApiResponse<PageResponse<ReportJobDto>>> getUserReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PageResponse<ReportJobDto> response = reportService.getUserReports(principal.getName(), pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{jobUuid}/download")
    @Operation(summary = "Securely download completed report file (CSV or Excel)")
    public ResponseEntity<Resource> downloadReport(
            @PathVariable String jobUuid,
            Principal principal
    ) {
        return reportService.downloadReportFile(jobUuid, principal.getName());
    }
}
