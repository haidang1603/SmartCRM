package com.smartcrm.messaging;

import java.io.Serializable;
import java.time.Instant;

public class ReportMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    private String jobUuid;
    private Instant dispatchedAt;

    public ReportMessage() {}

    public ReportMessage(String jobUuid) {
        this.jobUuid = jobUuid;
        this.dispatchedAt = Instant.now();
    }

    public String getJobUuid() {
        return jobUuid;
    }

    public void setJobUuid(String jobUuid) {
        this.jobUuid = jobUuid;
    }

    public Instant getDispatchedAt() {
        return dispatchedAt;
    }

    public void setDispatchedAt(Instant dispatchedAt) {
        this.dispatchedAt = dispatchedAt;
    }

    @Override
    public String toString() {
        return "ReportMessage{" +
                "jobUuid='" + jobUuid + '\'' +
                ", dispatchedAt=" + dispatchedAt +
                '}';
    }
}
