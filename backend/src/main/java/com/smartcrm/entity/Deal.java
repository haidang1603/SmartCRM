package com.smartcrm.entity;

import com.smartcrm.enums.DealStage;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "deals", indexes = {
    @Index(name = "idx_deals_stage", columnList = "stage"),
    @Index(name = "idx_deals_customer_id", columnList = "customer_id"),
    @Index(name = "idx_deals_assigned_to_id", columnList = "assigned_to_id"),
    @Index(name = "idx_deals_expected_close", columnList = "expectedCloseDate")
})
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal dealValue = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DealStage stage = DealStage.NEW;

    @Column(nullable = false)
    private Integer probability = 10;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    private LocalDate expectedCloseDate;

    private LocalDate actualCloseDate;

    @Column(length = 2000)
    private String notes;

    @Column(nullable = false)
    private boolean isDemo = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    public Deal() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.probability == null) {
            updateDefaultProbability();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void updateDefaultProbability() {
        if (stage == null) return;
        switch (stage) {
            case NEW -> this.probability = 10;
            case CONSULTING -> this.probability = 40;
            case NEGOTIATION -> this.probability = 75;
            case WON -> this.probability = 100;
            case LOST -> this.probability = 0;
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public User getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(User assignedTo) {
        this.assignedTo = assignedTo;
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

    public boolean isDemo() {
        return isDemo;
    }

    public void setDemo(boolean demo) {
        isDemo = demo;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
