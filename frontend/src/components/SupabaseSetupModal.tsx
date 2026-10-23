import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, Database, ShieldAlert, Terminal } from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const envSample = `# frontend/.env
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderRadius: '16px 16px 0 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#3ecf8e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a',
                fontWeight: 700,
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Hướng dẫn kết nối Supabase cho SmartCRM
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                Cấu hình Row Level Security (RLS) và biến môi trường Vite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', gap: '14px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              1
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                Tạo dự án trên Supabase Cloud
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Truy cập{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Supabase Dashboard <ExternalLink size={13} />
                </a>{' '}
                và tạo một Project mới (hoàn toàn miễn phí).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ display: 'flex', gap: '14px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              2
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                Chạy file Migration Schema & RLS
              </h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Trong Supabase Dashboard, chọn mục <strong>SQL Editor</strong> &rarr; <strong>New query</strong>.
                Mở file migration đã được chuẩn bị tại:
              </p>
              <div
                style={{
                  backgroundColor: '#f1f5f9',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>supabase/migrations/20261019000001_smartcrm_schema_and_rls.sql</span>
                <button
                  onClick={() => copyToClipboard('supabase/migrations/20261019000001_smartcrm_schema_and_rls.sql', 'path')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                  }}
                >
                  {copiedSection === 'path' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                </button>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Dán nội dung và bấm <strong>Run</strong> để tự động tạo toàn bộ bảng, composite indexes, trigger profile và RLS Policies an toàn.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ display: 'flex', gap: '14px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              3
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                Cấu hình biến môi trường Frontend (.env)
              </h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Trong Supabase Dashboard, vào <strong>Project Settings &rarr; API</strong>, sao chép <strong>Project URL</strong> và <strong>anon / public key</strong>.
                Tạo file <code>frontend/.env</code> với nội dung:
              </p>
              <div
                style={{
                  backgroundColor: '#0f172a',
                  color: '#e2e8f0',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  position: 'relative',
                  overflowX: 'auto',
                }}
              >
                <button
                  onClick={() => copyToClipboard(envSample, 'env')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                  }}
                >
                  {copiedSection === 'env' ? <Check size={14} color="#3ecf8e" /> : <Copy size={14} />}
                  <span>{copiedSection === 'env' ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{envSample}</pre>
              </div>
            </div>
          </div>

          {/* Security Alert */}
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <ShieldAlert size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.5 }}>
              <strong>Lưu ý bảo mật tối quan trọng:</strong> Chỉ sử dụng <code>anon public key</code> trong frontend. Tuyệt đối không đưa <code>service_role key</code> hoặc mật khẩu database vào frontend hoặc Git repository. Phân quyền và bảo mật dữ liệu được đảm bảo an toàn ở tầng cơ sở dữ liệu bởi <strong>Row Level Security (RLS)</strong>.
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ display: 'flex', gap: '14px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              4
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                Khởi động lại Vite Dev Server
              </h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#64748b' }}>
                Sau khi lưu file <code>.env</code>, chạy lại server để Vite nạp biến môi trường mới:
              </p>
              <div
                style={{
                  backgroundColor: '#f1f5f9',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Terminal size={14} color="#64748b" />
                <span>npm run dev</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            borderRadius: '0 0 16px 16px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Đã hiểu, đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
