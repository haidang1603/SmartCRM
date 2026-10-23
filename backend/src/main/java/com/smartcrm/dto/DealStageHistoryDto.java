package com.smartcrm.dto;

import com.smartcrm.enums.DealStage;
import java.time.Instant;

public class DealStageHistoryDto {
    private Long id;
    private Long dealId;
    private DealStage previousStage;
    private DealStage newStage;
    private Long changedById;
    private String changedByName;
    private Instant changeDate;
    private String comment;

    public DealStageHistoryDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDealId() {
        return dealId;
    }

    public void setDealId(Long dealId) {
        this.dealId = dealId;
    }

    public DealStage getPreviousStage() {
        return previousStage;
    }

    public void setPreviousStage(DealStage previousStage) {
        this.previousStage = previousStage;
    }

    public DealStage getNewStage() {
        return newStage;
    }

    public void setNewStage(DealStage newStage) {
        this.newStage = newStage;
    }

    public Long getChangedById() {
        return changedById;
    }

    public void setChangedById(Long changedById) {
        this.changedById = changedById;
    }

    public String getChangedByName() {
        return changedByName;
    }

    public void setChangedByName(String changedByName) {
        this.changedByName = changedByName;
    }

    public Instant getChangeDate() {
        return changeDate;
    }

    public void setChangeDate(Instant changeDate) {
        this.changeDate = changeDate;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
