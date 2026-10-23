package com.smartcrm.entity;

import com.smartcrm.enums.InteractionType;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "customer_interactions", indexes = {
    @Index(name = "idx_ci_customer_id", columnList = "customer_id"),
    @Index(name = "idx_ci_interaction_date", columnList = "interactionDate")
})
public class CustomerInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InteractionType interactionType = InteractionType.NOTE;

    @Column(nullable = false, length = 200)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String details;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_id")
    private User performedBy;

    @Column(nullable = false)
    private Instant interactionDate;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public CustomerInteraction() {}

    @PrePersist
    protected void onCreate() {
        if (this.interactionDate == null) {
            this.interactionDate = Instant.now();
        }
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

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

    public User getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(User performedBy) {
        this.performedBy = performedBy;
    }

    public Instant getInteractionDate() {
        return interactionDate;
    }

    public void setInteractionDate(Instant interactionDate) {
        this.interactionDate = interactionDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
