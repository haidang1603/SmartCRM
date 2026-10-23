package com.smartcrm.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardMetricsDto {
    private long totalCustomers;
    private long realCustomersCount;
    private long demoCustomersCount;

    private long openDealsCount;
    private BigDecimal totalPipelineValue;
    private BigDecimal wonRevenue;

    private List<StageStatDto> stageBreakdown;
    private List<DealDto> recentDeals;

    private boolean containsDemoData;
    private String dataModeNotice;

    public DashboardMetricsDto() {}

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getRealCustomersCount() {
        return realCustomersCount;
    }

    public void setRealCustomersCount(long realCustomersCount) {
        this.realCustomersCount = realCustomersCount;
    }

    public long getDemoCustomersCount() {
        return demoCustomersCount;
    }

    public void setDemoCustomersCount(long demoCustomersCount) {
        this.demoCustomersCount = demoCustomersCount;
    }

    public long getOpenDealsCount() {
        return openDealsCount;
    }

    public void setOpenDealsCount(long openDealsCount) {
        this.openDealsCount = openDealsCount;
    }

    public BigDecimal getTotalPipelineValue() {
        return totalPipelineValue;
    }

    public void setTotalPipelineValue(BigDecimal totalPipelineValue) {
        this.totalPipelineValue = totalPipelineValue;
    }

    public BigDecimal getWonRevenue() {
        return wonRevenue;
    }

    public void setWonRevenue(BigDecimal wonRevenue) {
        this.wonRevenue = wonRevenue;
    }

    public List<StageStatDto> getStageBreakdown() {
        return stageBreakdown;
    }

    public void setStageBreakdown(List<StageStatDto> stageBreakdown) {
        this.stageBreakdown = stageBreakdown;
    }

    public List<DealDto> getRecentDeals() {
        return recentDeals;
    }

    public void setRecentDeals(List<DealDto> recentDeals) {
        this.recentDeals = recentDeals;
    }

    public boolean isContainsDemoData() {
        return containsDemoData;
    }

    public void setContainsDemoData(boolean containsDemoData) {
        this.containsDemoData = containsDemoData;
    }

    public String getDataModeNotice() {
        return dataModeNotice;
    }

    public void setDataModeNotice(String dataModeNotice) {
        this.dataModeNotice = dataModeNotice;
    }
}
