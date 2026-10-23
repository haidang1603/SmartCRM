package com.smartcrm.dto;

import com.smartcrm.enums.DealStage;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class DealStageUpdateRequest {
    @NotNull(message = "New stage is required")
    private DealStage newStage;

    @Size(max = 500, message = "Comment cannot exceed 500 characters")
    private String comment;

    public DealStageUpdateRequest() {}

    public DealStageUpdateRequest(DealStage newStage, String comment) {
        this.newStage = newStage;
        this.comment = comment;
    }

    public DealStage getNewStage() {
        return newStage;
    }

    public void setNewStage(DealStage newStage) {
        this.newStage = newStage;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
