package com.smartcrm.dto;

import com.smartcrm.enums.DealStage;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class DealKanbanColumnDto {
    private DealStage stage;
    private String title;
    private long count;
    private BigDecimal totalValue = BigDecimal.ZERO;
    private List<DealDto> deals = new ArrayList<>();

    public DealKanbanColumnDto() {}

    public DealKanbanColumnDto(DealStage stage, String title) {
        this.stage = stage;
        this.title = title;
    }

    public DealStage getStage() {
        return stage;
    }

    public void setStage(DealStage stage) {
        this.stage = stage;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public List<DealDto> getDeals() {
        return deals;
    }

    public void setDeals(List<DealDto> deals) {
        this.deals = deals;
    }
}
