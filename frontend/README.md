# SmartCRM — Frontend (React 19 + TypeScript + Vite + Supabase)

Giao diện quản lý quan hệ khách hàng và đường ống cơ hội kinh doanh hiệu năng cao **SmartCRM**, tích hợp cơ sở dữ liệu **Supabase (PostgreSQL + Row Level Security)** và hệ thống linting siêu tốc **Oxlint**.

---

## 1. Công nghệ & Kiến trúc

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite 8](https://vite.dev/) với `@vitejs/plugin-react`
- **Linter:** [Oxlint](https://oxc.rs/) (Oxc linter tốc độ cao)
- **Database & Auth:** [Supabase](https://supabase.com/) (`@supabase/supabase-js` v2)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Bảo mật:** Row Level Security (RLS) ở tầng PostgreSQL, bảo vệ 100% dữ liệu ở cấp cơ sở dữ liệu.

---

## 2. Cấu trúc thư mục

```text
frontend/
├── .env.example               # Mẫu cấu hình biến môi trường (không chứa secret)
├── .oxlintrc.json             # Cấu hình Oxlint linter
├── package.json               # Dependencies & npm scripts
├── tsconfig.json              # Cấu hình TypeScript
├── vite.config.ts             # Cấu hình Vite dev server & proxy
└── src/
    ├── components/            # UI components tái sử dụng (Sidebar, TopNav, Banner, SetupModal)
    ├── layouts/               # Cấu trúc bố cục trang (MainLayout)
    ├── pages/                 # Các trang nghiệp vụ (Login, Dashboard, Customers, Deals, PerfLab, ...)
    ├── hooks/                 # Custom React Hooks (useAuth, useCustomers, useDeals, useSupabaseStatus)
    ├── services/              # Tầng dịch vụ gọi Supabase SDK (supabase.ts, authService, customerService, dealService, ...)
    ├── types/                 # Định nghĩa TypeScript domain & Supabase Database types
    └── utils/                 # Hàm tiện ích (format tiền tệ VNĐ, ngày tháng, badge trạng thái)
```

---

## 3. Hướng dẫn cài đặt & Cấu hình môi trường

### Bước 1: Cài đặt dependencies
```bash
cd frontend
npm install
```

### Bước 2: Thiết lập biến môi trường
Sao chép file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Mở file `.env` và điền thông tin từ dự án Supabase của bạn:
```env
# Supabase Project URL (Lấy từ Dashboard -> Project Settings -> API)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Public Anon Key (Khóa an toàn dùng cho trình duyệt / Frontend)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
```

> **Lưu ý bảo mật:**
> - Tuyệt đối **KHÔNG** đưa `service_role` secret key vào frontend hay commit lên Git.
> - `VITE_SUPABASE_ANON_KEY` là khóa công khai an toàn cho trình duyệt; việc phân quyền được kiểm soát chặt chẽ bằng chính sách **Row Level Security (RLS)** trên cơ sở dữ liệu.

---

## 4. Chạy Supabase Migrations & Row Level Security (RLS)

Để tạo đầy đủ bảng, quan hệ, chỉ mục tối ưu hóa và chính sách phân quyền dữ liệu RLS:

1. Đăng nhập [Supabase Dashboard](https://supabase.com/dashboard) và chọn dự án của bạn.
2. Mở tab **SQL Editor** &rarr; **New query**.
3. Mở file migration tại thư mục gốc dự án:
   `supabase/migrations/20261019000001_smartcrm_schema_and_rls.sql`
4. Dán toàn bộ nội dung file và nhấn **Run** (hoặc `Ctrl + Enter`).
5. Migration sẽ tự động:
   - Tạo các bảng: `roles`, `users`, `user_roles`, `customers`, `customer_interactions`, `deals`, `deal_stage_history`, `audit_logs`, `performance_benchmarks`.
   - Tạo chỉ mục Composite B-Tree Indexes phục vụ truy vấn tốc độ cao.
   - Tạo trigger tự động đồng bộ tài khoản `auth.users` sang bảng `public.users` và gán vai trò người dùng.
   - Kích hoạt **Row Level Security (RLS)** và áp dụng các chính sách: chỉ Admin/Manager mới có quyền xóa khách hàng/cơ hội, bảo vệ dữ liệu ở tầng CSDL thay vì chỉ ẩn nút trên giao diện.

---

## 5. Chế độ xem trước (Configuration Standby / Preview Mode)

- Nếu bạn chưa có dự án Supabase hoặc chưa cấu hình biến môi trường trong `.env`, ứng dụng sẽ tự động kích hoạt **Chế độ xem trước (Preview Mode)**.
- Giao diện hiển thị thanh thông báo minh bạch, cho phép bạn trải nghiệm đầy đủ các phân hệ (Bảng điều khiển KPIs, Danh sách khách hàng, Kanban đường ống cơ hội bán hàng, Performance Lab) với dữ liệu mẫu trực quan.
- Khi cần kết nối thật, chỉ cần nhấn nút **"Hướng dẫn cấu hình kết nối"** trên thanh banner để mở cửa sổ hướng dẫn từng bước.

---

## 6. Các lệnh chạy dự án (Scripts)

| Lệnh | Chức năng |
| :--- | :--- |
| `npm run dev` | Khởi động Vite Development Server tại `http://localhost:5173` |
| `npm run build` | Kiểm tra kiểu TypeScript (`tsc -b`) và đóng gói mã nguồn production |
| `npm run lint` | Chạy linter Oxlint kiểm tra cú pháp và quy chuẩn React/TypeScript |
| `npm run preview` | Xem trước bản build production tại máy cục bộ |
