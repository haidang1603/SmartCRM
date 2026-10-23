import { supabase, isSupabaseConfigured } from './supabase';
import type { User, RoleName } from '../types';

export interface AuthStateResult {
  user: User | null;
  token: string | null;
  error?: string | null;
}

export const authService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async getSession(): Promise<{ token: string | null; userId: string | null }> {
    if (!supabase) return { token: null, userId: null };
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return { token: null, userId: null };
    }
    return {
      token: data.session.access_token,
      userId: data.session.user.id,
    };
  },

  async getCurrentProfile(): Promise<User | null> {
    if (!supabase) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) return null;

    // Truy vấn profile từ bảng users dựa vào email
    const { data: profileData } = await (supabase as any)
      .from('users')
      .select('id, username, email, full_name, phone_number, active, is_demo, created_at')
      .eq('email', authUser.email || '')
      .maybeSingle();

    const profile: any = profileData;

    if (profile) {
      // Truy vấn vai trò từ user_roles và roles
      const { data: roleRecords } = await (supabase as any)
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', profile.id);

      const roles: RoleName[] = (roleRecords || [])
        .map((r: any) => r.roles?.name as RoleName)
        .filter(Boolean);

      return {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        fullName: profile.full_name,
        phoneNumber: profile.phone_number || undefined,
        roles: roles.length > 0 ? roles : ['ROLE_SALES'],
        active: profile.active,
        isDemo: profile.is_demo,
        createdAt: profile.created_at,
      };
    }

    // Nếu người dùng mới đăng ký qua Supabase Auth mà chưa có bản ghi trong bảng users
    return {
      id: 9999,
      username: authUser.email?.split('@')[0] || 'user',
      email: authUser.email || '',
      fullName: (authUser.user_metadata?.full_name as string) || authUser.email?.split('@')[0] || 'User',
      roles: ['ROLE_SALES'],
      active: true,
      isDemo: false,
      createdAt: authUser.created_at,
    };
  },

  async login(email: string, password: string): Promise<User> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình. Vui lòng thêm biến môi trường trong .env');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Đăng nhập thất bại: Không nhận được dữ liệu người dùng');
    }

    const profile = await this.getCurrentProfile();
    if (!profile) {
      throw new Error('Không thể tải thông tin tài khoản người dùng');
    }

    return profile;
  },

  async register(email: string, password: string, fullName: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  async logout(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut();
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    if (!supabase) return { unsubscribe: () => {} };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        callback(null);
      } else {
        const profile = await authService.getCurrentProfile();
        callback(profile);
      }
    });

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  },
};
