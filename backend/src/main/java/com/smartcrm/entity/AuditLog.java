package com.smartcrm.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_entity", columnList = "entityName,entityId"),
    @Index(name = "idx_audit_performed_by", columnList = "performedBy"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(nullable = false, length = 60)
    private String entityName;

    private Long entityId;

    @Column(nullable = false, length = 100)
    private String performedBy;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(length = 60)
    private String ipAddress;

    public AuditLog() {}

    public AuditLog(String action, String entityName, Long entityId, String performedBy, String details, String ipAddress) {
        this.action = action;
        this.entityName = entityName;
        this.entityId = entityId;
        this.performedBy = performedBy;
        this.details = details;
        this.ipAddress = ipAddress;
        this.timestamp = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}
