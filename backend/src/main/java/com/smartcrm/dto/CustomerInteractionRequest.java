package com.smartcrm.dto;

import com.smartcrm.enums.InteractionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public class CustomerInteractionRequest {
    @NotNull(message = "Interaction type is required")
    private InteractionType interactionType;

    @NotBlank(message = "Summary is required")
    private String summary;

    private String details;

    private Instant interactionDate;

    public CustomerInteractionRequest() {}

    public InteractionType getInteractionType() {
        return interactionType;
    }

    public void setInteractionType(InteractionType interactionType) {
        this.interactionType = interactionType;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Instant getInteractionDate() {
        return interactionDate;
    }

    public void setInteractionDate(Instant interactionDate) {
        this.interactionDate = interactionDate;
    }
}
