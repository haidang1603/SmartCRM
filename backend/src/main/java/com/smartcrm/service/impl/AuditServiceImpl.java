package com.smartcrm.service.impl;

import com.smartcrm.dto.AuditLogDto;
import com.smartcrm.dto.PageResponse;
import com.smartcrm.entity.AuditLog;
import com.smartcrm.repository.AuditLogRepository;
import com.smartcrm.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditServiceImpl implements AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditServiceImpl.class);

    private final AuditLogRepository auditLogRepository;

    public AuditServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void record(String action, String entityName, Long entityId, String details) {
        record(action, entityName, entityId, details, null);
    }

    @Override
    public void record(String action, String entityName, Long entityId, String details, String ipAddress) {
        String performedBy = "SYSTEM";
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            performedBy = authentication.getName();
        }

        saveAuditLogAsync(action, entityName, entityId, performedBy, details, ipAddress);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveAuditLogAsync(String action, String entityName, Long entityId, String performedBy, String details, String ipAddress) {
        try {
            AuditLog auditLog = new AuditLog(action, entityName, entityId, performedBy, details, ipAddress);
            auditLogRepository.save(auditLog);
        } catch (Exception ex) {
            log.error("Failed to asynchronously save audit log: action={}, entity={}: {}", action, entityName, ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuditLogDto> getAuditLogs(Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findAllByOrderByTimestampDesc(pageable);
        List<AuditLogDto> dtoList = page.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return PageResponse.of(page, dtoList);
    }

    private AuditLogDto mapToDto(AuditLog log) {
        return new AuditLogDto(
                log.getId(),
                log.getAction(),
                log.getEntityName(),
                log.getEntityId(),
                log.getPerformedBy(),
                log.getDetails(),
                log.getTimestamp(),
                log.getIpAddress()
        );
    }
}
