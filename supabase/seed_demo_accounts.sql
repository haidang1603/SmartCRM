-- ==============================================================================
-- SMARTCRM — MÃ SQL TẠO TRỰC TIẾP TÀI KHOẢN VÀO SUPABASE AUTH & IDENTITIES
-- Đã sửa kiểu cột id trong auth.identities sang UUID
-- ==============================================================================

-- 1. Bật extension pgcrypto để băm mật khẩu
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Gỡ bỏ NOT NULL cho cột password trong public.users
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN password SET DEFAULT '';

-- 3. Cập nhật Trigger tự động gán role khi có user mới
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id BIGINT;
  v_role_id BIGINT;
BEGIN
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

  IF NEW.email LIKE 'admin%' THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'ROLE_ADMIN';
  ELSIF NEW.email LIKE 'manager%' THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'ROLE_MANAGER';
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. DỌN DẸP CÁC TÀI KHOẢN CŨ NẾU CÓ
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('admin@smartcrm.dev', 'manager@smartcrm.dev', 'sales@smartcrm.dev'));
DELETE FROM auth.users WHERE email IN ('admin@smartcrm.dev', 'manager@smartcrm.dev', 'sales@smartcrm.dev');

-- 5. TẠO TÀI KHOẢN VÀO AUTH.USERS VÀ AUTH.IDENTITIES
DO $$
DECLARE
  v_admin_id UUID := gen_random_uuid();
  v_manager_id UUID := gen_random_uuid();
  v_sales_id UUID := gen_random_uuid();
BEGIN

  -- --------------------------------------------------------------------------
  -- 5.1. TẠO ADMIN (admin@smartcrm.dev / Admin@123)
  -- --------------------------------------------------------------------------
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, reauthentication_token,
    phone, phone_change, phone_change_token, is_super_admin, is_sso_user, is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
    'admin@smartcrm.dev', crypt('Admin@123', gen_salt('bf')),
    now(), NULL, now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Quản Trị Viên Hệ Thống"}'::jsonb,
    now(), now(),
    '', '', '', '', '', '',
    NULL, '', '', FALSE, FALSE, FALSE
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_admin_id, v_admin_id,
    jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@smartcrm.dev'),
    'email', v_admin_id::text, now(), now(), now()
  );

  -- --------------------------------------------------------------------------
  -- 5.2. TẠO MANAGER (manager@smartcrm.dev / Manager@123)
  -- --------------------------------------------------------------------------
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, reauthentication_token,
    phone, phone_change, phone_change_token, is_super_admin, is_sso_user, is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_manager_id, 'authenticated', 'authenticated',
    'manager@smartcrm.dev', crypt('Manager@123', gen_salt('bf')),
    now(), NULL, now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Nguyễn Thế Dũng (Trưởng Phòng)"}'::jsonb,
    now(), now(),
    '', '', '', '', '', '',
    NULL, '', '', FALSE, FALSE, FALSE
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_manager_id, v_manager_id,
    jsonb_build_object('sub', v_manager_id::text, 'email', 'manager@smartcrm.dev'),
    'email', v_manager_id::text, now(), now(), now()
  );

  -- --------------------------------------------------------------------------
  -- 5.3. TẠO SALES (sales@smartcrm.dev / Sales@123)
  -- --------------------------------------------------------------------------
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, reauthentication_token,
    phone, phone_change, phone_change_token, is_super_admin, is_sso_user, is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_sales_id, 'authenticated', 'authenticated',
    'sales@smartcrm.dev', crypt('Sales@123', gen_salt('bf')),
    now(), NULL, now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Trần Thu Hà (Chuyên Viên Sales)"}'::jsonb,
    now(), now(),
    '', '', '', '', '', '',
    NULL, '', '', FALSE, FALSE, FALSE
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_sales_id, v_sales_id,
    jsonb_build_object('sub', v_sales_id::text, 'email', 'sales@smartcrm.dev'),
    'email', v_sales_id::text, now(), now(), now()
  );

END $$;

-- 6. GÁN VAI TRÒ CHUẨN TRONG PUBLIC
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id FROM public.users u JOIN public.roles r ON r.name = 'ROLE_ADMIN'
WHERE u.email = 'admin@smartcrm.dev' ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id FROM public.users u JOIN public.roles r ON r.name = 'ROLE_MANAGER'
WHERE u.email = 'manager@smartcrm.dev' ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id FROM public.users u JOIN public.roles r ON r.name = 'ROLE_SALES'
WHERE u.email = 'sales@smartcrm.dev' ON CONFLICT (user_id, role_id) DO NOTHING;

-- 7. TẢI LẠI SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
