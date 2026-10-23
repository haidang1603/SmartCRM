package com.smartcrm.dto;

import com.smartcrm.entity.ReportJob;
import com.smartcrm.enums.ReportFormat;
import com.smartcrm.enums.ReportJobStatus;
import com.smartcrm.enums.ReportType;

import java.time.Instant;
import java.time.LocalDate;

public class ReportJobDto {

    private String jobUuid;
    private ReportType reportType;
    private ReportFormat format;
    private ReportJobStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String requestedByUsername;
    private String requestedByFullName;
    private String fileName;
    private Long fileSizeBytes;
    private int rowCount;
    private String errorMessage;
    private String downloadUrl;
    private Instant startedAt;
    private Instant completedAt;
    private Instant expiresAt;
    private Instant createdAt;

    public ReportJobDto() {}

    public static ReportJobDto fromEntity(ReportJob entity) {
        ReportJobDto dto = new ReportJobDto();
        dto.setJobUuid(entity.getJobUuid());
        dto.setReportType(entity.getReportType());
        dto.setFormat(entity.getFormat());
        dto.setStatus(entity.getStatus());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        if (entity.getRequestedBy() != null) {
            dto.setRequestedByUsername(entity.getRequestedBy().getUsername());
            dto.setRequestedByFullName(entity.getRequestedBy().getFullName());
        }
        dto.setFileName(entity.getFileName());
        dto.setFileSizeBytes(entity.getFileSizeBytes());
        dto.setRowCount(entity.getRowCount());
        dto.setErrorMessage(entity.getErrorMessage());
        if (entity.getStatus() == ReportJobStatus.COMPLETED) {
            dto.setDownloadUrl("/api/v1/reports/" + entity.getJobUuid() + "/download");
        }
        dto.setStartedAt(entity.getStartedAt());
        dto.setCompletedAt(entity.getCompletedAt());
        dto.setExpiresAt(entity.getExpiresAt());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    public String getJobUuid() {
        return jobUuid;
    }

    public void setJobUuid(String jobUuid) {
        this.jobUuid = jobUuid;
    }

    public ReportType getReportType() {
        return reportType;
    }

    public void setReportType(ReportType reportType) {
        this.reportType = reportType;
    }

    public ReportFormat getFormat() {
        return format;
    }

    public void setFormat(ReportFormat format) {
        this.format = format;
    }

    public ReportJobStatus getStatus() {
        return status;
    }

    public void setStatus(ReportJobStatus status) {
        this.status = status;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getRequestedByUsername() {
        return requestedByUsername;
    }

    public void setRequestedByUsername(String requestedByUsername) {
        this.requestedByUsername = requestedByUsername;
    }

    public String getRequestedByFullName() {
        return requestedByFullName;
    }

    public void setRequestedByFullName(String requestedByFullName) {
        this.requestedByFullName = requestedByFullName;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public int getRowCount() {
        return rowCount;
    }

    public void setRowCount(int rowCount) {
        this.rowCount = rowCount;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
