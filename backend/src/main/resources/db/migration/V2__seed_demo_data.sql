-- SmartCRM Demo Data Seed Migration
-- Version: V2__seed_demo_data.sql

-- 1. INSERT ROLES
INSERT INTO roles (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Quản trị viên toàn quyền hệ thống'),
(2, 'ROLE_MANAGER', 'Quản lý phòng kinh doanh và giám sát đội ngũ'),
(3, 'ROLE_SALES', 'Nhân viên kinh doanh quản lý khách hàng và cơ hội');

-- 2. INSERT DEMO USERS (Password hashes generated via BCrypt)
-- Password for admin: Admin@123
-- Password for manager: Manager@123
-- Password for sales: Sales@123
INSERT INTO users (id, username, email, password, full_name, phone_number, active, is_demo, created_at, updated_at) VALUES
(1, 'admin', 'admin@smartcrm.dev', '$2a$10$IT4ces4eeNVX7h5jgf03deoQUkwF7/uyE8oUVJpk9WSoY8Cii0kQa', 'Quản Trị Viên Hệ Thống', '0901000001', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'manager', 'manager@smartcrm.dev', '$2a$10$CDxVkkYpeKcthp0FSpHeduKKlZbZOWvOq7KITA5fNAL9o.bILgDBq', 'Nguyễn Thế Dũng (Trưởng Phòng)', '0901000002', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'sales', 'sales@smartcrm.dev', '$2a$10$Zoqr7r2fHk127VwQvKprceL5ynZgEd9nXb.XWE1oxXbTgjIlvfRGa', 'Trần Thu Hà (Chuyên Viên Sales)', '0901000003', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. ASSIGN USER ROLES
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- admin has ROLE_ADMIN
(1, 2), -- admin also has ROLE_MANAGER
(2, 2), -- manager has ROLE_MANAGER
(3, 3); -- sales has ROLE_SALES

-- 4. INSERT DEMO CUSTOMERS
INSERT INTO customers (id, full_name, email, phone_number, company_name, status, assigned_to_id, notes, is_demo, created_at, updated_at) VALUES
(1, 'Lê Minh Hưng', 'hung.le@alphatech.example.com', '0901234567', 'AlphaTech Solutions Corp', 'ACTIVE_CLIENT', 3, 'Khách hàng chiến lược triển khai CRM toàn quốc', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Trần Thị Mai', 'mai.tran@vinhomesgreen.example.com', '0912345678', 'Tập Đoàn Địa Ốc Vinhomes Green', 'PROSPECT', 3, 'Đang trao đổi gói giải pháp quản lý leads bất động sản', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Phạm Quốc Bảo', 'bao.pham@goldenretail.example.com', '0987654321', 'Chuỗi Bán Lẻ Golden Retail', 'LEAD', 2, 'Quan tâm đến tính năng tích hợp tổng đài VoIP và Zalo ZNS', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Nguyễn Hoài Nam', 'nam.nguyen@fintechvn.example.com', '0933445566', 'Fintech Vietnam JSC', 'ACTIVE_CLIENT', 3, 'Đã ký hợp đồng gói Enterprise năm thứ 2', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Vũ Hải Đăng', 'dang.vu@phuongnamlogistics.example.com', '0944556677', 'Logistics Phương Nam', 'INACTIVE', 2, 'Tạm hoãn kế hoạch chuyển đổi số sang quý sau', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. INSERT DEMO INTERACTIONS
INSERT INTO customer_interactions (id, customer_id, interaction_type, summary, details, performed_by_id, interaction_date, created_at) VALUES
(1, 1, 'MEETING', 'Họp nghiệm thu giai đoạn 1', 'Đã chốt cấu hình pipeline và phân quyền 20 tài khoản sales.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 'CALL', 'Hỗ trợ kỹ thuật cấu hình import dữ liệu', 'Hướng dẫn khách hàng chuẩn hóa file Excel 5,000 danh bạ.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 2, 'EMAIL', 'Gửi báo giá bản quyền Enterprise và SLA cam kết', 'Báo giá chi tiết gói 50 users bao gồm module Kanban và Báo cáo Realtime.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 3, 'NOTE', 'Ghi chú nhu cầu tích hợp API', 'Khách hàng cần kết nối CRM với hệ thống ERP SAP có sẵn.', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 6. INSERT DEMO DEALS
INSERT INTO deals (id, title, deal_value, stage, probability, customer_id, assigned_to_id, expected_close_date, actual_close_date, notes, is_demo, created_at, updated_at) VALUES
(1, 'Triển khai SmartCRM Enterprise 2026', 150000000.00, 'WON', 100, 1, 3, '2026-10-01', '2026-10-01', 'Đã ký kết hợp đồng và thanh toán đợt 1', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Gói Nâng Cấp Hệ Thống Bán Hàng Đa Kênh', 85000000.00, 'NEGOTIATION', 75, 2, 3, '2026-11-15', NULL, 'Đang thương lượng điều khoản thanh toán 3 đợt', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Tích Hợp API Đa Kênh & Báo Cáo Hiệu Suất', 45000000.00, 'CONSULTING', 40, 3, 2, '2026-11-30', NULL, 'Chờ phê duyệt ngân sách IT từ ban giám đốc', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Bản Quyền SmartCRM Cloud 50 Seats', 60000000.00, 'NEW', 10, 4, 3, '2026-12-20', NULL, 'Cơ hội mới từ hội thảo Chuyển đổi số Doanh nghiệp', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Hệ Thống Quản Lý Vận Đơn Logistics', 35000000.00, 'LOST', 0, 5, 2, '2026-09-15', '2026-09-20', 'Khách hàng lựa chọn giải pháp viết riêng nội bộ', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 7. INSERT DEAL STAGE HISTORIES
INSERT INTO deal_stage_history (id, deal_id, previous_stage, new_stage, changed_by_id, change_date, comment) VALUES
(1, 1, 'NEGOTIATION', 'WON', 3, CURRENT_TIMESTAMP, 'Khách hàng ký hợp đồng thành công'),
(2, 2, 'CONSULTING', 'NEGOTIATION', 3, CURRENT_TIMESTAMP, 'Chuyển sang đàm phán hợp đồng chi tiết'),
(3, 3, 'NEW', 'CONSULTING', 2, CURRENT_TIMESTAMP, 'Bắt đầu khảo sát quy trình bán hàng'),
(4, 4, NULL, 'NEW', 3, CURRENT_TIMESTAMP, 'Khởi tạo cơ hội bán hàng mới'),
(5, 5, 'CONSULTING', 'LOST', 2, CURRENT_TIMESTAMP, 'Khách hàng hủy dự án vì lý do ngân sách');

-- 8. INSERT INITIAL AUDIT LOG
INSERT INTO audit_logs (id, action, entity_name, entity_id, performed_by, details, timestamp, ip_address) VALUES
(1, 'SYSTEM_INIT', 'Application', 1, 'SYSTEM', 'Khởi tạo thành công cơ sở dữ liệu SmartCRM và nạp dữ liệu mẫu an toàn', CURRENT_TIMESTAMP, '127.0.0.1');
