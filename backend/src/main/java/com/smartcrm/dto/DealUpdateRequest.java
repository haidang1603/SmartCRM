package com.smartcrm.dto;

import com.smartcrm.enums.DealStage;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public class DealUpdateRequest {
    @NotBlank(message = "Deal title is required")
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    private String title;

    @NotNull(message = "Deal value is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Deal value cannot be negative")
    private BigDecimal dealValue;

    private DealStage stage;

    @Min(value = 0, message = "Probability cannot be less than 0")
    @Max(value = 100, message = "Probability cannot exceed 100")
    private Integer probability;

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private Long assignedToId;

    private LocalDate expectedCloseDate;

    private LocalDate actualCloseDate;

    @Size(max = 2000, message = "Notes cannot exceed 2000 characters")
    private String notes;

    public DealUpdateRequest() {}

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public BigDecimal getDealValue() {
        return dealValue;
    }

    public void setDealValue(BigDecimal dealValue) {
        this.dealValue = dealValue;
    }

    public DealStage getStage() {
        return stage;
    }

    public void setStage(DealStage stage) {
        this.stage = stage;
    }

    public Integer getProbability() {
        return probability;
    }

    public void setProbability(Integer probability) {
        this.probability = probability;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getAssignedToId() {
        return assignedToId;
    }

    public void setAssignedToId(Long assignedToId) {
        this.assignedToId = assignedToId;
    }

    public LocalDate getExpectedCloseDate() {
        return expectedCloseDate;
    }

    public void setExpectedCloseDate(LocalDate expectedCloseDate) {
        this.expectedCloseDate = expectedCloseDate;
    }

    public LocalDate getActualCloseDate() {
        return actualCloseDate;
    }

    public void setActualCloseDate(LocalDate actualCloseDate) {
        this.actualCloseDate = actualCloseDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
