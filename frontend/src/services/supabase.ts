import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lấy thông tin kết nối Supabase từ biến môi trường Vite
const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
// Chuẩn hóa: loại bỏ trailing slash và /rest/v1 nếu người dùng copy từ REST endpoint
const supabaseUrl = rawUrl
  ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * Kiểm tra xem các biến môi trường kết nối Supabase đã được cung cấp hợp lệ hay chưa.
 * Không chấp nhận các giá trị rỗng hoặc giá trị placeholder mẫu.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }
  
  if (
    supabaseUrl.includes('your-project-ref') ||
    supabaseUrl.includes('your-project-id') ||
    supabaseAnonKey.includes('your-anon-key-placeholder') ||
    supabaseAnonKey.includes('your-anon-token-placeholder')
  ) {
    return false;
  }

  try {
    const parsed = new URL(supabaseUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Khởi tạo Supabase client.
 * Nếu chưa cấu hình, gán null để giao diện kích hoạt trạng thái chờ (Configuration Standby Mode).
 */
export const supabase: SupabaseClient<any> | null = isSupabaseConfigured()
  ? createClient<any>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Lấy Supabase client một cách an toàn. Ném ngoại lệ có thông điệp hướng dẫn nếu chưa cấu hình.
 */
export function getSupabaseClient(): SupabaseClient<any> {
  if (!supabase) {
    throw new Error(
      'Supabase client chưa được khởi tạo. Vui lòng cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env'
    );
  }
  return supabase;
}

export const SUPABASE_URL = supabaseUrl || '';
export const SUPABASE_ANON_KEY = supabaseAnonKey || '';
