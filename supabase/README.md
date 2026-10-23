# SmartCRM — Supabase Migrations & Row Level Security (RLS)

Thư mục này chứa các kịch bản Migration dành cho cơ sở dữ liệu **Supabase (PostgreSQL)** của hệ thống SmartCRM.

## Danh sách Migration
- `migrations/20261019000001_smartcrm_schema_and_rls.sql`:
  - Khởi tạo toàn bộ cấu trúc bảng: `roles`, `users`, `user_roles`, `customers`, `customer_interactions`, `deals`, `deal_stage_history`, `audit_logs`, `performance_benchmarks`.
  - Thiết lập các chỉ mục tối ưu hóa hiệu năng truy vấn (Composite B-Tree Indexes).
  - Khởi tạo trigger `on_auth_user_created` tự động tạo profile và vai trò khi người dùng đăng ký qua Supabase Auth (`auth.users`).
  - Kích hoạt **Row Level Security (RLS)** trên 100% các bảng.
  - Thiết lập các chính sách phân quyền chi tiết:
    - Quyền xóa khách hàng / cơ hội chỉ dành riêng cho Admin/Manager.
    - Quyền cập nhật được kiểm tra dựa trên người phụ trách (`assigned_to_id`) hoặc Admin/Manager.
    - Bảng `audit_logs` bảo mật bất biến (Append-Only), nghiêm cấm UPDATE/DELETE.

## Hướng dẫn chạy Migration

### Cách 1: Sử dụng Supabase Dashboard (Đơn giản nhất)
1. Đăng nhập [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn dự án SmartCRM của bạn.
3. Mở tab **SQL Editor** trên thanh điều hướng bên trái.
4. Chọn **New query**.
5. Copy toàn bộ nội dung file `migrations/20261019000001_smartcrm_schema_and_rls.sql` và dán vào cửa sổ truy vấn.
6. Nhấn nút **RUN** (hoặc `Ctrl + Enter`).

### Cách 2: Sử dụng Supabase CLI
```bash
# Đăng nhập Supabase CLI
supabase login

# Liên kết với dự án từ xa
supabase link --project-ref <your-project-ref>

# Đẩy migration lên database
supabase db push
```
