package com.smartcrm.enums;

public enum BenchmarkScenario {
    DASHBOARD_METRICS("Đọc Dashboard có Cache (Redis Hit)", "Truy vấn Dashboard kinh doanh với dữ liệu đã lưu trong Redis Cache"),
    DASHBOARD_COLD_MISS("Đọc Dashboard không Cache (Cache Miss)", "Truy vấn tính toán số liệu Dashboard trực tiếp từ MySQL khi chưa có Cache"),
    CUSTOMER_SEARCH("Tìm kiếm khách hàng (Email / SĐT)", "Truy vấn tìm kiếm khách hàng sử dụng chỉ mục Composite Index V3"),
    CUSTOMER_PAGINATION("Phân trang khách hàng (EntityGraph)", "Phân trang khách hàng loại trừ N+1 query bằng EntityGraph JOIN"),
    DEAL_PIPELINE_FILTER("Lọc cơ hội bán hàng (Deal Pipeline)", "Lọc và tính tổng giá trị deal theo giai đoạn trên MySQL"),
    REPORT_GENERATION_ASYNC("Tạo báo cáo bất đồng bộ (RabbitMQ)", "Đẩy tác vụ xuất báo cáo nền qua RabbitMQ và nhận mã 202 ACCEPTED");

    private final String displayName;
    private final String description;

    BenchmarkScenario(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}
