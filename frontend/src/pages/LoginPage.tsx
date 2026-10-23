import React, { useState } from 'react';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, Database, AlertCircle, Info } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { SupabaseSetupModal } from '../components/SupabaseSetupModal';
import type { User } from '../types';

export const LoginPage: React.FC = () => {
  const { login, isSupabaseConnected } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [email, setEmail] = useState('admin@smartcrm.dev');
  const [password, setPassword] = useState('Admin@123');
  const [fullName, setFullName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập email và mật khẩu');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSupabaseConnected) {
        if (isRegisterMode) {
          if (!fullName.trim()) {
            setErrorMessage('Vui lòng nhập họ và tên khi đăng ký');
            setLoading(false);
            return;
          }
          await authService.register(email.trim(), password, fullName.trim());
          showSuccess('Đăng ký tài khoản thành công! Vui lòng kiểm tra email xác nhận nếu Supabase bật tính năng xác thực email.');
          setIsRegisterMode(false);
        } else {
          const user = await authService.login(email.trim(), password);
          login('supabase_session_token', user);
          showSuccess(`Đăng nhập thành công! Chào mừng ${user.fullName}`);
        }
      } else {
        // Chế độ xem trước (Preview Mode) khi chưa cấu hình Supabase
        const mockUser: User = {
          id: email.includes('manager') ? 2 : email.includes('sales') ? 3 : 1,
          username: email.split('@')[0],
          email: email.trim(),
          fullName: email.includes('manager')
            ? 'Nguyễn Thế Dũng (Trưởng Phòng)'
            : email.includes('sales')
            ? 'Trần Thu Hà (Chuyên Viên Sales)'
            : 'Quản Trị Viên Hệ Thống',
          roles: email.includes('manager')
            ? ['ROLE_MANAGER']
            : email.includes('sales')
            ? ['ROLE_SALES']
            : ['ROLE_ADMIN', 'ROLE_MANAGER'],
          active: true,
          isDemo: true,
          createdAt: new Date().toISOString(),
        };
        login('preview_token', mockUser);
        showSuccess(`Đăng nhập chế độ xem trước với quyền ${mockUser.roles.join(', ')}`);
      }
    } catch (err: any) {
      let msg = err?.message || 'Đăng nhập không thành công';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Tài khoản chưa được tạo trong Supabase Auth hoặc sai mật khẩu. Vui lòng bấm "Đăng ký người dùng mới" bên dưới, hoặc chạy file supabase/seed_demo_accounts.sql trong Supabase SQL Editor.';
      }
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (uEmail: string, uPass: string) => {
    setEmail(uEmail);
    setPassword(uPass);
    setErrorMessage(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0f172a',
            padding: '32px 28px',
            color: '#ffffff',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Building2 size={28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            SmartCRM Platform
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
            Hệ thống quản lý khách hàng và bán hàng nền tảng Supabase
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: isSupabaseConnected ? '#f0fdf4' : '#fffbeb',
            borderBottom: isSupabaseConnected ? '1px solid #bbf7d0' : '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSupabaseConnected ? (
              <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={15} /> Supabase Auth: Đã kích hoạt
              </span>
            ) : (
              <span style={{ color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={15} /> Supabase: Chưa cấu hình .env (Chế độ xem trước)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowSetupModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Database size={13} />
            <span>Hướng dẫn</span>
          </button>
        </div>

        <div style={{ padding: '28px' }}>
          {errorMessage && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {isRegisterMode && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email đăng nhập
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <div className="loading-spinner" style={{ width: '18px', height: '18px' }} />
              ) : (
                <>
                  <span>{isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập vào SmartCRM'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {isSupabaseConnected && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setErrorMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {isRegisterMode ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký người dùng mới'}
              </button>
            </div>
          )}

          {/* Quick Demo Pickers */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Info size={14} color="#64748b" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Chọn nhanh tài khoản mẫu:
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => selectDemoAccount('admin@smartcrm.dev', 'Admin@123')}
                style={{
                  padding: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Admin</div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Toàn quyền</div>
              </button>
              <button
                type="button"
                onClick={() => selectDemoAccount('manager@smartcrm.dev', 'Manager@123')}
                style={{
                  padding: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Manager</div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Quản lý</div>
              </button>
              <button
                type="button"
                onClick={() => selectDemoAccount('sales@smartcrm.dev', 'Sales@123')}
                style={{
                  padding: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Sales</div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Nhân viên</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <SupabaseSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
    </div>
  );
};
