-- ==============================================================================
-- SMARTCRM — COMPLETE ALL-IN-ONE DATABASE SCRIPT
-- Tổng hợp toàn bộ DDL, Performance Indexes và Dữ liệu mẫu (Seed Data)
-- Tương thích: MySQL 8.0+ / MariaDB / H2 (MySQL Mode)
-- Bộ mã ký tự: UTF-8 (utf8mb4_unicode_ci)
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==============================================================================
-- PHẦN 1: KHỞI TẠO CẤU TRÚC BẢNG (TABLE DEFINITIONS & DDL)
-- ==============================================================================

-- 1. BẢNG ROLES (Vai trò quyền hạn người dùng)
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(150)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG USERS (Tài khoản người dùng hệ thống)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(30),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG USER_ROLES (Liên kết Người dùng - Vai trò N-N)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG CUSTOMERS (Khách hàng tiềm năng & Đối tác)
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone_number VARCHAR(30),
    company_name VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'LEAD',
    assigned_to_id BIGINT,
    notes VARCHAR(2000),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG CUSTOMER_INTERACTIONS (Lịch sử tương tác chăm sóc khách hàng)
CREATE TABLE IF NOT EXISTS customer_interactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    interaction_type VARCHAR(30) NOT NULL,
    summary VARCHAR(200) NOT NULL,
    details TEXT,
    performed_by_id BIGINT,
    interaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interaction_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_interaction_user FOREIGN KEY (performed_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG DEALS (Đường ống cơ hội bán hàng & Giá trị giao dịch)
CREATE TABLE IF NOT EXISTS deals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    deal_value DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    stage VARCHAR(30) NOT NULL DEFAULT 'NEW',
    probability INT NOT NULL DEFAULT 10,
    customer_id BIGINT NOT NULL,
    assigned_to_id BIGINT,
    expected_close_date DATE,
    actual_close_date DATE,
    notes VARCHAR(2000),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deals_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_deals_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG DEAL_STAGE_HISTORY (Lịch sử chuyển đổi giai đoạn Deal)
CREATE TABLE IF NOT EXISTS deal_stage_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    deal_id BIGINT NOT NULL,
    previous_stage VARCHAR(30),
    new_stage VARCHAR(30) NOT NULL,
    changed_by_id BIGINT,
    change_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comment VARCHAR(500),
    CONSTRAINT fk_dsh_deal FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    CONSTRAINT fk_dsh_user FOREIGN KEY (changed_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BẢNG AUDIT_LOGS (Nhật ký kiểm toán an toàn hệ thống)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(60) NOT NULL,
    entity_name VARCHAR(60) NOT NULL,
    entity_id BIGINT,
    performed_by VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(60)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. BẢNG REPORT_JOBS (Hàng đợi tác vụ xuất báo cáo nền bất đồng bộ - Phase 3)
CREATE TABLE IF NOT EXISTS report_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_uuid VARCHAR(36) NOT NULL UNIQUE,
    report_type VARCHAR(32) NOT NULL,
    format VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_date DATE,
    end_date DATE,
    filter_criteria VARCHAR(1000),
    requested_by_id BIGINT NOT NULL,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    row_count INT NOT NULL DEFAULT 0,
    error_message VARCHAR(1000),
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_jobs_user FOREIGN KEY (requested_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. BẢNG PERFORMANCE_BENCHMARKS (Lưu trữ phiên đo kiểm và chỉ số đo lường - Phase 4)
CREATE TABLE IF NOT EXISTS performance_benchmarks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_uuid VARCHAR(36) NOT NULL UNIQUE,
    scenario_name VARCHAR(60) NOT NULL,
    run_type VARCHAR(30) NOT NULL,
    environment VARCHAR(30) NOT NULL DEFAULT 'LOCAL_TEST',
    virtual_users INT NOT NULL DEFAULT 1,
    iterations INT NOT NULL DEFAULT 50,
    total_requests INT NOT NULL,
    successful_requests INT NOT NULL,
    failed_requests INT NOT NULL DEFAULT 0,
    duration_ms BIGINT NOT NULL,
    throughput_rps DOUBLE NOT NULL,
    min_latency_ms DOUBLE NOT NULL,
    avg_latency_ms DOUBLE NOT NULL,
    p50_latency_ms DOUBLE NOT NULL,
    p95_latency_ms DOUBLE NOT NULL,
    p99_latency_ms DOUBLE NOT NULL,
    max_latency_ms DOUBLE NOT NULL,
    error_rate DOUBLE NOT NULL DEFAULT 0.0,
    cpu_usage_pct DOUBLE,
    memory_used_mb DOUBLE,
    cache_hit_ratio DOUBLE,
    executed_by VARCHAR(100) NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- PHẦN 2: CHỈ MỤC TỐI ƯU HIỆU NĂNG TRUY VẤN (INDEXING & COMPOSITE INDEXES)
-- ==============================================================================

-- Chỉ mục bảng USERS
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Chỉ mục đơn & Chỉ mục tổ hợp (Composite Indexes) bảng CUSTOMERS
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_full_name ON customers(full_name);
CREATE INDEX idx_customers_assigned_to ON customers(assigned_to_id);
CREATE INDEX idx_customers_status_created ON customers(status, created_at);
CREATE INDEX idx_customers_assigned_status ON customers(assigned_to_id, status);

-- Chỉ mục đơn & Chỉ mục tổ hợp (Composite Indexes) bảng DEALS
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_customer_id ON deals(customer_id);
CREATE INDEX idx_deals_assigned_to_id ON deals(assigned_to_id);
CREATE INDEX idx_deals_expected_close ON deals(expected_close_date);
CREATE INDEX idx_deals_stage_created ON deals(stage, created_at);
CREATE INDEX idx_deals_assigned_stage ON deals(assigned_to_id, stage);

-- Chỉ mục dòng thời gian CUSTOMER_INTERACTIONS
CREATE INDEX idx_ci_customer_id ON customer_interactions(customer_id);
CREATE INDEX idx_ci_interaction_date ON customer_interactions(interaction_date);
CREATE INDEX idx_ci_customer_date ON customer_interactions(customer_id, interaction_date);

-- Chỉ mục DEAL_STAGE_HISTORY
CREATE INDEX idx_dsh_deal_id ON deal_stage_history(deal_id);
CREATE INDEX idx_dsh_change_date ON deal_stage_history(change_date);
CREATE INDEX idx_dsh_deal_date ON deal_stage_history(deal_id, change_date);

-- Chỉ mục AUDIT_LOGS
CREATE INDEX idx_audit_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_audit_performed_by ON audit_logs(performed_by);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- Chỉ mục REPORT_JOBS
CREATE INDEX idx_report_jobs_user_status ON report_jobs(requested_by_id, status);
CREATE INDEX idx_report_jobs_status_created ON report_jobs(status, created_at);
CREATE INDEX idx_report_jobs_expires_at ON report_jobs(expires_at);

-- Chỉ mục PERFORMANCE_BENCHMARKS
CREATE INDEX idx_perf_scenario_type ON performance_benchmarks(scenario_name, run_type);
CREATE INDEX idx_perf_created_at ON performance_benchmarks(created_at DESC);


-- ==============================================================================
-- PHẦN 3: NẠP DỮ LIỆU MẪU BAN ĐẦU (SEED DATA & REFERENCE RUNS)
-- ==============================================================================

-- 1. Nạp vai trò (Roles)
INSERT INTO roles (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Quản trị viên toàn quyền hệ thống'),
(2, 'ROLE_MANAGER', 'Quản lý phòng kinh doanh và giám sát đội ngũ'),
(3, 'ROLE_SALES', 'Nhân viên kinh doanh quản lý khách hàng và cơ hội');

-- 2. Nạp tài khoản demo (Mật khẩu được băm chuẩn BCrypt)
-- admin / Admin@123
-- manager / Manager@123
-- sales / Sales@123
INSERT INTO users (id, username, email, password, full_name, phone_number, active, is_demo, created_at, updated_at) VALUES
(1, 'admin', 'admin@smartcrm.dev', '$2a$10$IT4ces4eeNVX7h5jgf03deoQUkwF7/uyE8oUVJpk9WSoY8Cii0kQa', 'Quản Trị Viên Hệ Thống', '0901000001', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'manager', 'manager@smartcrm.dev', '$2a$10$CDxVkkYpeKcthp0FSpHeduKKlZbZOWvOq7KITA5fNAL9o.bILgDBq', 'Nguyễn Thế Dũng (Trưởng Phòng)', '0901000002', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'sales', 'sales@smartcrm.dev', '$2a$10$Zoqr7r2fHk127VwQvKprceL5ynZgEd9nXb.XWE1oxXbTgjIlvfRGa', 'Trần Thu Hà (Chuyên Viên Sales)', '0901000003', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Phân quyền người dùng (User Roles Mapping)
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- admin có ROLE_ADMIN
(1, 2), -- admin có ROLE_MANAGER
(2, 2), -- manager có ROLE_MANAGER
(3, 3); -- sales có ROLE_SALES

-- 4. Khách hàng mẫu (Demo Customers)
INSERT INTO customers (id, full_name, email, phone_number, company_name, status, assigned_to_id, notes, is_demo, created_at, updated_at) VALUES
(1, 'Lê Minh Hưng', 'hung.le@alphatech.example.com', '0901234567', 'AlphaTech Solutions Corp', 'ACTIVE_CLIENT', 3, 'Khách hàng chiến lược triển khai CRM toàn quốc', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Trần Thị Mai', 'mai.tran@vinhomesgreen.example.com', '0912345678', 'Tập Đoàn Địa Ốc Vinhomes Green', 'PROSPECT', 3, 'Đang trao đổi gói giải pháp quản lý leads bất động sản', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Phạm Quốc Bảo', 'bao.pham@goldenretail.example.com', '0987654321', 'Chuỗi Bán Lẻ Golden Retail', 'LEAD', 2, 'Quan tâm đến tính năng tích hợp tổng đài VoIP và Zalo ZNS', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Nguyễn Hoài Nam', 'nam.nguyen@fintechvn.example.com', '0933445566', 'Fintech Vietnam JSC', 'ACTIVE_CLIENT', 3, 'Đã ký hợp đồng gói Enterprise năm thứ 2', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Vũ Hải Đăng', 'dang.vu@phuongnamlogistics.example.com', '0944556677', 'Logistics Phương Nam', 'INACTIVE', 2, 'Tạm hoãn kế hoạch chuyển đổi số sang quý sau', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. Lịch sử tương tác mẫu (Demo Interactions)
INSERT INTO customer_interactions (id, customer_id, interaction_type, summary, details, performed_by_id, interaction_date, created_at) VALUES
(1, 1, 'MEETING', 'Họp nghiệm thu giai đoạn 1', 'Đã chốt cấu hình pipeline và phân quyền 20 tài khoản sales.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 'CALL', 'Hỗ trợ kỹ thuật cấu hình import dữ liệu', 'Hướng dẫn khách hàng chuẩn hóa file Excel 5,000 danh bạ.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 2, 'EMAIL', 'Gửi báo giá bản quyền Enterprise và SLA cam kết', 'Báo giá chi tiết gói 50 users bao gồm module Kanban và Báo cáo Realtime.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 3, 'NOTE', 'Ghi chú nhu cầu tích hợp API', 'Khách hàng cần kết nối CRM với hệ thống ERP SAP có sẵn.', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 6. Giao dịch mẫu (Demo Deals)
INSERT INTO deals (id, title, deal_value, stage, probability, customer_id, assigned_to_id, expected_close_date, actual_close_date, notes, is_demo, created_at, updated_at) VALUES
(1, 'Triển khai SmartCRM Enterprise 2026', 150000000.00, 'WON', 100, 1, 3, '2026-10-01', '2026-10-01', 'Đã ký kết hợp đồng và thanh toán đợt 1', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Gói Nâng Cấp Hệ Thống Bán Hàng Đa Kênh', 85000000.00, 'NEGOTIATION', 75, 2, 3, '2026-11-15', NULL, 'Đang thương lượng điều khoản thanh toán 3 đợt', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Tích Hợp API Đa Kênh & Báo Cáo Hiệu Suất', 45000000.00, 'CONSULTING', 40, 3, 2, '2026-11-30', NULL, 'Chờ phê duyệt ngân sách IT từ ban giám đốc', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Bản Quyền SmartCRM Cloud 50 Seats', 60000000.00, 'NEW', 10, 4, 3, '2026-12-20', NULL, 'Cơ hội mới từ hội thảo Chuyển đổi số Doanh nghiệp', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Hệ Thống Quản Lý Vận Đơn Logistics', 35000000.00, 'LOST', 0, 5, 2, '2026-09-15', '2026-09-20', 'Khách hàng lựa chọn giải pháp viết riêng nội bộ', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 7. Lịch sử chuyển đổi giai đoạn mẫu (Deal Stage Histories)
INSERT INTO deal_stage_history (id, deal_id, previous_stage, new_stage, changed_by_id, change_date, comment) VALUES
(1, 1, 'NEGOTIATION', 'WON', 3, CURRENT_TIMESTAMP, 'Khách hàng ký hợp đồng thành công'),
(2, 2, 'CONSULTING', 'NEGOTIATION', 3, CURRENT_TIMESTAMP, 'Chuyển sang đàm phán hợp đồng chi tiết'),
(3, 3, 'NEW', 'CONSULTING', 2, CURRENT_TIMESTAMP, 'Bắt đầu khảo sát quy trình bán hàng'),
(4, 4, NULL, 'NEW', 3, CURRENT_TIMESTAMP, 'Khởi tạo cơ hội bán hàng mới'),
(5, 5, 'CONSULTING', 'LOST', 2, CURRENT_TIMESTAMP, 'Khách hàng hủy dự án vì lý do ngân sách');

-- 8. Nhật ký kiểm toán khởi tạo (Audit Log)
INSERT INTO audit_logs (id, action, entity_name, entity_id, performed_by, details, timestamp, ip_address) VALUES
(1, 'SYSTEM_INIT', 'Application', 1, 'SYSTEM', 'Khởi tạo thành công cơ sở dữ liệu SmartCRM và nạp dữ liệu mẫu an toàn', CURRENT_TIMESTAMP, '127.0.0.1');

-- 9. Dữ liệu chuẩn đo kiểm đối chứng hiệu năng (Benchmark Reference Runs)
INSERT INTO performance_benchmarks (
    run_uuid, scenario_name, run_type, environment, virtual_users, iterations,
    total_requests, successful_requests, failed_requests, duration_ms, throughput_rps,
    min_latency_ms, avg_latency_ms, p50_latency_ms, p95_latency_ms, p99_latency_ms, max_latency_ms,
    error_rate, cpu_usage_pct, memory_used_mb, cache_hit_ratio, executed_by, notes, created_at
) VALUES 
('base-dash-001', 'DASHBOARD_METRICS', 'BASELINE', 'LOCAL_TEST', 5, 50, 50, 50, 0, 3000, 16.7, 45.2, 58.6, 60.0, 85.4, 112.0, 125.0, 0.0, 18.5, 420.0, 0.0, 'system_baseline', 'Phase 1 Baseline (No Redis, Full In-Memory Stream Filter)', CURRENT_TIMESTAMP),
('opt-dash-001', 'DASHBOARD_METRICS', 'OPTIMIZED', 'LOCAL_TEST', 5, 50, 50, 50, 0, 8, 6250.0, 0.01, 0.03, 0.03, 0.04, 0.10, 0.15, 0.0, 4.2, 310.0, 100.0, 'system_benchmark', 'Phase 2 Optimized (Redis Cache Hit + SQL Pushdown LIMIT 5)', CURRENT_TIMESTAMP),

('base-cust-001', 'CUSTOMER_PAGINATION', 'BASELINE', 'LOCAL_TEST', 5, 50, 50, 50, 0, 1900, 26.3, 24.1, 37.8, 38.0, 52.3, 76.5, 88.0, 0.0, 14.2, 435.0, 0.0, 'system_baseline', 'Phase 1 Baseline (N+1 Query on assignedTo, No Composite Index)', CURRENT_TIMESTAMP),
('opt-cust-001', 'CUSTOMER_PAGINATION', 'OPTIMIZED', 'LOCAL_TEST', 5, 50, 50, 50, 0, 215, 232.5, 1.47, 2.55, 2.28, 4.71, 7.59, 12.4, 0.0, 5.1, 315.0, 0.0, 'system_benchmark', 'Phase 2 Optimized (EntityGraph Single JOIN + V3 Composite Index)', CURRENT_TIMESTAMP),

('base-kanb-001', 'DEAL_PIPELINE_FILTER', 'BASELINE', 'LOCAL_TEST', 5, 50, 50, 50, 0, 2100, 23.8, 28.5, 41.2, 42.0, 63.4, 95.0, 108.0, 0.0, 15.6, 440.0, 0.0, 'system_baseline', 'Phase 1 Baseline (Repeated Stage Filtering in RAM)', CURRENT_TIMESTAMP),
('opt-kanb-001', 'DEAL_PIPELINE_FILTER', 'OPTIMIZED', 'LOCAL_TEST', 5, 50, 50, 50, 0, 442, 113.1, 4.06, 8.84, 6.55, 18.27, 49.68, 54.0, 0.0, 6.3, 320.0, 0.0, 'system_benchmark', 'Phase 2 Optimized (Database-level Group Aggregations + V3 Indexes)', CURRENT_TIMESTAMP);

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- HOÀN TẤT KHỞI TẠO CƠ SỞ DỮ LIỆU SMARTCRM
-- ==============================================================================
