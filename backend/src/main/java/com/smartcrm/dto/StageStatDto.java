package com.smartcrm.dto;

import com.smartcrm.enums.DealStage;
import java.math.BigDecimal;

public class StageStatDto {
    private DealStage stage;
    private String label;
    private long count;
    private BigDecimal totalValue;

    public StageStatDto() {}

    public StageStatDto(DealStage stage, String label, long count, BigDecimal totalValue) {
        this.stage = stage;
        this.label = label;
        this.count = count;
        this.totalValue = totalValue;
    }

    public DealStage getStage() {
        return stage;
    }

    public void setStage(DealStage stage) {
        this.stage = stage;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }
}
