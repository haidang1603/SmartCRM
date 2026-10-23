package com.smartcrm.dto;

import com.smartcrm.enums.BenchmarkRunType;
import com.smartcrm.enums.BenchmarkScenario;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class BenchmarkRunRequest {

    @NotNull(message = "Kịch bản benchmark không được để trống")
    private BenchmarkScenario scenarioName;

    @Min(value = 1, message = "Số lượng Virtual Users tối thiểu là 1")
    @Max(value = 20, message = "Số lượng Virtual Users tối đa là 20 để bảo vệ an toàn hệ thống")
    private int virtualUsers = 5;

    @Min(value = 10, message = "Số lượt lặp (iterations) tối thiểu là 10")
    @Max(value = 200, message = "Số lượt lặp (iterations) tối đa là 200")
    private int iterations = 50;

    private BenchmarkRunType runType = BenchmarkRunType.OPTIMIZED;

    private String notes;

    public BenchmarkRunRequest() {}

    public BenchmarkScenario getScenarioName() {
        return scenarioName;
    }

    public void setScenarioName(BenchmarkScenario scenarioName) {
        this.scenarioName = scenarioName;
    }

    public int getVirtualUsers() {
        return virtualUsers;
    }

    public void setVirtualUsers(int virtualUsers) {
        this.virtualUsers = virtualUsers;
    }

    public int getIterations() {
        return iterations;
    }

    public void setIterations(int iterations) {
        this.iterations = iterations;
    }

    public BenchmarkRunType getRunType() {
        return runType;
    }

    public void setRunType(BenchmarkRunType runType) {
        this.runType = runType;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
