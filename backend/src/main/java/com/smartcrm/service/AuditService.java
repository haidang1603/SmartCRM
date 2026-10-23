package com.smartcrm.service;

import com.smartcrm.dto.AuditLogDto;
import com.smartcrm.dto.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AuditService {
    void record(String action, String entityName, Long entityId, String details);
    void record(String action, String entityName, Long entityId, String details, String ipAddress);
    PageResponse<AuditLogDto> getAuditLogs(Pageable pageable);
}
