package com.smartcrm.enums;

public enum BenchmarkRunType {
    BASELINE("Mốc trước tối ưu (Phase 1 Baseline)"),
    OPTIMIZED("Sau tối ưu (Phase 2 & Phase 3)"),
    SIMULATED("Mô phỏng tải cao (Simulated Load)");

    private final String description;

    BenchmarkRunType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
