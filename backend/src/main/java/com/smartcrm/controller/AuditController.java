package com.smartcrm.controller;

import com.smartcrm.dto.ApiResponse;
import com.smartcrm.dto.AuditLogDto;
import com.smartcrm.dto.PageResponse;
import com.smartcrm.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/audit-logs")
@Tag(name = "Audit Logs", description = "Endpoints for viewing system audit trails and security activity")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Get paginated audit logs (Admin or Manager)")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogDto>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        PageResponse<AuditLogDto> response = auditService.getAuditLogs(pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy nhật ký kiểm toán thành công", response));
    }
}
