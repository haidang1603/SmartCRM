package com.smartcrm.enums;

public enum DealStage {
    NEW,
    CONSULTING,
    NEGOTIATION,
    WON,
    LOST;

    public boolean isClosed() {
        return this == WON || this == LOST;
    }

    public boolean isOpen() {
        return !isClosed();
    }
}
