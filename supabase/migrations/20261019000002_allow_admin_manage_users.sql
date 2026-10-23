-- ==============================================================================
-- SMARTCRM — MIGRATION: BỔ SUNG CHÍNH SÁCH RLS CHO PHÉP QUẢN TRỊ THÀNH VIÊN
-- Bảng áp dụng: public.users, public.user_roles
-- ==============================================================================

-- 1. Bổ sung quyền INSERT và DELETE cho bảng public.users đối với người dùng xác thực
CREATE POLICY "Allow authenticated insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete users"
  ON public.users FOR DELETE
  TO authenticated
  USING (true);

-- 2. Bổ sung quyền INSERT, UPDATE, DELETE cho bảng public.user_roles đối với người dùng xác thực
CREATE POLICY "Allow authenticated manage user_roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Tải lại bộ nhớ đệm PostgREST
NOTIFY pgrst, 'reload schema';
