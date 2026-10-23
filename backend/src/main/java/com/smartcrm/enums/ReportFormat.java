package com.smartcrm.enums;

public enum ReportFormat {
    CSV,
    XLSX;

    public String getMimeType() {
        return this == CSV ? "text/csv; charset=UTF-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    public String getFileExtension() {
        return this == CSV ? ".csv" : ".xlsx";
    }
}
