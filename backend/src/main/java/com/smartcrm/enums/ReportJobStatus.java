package com.smartcrm.enums;

public enum ReportJobStatus {
    QUEUED,
    RUNNING,
    COMPLETED,
    FAILED,
    EXPIRED;

    public boolean isTerminal() {
        return this == COMPLETED || this == FAILED || this == EXPIRED;
    }
}
