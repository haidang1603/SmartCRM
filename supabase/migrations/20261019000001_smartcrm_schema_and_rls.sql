-- ==============================================================================
-- SMARTCRM — SUPABASE MIGRATION (SCHEMA DEFINITION & ROW LEVEL SECURITY - RLS)
-- Version: 20261019000001
-- Description: Khởi tạo toàn bộ bảng, quan hệ, chỉ mục tối ưu, trigger đồng bộ
--              auth.users và chính sách phân quyền dữ liệu chặt chẽ ở tầng CSDL (RLS)
-- ==============================================================================

-- 1. BẢNG ROLES (Vai trò quyền hạn người dùng)
CREATE TABLE IF NOT EXISTS public.roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(150)
);

-- 2. BẢNG USERS (Hồ sơ người dùng ứng dụng)
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT '',
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(30),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. BẢNG USER_ROLES (Liên kết Người dùng - Vai trò)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE
);

-- 4. BẢNG CUSTOMERS (Khách hàng tiềm năng & Đối tác)
CREATE TABLE IF NOT EXISTS public.customers (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone_number VARCHAR(30),
    company_name VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'LEAD',
    assigned_to_id BIGINT,
    notes VARCHAR(2000),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_customer_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- 5. BẢNG CUSTOMER_INTERACTIONS (Lịch sử tương tác chăm sóc khách hàng)
CREATE TABLE IF NOT EXISTS public.customer_interactions (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    interaction_type VARCHAR(30) NOT NULL,
    summary VARCHAR(200) NOT NULL,
    details TEXT,
    performed_by_id BIGINT,
    interaction_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_interaction_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_interaction_user FOREIGN KEY (performed_by_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- 6. BẢNG DEALS (Đường ống cơ hội bán hàng & Doanh số)
CREATE TABLE IF NOT EXISTS public.deals (
    id BIGSERIAL PRIMARY KEY,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_deals_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_deals_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- 7. BẢNG DEAL_STAGE_HISTORY (Lịch sử chuyển đổi giai đoạn)
CREATE TABLE IF NOT EXISTS public.deal_stage_history (
    id BIGSERIAL PRIMARY KEY,
    deal_id BIGINT NOT NULL,
    previous_stage VARCHAR(30),
    new_stage VARCHAR(30) NOT NULL,
    changed_by_id BIGINT,
    change_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    comment VARCHAR(500),
    CONSTRAINT fk_dsh_deal FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE,
    CONSTRAINT fk_dsh_user FOREIGN KEY (changed_by_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- 8. BẢNG AUDIT_LOGS (Nhật ký kiểm toán an toàn hệ thống - Bất biến Append-Only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(60) NOT NULL,
    entity_name VARCHAR(60) NOT NULL,
    entity_id BIGINT,
    performed_by VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ip_address VARCHAR(60)
);

-- 9. BẢNG PERFORMANCE_BENCHMARKS (Lưu trữ phiên đo kiểm và chỉ số SLA/SLO)
CREATE TABLE IF NOT EXISTS public.performance_benchmarks (
    id BIGSERIAL PRIMARY KEY,
    run_uuid VARCHAR(64) NOT NULL UNIQUE,
    scenario_name VARCHAR(60) NOT NULL,
    run_type VARCHAR(30) NOT NULL,
    environment VARCHAR(60) NOT NULL DEFAULT 'SUPABASE_CLIENT',
    virtual_users INT NOT NULL DEFAULT 1,
    iterations INT NOT NULL DEFAULT 50,
    total_requests INT NOT NULL,
    successful_requests INT NOT NULL,
    failed_requests INT NOT NULL DEFAULT 0,
    duration_ms BIGINT NOT NULL,
    throughput_rps DOUBLE PRECISION NOT NULL,
    min_latency_ms DOUBLE PRECISION NOT NULL,
    avg_latency_ms DOUBLE PRECISION NOT NULL,
    p50_latency_ms DOUBLE PRECISION NOT NULL,
    p95_latency_ms DOUBLE PRECISION NOT NULL,
    p99_latency_ms DOUBLE PRECISION NOT NULL,
    max_latency_ms DOUBLE PRECISION NOT NULL,
    error_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    cpu_usage_pct DOUBLE PRECISION,
    memory_used_mb DOUBLE PRECISION,
    cache_hit_ratio DOUBLE PRECISION,
    executed_by VARCHAR(100) NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- CHỈ MỤC TỐI ƯU HIỆU NĂNG TRUY VẤN (INDEXES)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON public.customers(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_customers_status_created ON public.customers(status, created_at);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_customer_id ON public.deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to_id ON public.deals(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_created ON public.deals(stage, created_at);
CREATE INDEX IF NOT EXISTS idx_ci_customer_id ON public.customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_dsh_deal_id ON public.deal_stage_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_perf_created_at ON public.performance_benchmarks(created_at DESC);

-- ==============================================================================
-- DỮ LIỆU DANH MỤC BAN ĐẦU (ROLES)
-- ==============================================================================
INSERT INTO public.roles (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Quản trị viên toàn quyền hệ thống'),
(2, 'ROLE_MANAGER', 'Quản lý phòng kinh doanh và giám sát đội ngũ'),
(3, 'ROLE_SALES', 'Nhân viên kinh doanh quản lý khách hàng và cơ hội')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- HÀM TIỆN ÍCH PHÂN QUYỀN VÀ BẢO MẬT (HELPER FUNCTIONS)
-- ==============================================================================

-- Kiểm tra người dùng hiện tại có vai trò Quản lý hoặc Quản trị viên không
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    JOIN public.roles r ON ur.role_id = r.id
    WHERE u.email = (auth.jwt() ->> 'email')
      AND r.name IN ('ROLE_ADMIN', 'ROLE_MANAGER')
  );
$$;

-- Lấy ID người dùng nội bộ ứng dụng từ JWT Auth Email
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.users WHERE email = (auth.jwt() ->> 'email') LIMIT 1;
$$;

-- Trigger tự động đồng bộ auth.users vào public.users khi đăng ký tài khoản Supabase
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id BIGINT;
  v_role_id BIGINT;
BEGIN
  -- Tạo bản ghi trong public.users
  INSERT INTO public.users (username, email, password, full_name, active, is_demo)
  VALUES (
    split_part(NEW.email, '@', 1),
    NEW.email,
    '',
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    TRUE,
    FALSE
  )
  ON CONFLICT (email) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        updated_at = timezone('utc'::text, now())
  RETURNING id INTO v_user_id;

  -- Gán quyền mặc định ROLE_SALES (hoặc ROLE_ADMIN nếu là tài khoản admin)
  IF NEW.email LIKE 'admin%' THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'ROLE_ADMIN';
  ELSE
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'ROLE_SALES';
  END IF;

  IF v_user_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (v_user_id, v_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Kích hoạt trigger trên auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- KÍCH HOẠT ROW LEVEL SECURITY (RLS) TRÊN TOÀN BỘ CÁC BẢNG
-- Không xem việc ẩn nút trên giao diện là cơ chế bảo mật!
-- ==============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES: ROLES & USER_ROLES
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow authenticated read roles"
  ON public.roles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow authenticated read user_roles"
  ON public.user_roles FOR SELECT
  TO authenticated, anon
  USING (true);

-- ------------------------------------------------------------------------------
-- RLS POLICIES: USERS
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow users to read user profiles"
  ON public.users FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow users to update own profile or admin/manager"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    email = (auth.jwt() ->> 'email') OR public.is_admin_or_manager()
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: CUSTOMERS
-- ------------------------------------------------------------------------------
-- SELECT: Người dùng đã đăng nhập hoặc chế độ xem trước có thể đọc khách hàng
CREATE POLICY "Allow authenticated users to read customers"
  ON public.customers FOR SELECT
  TO authenticated, anon
  USING (true);

-- INSERT: Người dùng đã xác thực được tạo khách hàng mới
CREATE POLICY "Allow authenticated users to insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Người được phân công phụ trách HOẶC Quản lý / Quản trị viên mới được cập nhật
CREATE POLICY "Allow assigned user or manager to update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (
    assigned_to_id = public.current_app_user_id()
    OR public.is_admin_or_manager()
    OR assigned_to_id IS NULL
  );

-- DELETE: Chỉ có Quản trị viên hoặc Quản lý mới có quyền xóa khách hàng
CREATE POLICY "Only admin and manager can delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: CUSTOMER_INTERACTIONS
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow read customer interactions"
  ON public.customer_interactions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert customer interactions"
  ON public.customer_interactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- RLS POLICIES: DEALS
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow authenticated read deals"
  ON public.deals FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow authenticated insert deals"
  ON public.deals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow assigned user or manager to update deals"
  ON public.deals FOR UPDATE
  TO authenticated
  USING (
    assigned_to_id = public.current_app_user_id()
    OR public.is_admin_or_manager()
    OR assigned_to_id IS NULL
  );

CREATE POLICY "Only admin and manager can delete deals"
  ON public.deals FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: DEAL_STAGE_HISTORY
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow read deal stage history"
  ON public.deal_stage_history FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert deal stage history"
  ON public.deal_stage_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- RLS POLICIES: AUDIT_LOGS (Bảo mật tối đa: Chỉ Admin/Manager đọc, không thể Update/Delete)
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow admin and manager to read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager());

CREATE POLICY "Allow authenticated insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- RLS POLICIES: PERFORMANCE_BENCHMARKS
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow read performance benchmarks"
  ON public.performance_benchmarks FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow authenticated insert performance benchmarks"
  ON public.performance_benchmarks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Hoàn tất thiết lập Schema & Row Level Security (RLS) cho SmartCRM trên Supabase!
