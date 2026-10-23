import { supabase, isSupabaseConfigured } from './supabase';
import type { User, RoleName } from '../types';

export interface CreateUserData {
  username: string;
  email: string;
  password?: string;
  fullName: string;
  phoneNumber?: string;
  roles: string[];
}

export interface UpdateUserData {
  fullName: string;
  phoneNumber?: string;
  roles: string[];
  active: boolean;
}

const FALLBACK_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@smartcrm.dev',
    fullName: 'Quản Trị Viên Hệ Thống',
    phoneNumber: '0901000001',
    roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
    active: true,
    isDemo: true,
    createdAt: '2026-10-15T17:09:46.447021',
  },
  {
    id: 2,
    username: 'manager',
    email: 'manager@smartcrm.dev',
    fullName: 'Nguyễn Thế Dũng (Trưởng Phòng)',
    phoneNumber: '0901000002',
    roles: ['ROLE_MANAGER'],
    active: true,
    isDemo: true,
    createdAt: '2026-10-15T17:09:46.447021',
  },
  {
    id: 3,
    username: 'sales',
    email: 'sales@smartcrm.dev',
    fullName: 'Trần Thu Hà (Chuyên Viên Sales)',
    phoneNumber: '0901000003',
    roles: ['ROLE_SALES'],
    active: true,
    isDemo: true,
    createdAt: '2026-10-15T17:09:46.447021',
  },
];

export const userService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async list(): Promise<User[]> {
    if (!supabase || !isSupabaseConfigured()) {
      return FALLBACK_USERS;
    }

    try {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, username, email, full_name, phone_number, active, is_demo, created_at')
        .order('id');

      if (userError || !users || users.length === 0) {
        return FALLBACK_USERS;
      }

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, roles(name)');

      const roleMap: Record<number, RoleName[]> = {};
      (userRoles || []).forEach((ur: any) => {
        if (!roleMap[ur.user_id]) roleMap[ur.user_id] = [];
        if (ur.roles?.name) {
          roleMap[ur.user_id].push(ur.roles.name as RoleName);
        }
      });

      return users.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.full_name,
        phoneNumber: u.phone_number || undefined,
        roles: roleMap[u.id] && roleMap[u.id].length > 0 ? roleMap[u.id] : ['ROLE_SALES'],
        active: u.active ?? true,
        isDemo: u.is_demo ?? false,
        createdAt: u.created_at || new Date().toISOString(),
      }));
    } catch {
      return FALLBACK_USERS;
    }
  },

  async active(): Promise<User[]> {
    const all = await this.list();
    return all.filter((u) => u.active);
  },

  async create(data: CreateUserData): Promise<User> {
    if (!supabase || !isSupabaseConfigured()) {
      const mockUser: User = {
        id: Date.now(),
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        roles: data.roles as RoleName[],
        active: true,
        isDemo: false,
        createdAt: new Date().toISOString(),
      };
      return mockUser;
    }

    // 1. Tạo bản ghi trong public.users
    const { data: newUsers, error: userError } = await supabase
      .from('users')
      .insert({
        username: data.username,
        email: data.email,
        password: '',
        full_name: data.fullName,
        phone_number: data.phoneNumber || null,
        active: true,
        is_demo: false,
      })
      .select();

    if (userError) {
      throw new Error(`Lỗi tạo thành viên: ${userError.message}`);
    }

    const createdUser = newUsers[0];

    // 2. Gán quyền trong user_roles nếu có
    if (data.roles && data.roles.length > 0) {
      try {
        const { data: roles } = await supabase.from('roles').select('id, name');
        if (roles) {
          const roleIds = roles
            .filter((r: any) => data.roles.includes(r.name))
            .map((r: any) => ({ user_id: createdUser.id, role_id: r.id }));
          if (roleIds.length > 0) {
            await supabase.from('user_roles').insert(roleIds);
          }
        }
      } catch {
        // bỏ qua lỗi user_roles nếu RLS bảng này cần phân quyền admin
      }
    }

    return {
      id: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
      fullName: createdUser.full_name,
      phoneNumber: createdUser.phone_number || undefined,
      roles: data.roles as RoleName[],
      active: createdUser.active,
      isDemo: createdUser.is_demo,
      createdAt: createdUser.created_at,
    };
  },

  async update(id: number, data: UpdateUserData): Promise<User> {
    if (!supabase || !isSupabaseConfigured()) {
      return {
        id,
        username: `user_${id}`,
        email: `user_${id}@smartcrm.dev`,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        roles: data.roles as RoleName[],
        active: data.active,
        isDemo: false,
        createdAt: new Date().toISOString(),
      };
    }

    const { data: updatedUsers, error: updateError } = await supabase
      .from('users')
      .update({
        full_name: data.fullName,
        phone_number: data.phoneNumber || null,
        active: data.active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (updateError) {
      throw new Error(`Lỗi cập nhật người dùng: ${updateError.message}`);
    }

    // Cập nhật phân quyền
    if (data.roles && data.roles.length > 0) {
      try {
        const { data: roles } = await supabase.from('roles').select('id, name');
        if (roles) {
          await supabase.from('user_roles').delete().eq('user_id', id);
          const roleIds = roles
            .filter((r: any) => data.roles.includes(r.name))
            .map((r: any) => ({ user_id: id, role_id: r.id }));
          if (roleIds.length > 0) {
            await supabase.from('user_roles').insert(roleIds);
          }
        }
      } catch {
        // Ghi nhận mềm nếu bảng user_roles chưa mở chính sách ALL
      }
    }

    const u = updatedUsers && updatedUsers[0] ? updatedUsers[0] : { id, full_name: data.fullName };

    return {
      id,
      username: u.username || `user_${id}`,
      email: u.email || '',
      fullName: u.full_name,
      phoneNumber: u.phone_number || data.phoneNumber,
      roles: data.roles as RoleName[],
      active: data.active,
      isDemo: u.is_demo ?? false,
      createdAt: u.created_at || new Date().toISOString(),
    };
  },

  async delete(id: number): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) {
      return true;
    }

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      throw new Error(`Lỗi xóa người dùng: ${error.message}`);
    }
    return true;
  },
};
