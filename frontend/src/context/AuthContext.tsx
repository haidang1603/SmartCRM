import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, RoleName } from '../types';
import { authService } from '../services/authService';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  hasRole: (role: RoleName | RoleName[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isSales: () => boolean;
  isSupabaseConnected: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smartcrm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('smartcrm_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const isSupabaseConnected = authService.isConfigured();

  useEffect(() => {
    if (isSupabaseConnected) {
      // Khi đã cấu hình Supabase, đồng bộ auth state từ Supabase
      authService.getCurrentProfile().then((profile) => {
        if (profile) {
          setUser(profile);
          localStorage.setItem('smartcrm_user', JSON.stringify(profile));
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      const { unsubscribe } = authService.onAuthStateChange((updatedUser) => {
        setUser(updatedUser);
        if (updatedUser) {
          localStorage.setItem('smartcrm_user', JSON.stringify(updatedUser));
        } else {
          localStorage.removeItem('smartcrm_user');
          localStorage.removeItem('smartcrm_token');
        }
      });

      return () => {
        unsubscribe();
      };
    } else {
      // Khi chưa cấu hình Supabase: nạp từ session lưu trữ hoặc tạo tài khoản demo ban đầu
      const savedUser = localStorage.getItem('smartcrm_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      } else {
        // Cho phép trải nghiệm thử giao diện demo trong lúc chờ cấu hình Supabase
        const demoUser: User = {
          id: 1,
          username: 'admin',
          email: 'admin@smartcrm.dev',
          fullName: 'Quản Trị Viên (Preview Mode)',
          roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
          active: true,
          isDemo: true,
          createdAt: new Date().toISOString(),
        };
        setUser(demoUser);
        localStorage.setItem('smartcrm_user', JSON.stringify(demoUser));
      }
      setLoading(false);
    }
  }, [isSupabaseConnected]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('smartcrm_token', newToken);
    localStorage.setItem('smartcrm_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      if (isSupabaseConnected) {
        await authService.logout();
      }
    } catch {
      // Bỏ qua lỗi logout nếu phiên không hợp lệ
    } finally {
      localStorage.removeItem('smartcrm_token');
      localStorage.removeItem('smartcrm_user');
      setToken(null);
      setUser(null);
    }
  };

  const hasRole = (roles: RoleName | RoleName[]): boolean => {
    if (!user || !user.roles) return false;
    const checkRoles = Array.isArray(roles) ? roles : [roles];
    return user.roles.some((r) => checkRoles.includes(r));
  };

  const isAdmin = (): boolean => hasRole('ROLE_ADMIN');
  const isManager = (): boolean => hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']);
  const isSales = (): boolean => hasRole('ROLE_SALES');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        hasRole,
        isAdmin,
        isManager,
        isSales,
        isSupabaseConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
