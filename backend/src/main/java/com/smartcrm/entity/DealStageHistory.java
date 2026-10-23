package com.smartcrm.entity;

import com.smartcrm.enums.DealStage;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "deal_stage_history", indexes = {
    @Index(name = "idx_dsh_deal_id", columnList = "deal_id"),
    @Index(name = "idx_dsh_change_date", columnList = "changeDate")
})
public class DealStageHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "deal_id", nullable = false)
    private Deal deal;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private DealStage previousStage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DealStage newStage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_id")
    private User changedBy;

    @Column(nullable = false)
    private Instant changeDate;

    @Column(length = 500)
    private String comment;

    public DealStageHistory() {}

    public DealStageHistory(Deal deal, DealStage previousStage, DealStage newStage, User changedBy, String comment) {
        this.deal = deal;
        this.previousStage = previousStage;
        this.newStage = newStage;
        this.changedBy = changedBy;
        this.comment = comment;
        this.changeDate = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.changeDate == null) {
            this.changeDate = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Deal getDeal() {
        return deal;
    }

    public void setDeal(Deal deal) {
        this.deal = deal;
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

    public User getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(User changedBy) {
        this.changedBy = changedBy;
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
