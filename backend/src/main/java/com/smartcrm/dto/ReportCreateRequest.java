package com.smartcrm.dto;

import com.smartcrm.enums.ReportFormat;
import com.smartcrm.enums.ReportType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class ReportCreateRequest {

    @NotNull(message = "Loại báo cáo là bắt buộc (CUSTOMERS, DEALS, REVENUE_SUMMARY)")
    private ReportType reportType;

    @NotNull(message = "Định dạng báo cáo là bắt buộc (CSV, XLSX)")
    private ReportFormat format;

    private LocalDate startDate;
    private LocalDate endDate;
    private String statusFilter;
    private Long assignedToId;

    public ReportCreateRequest() {}

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

    public String getStatusFilter() {
        return statusFilter;
    }

    public void setStatusFilter(String statusFilter) {
        this.statusFilter = statusFilter;
    }

    public Long getAssignedToId() {
        return assignedToId;
    }

    public void setAssignedToId(Long assignedToId) {
        this.assignedToId = assignedToId;
    }
}
