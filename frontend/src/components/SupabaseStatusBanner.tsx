import React, { useState } from 'react';
import { AlertTriangle, Settings } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';
import { SupabaseSetupModal } from './SupabaseSetupModal';

export const SupabaseStatusBanner: React.FC = () => {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const configured = isSupabaseConfigured();

  // Khi đã kết nối Supabase thành công, ẩn hoàn toàn banner này để giao diện sạch đẹp
  if (configured) {
    return null;
  }

  return (
    <>
      <div
        style={{
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#fffbeb',
          borderBottom: '1px solid #fde68a',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#b45309',
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={16} />
            <span>Supabase: Chưa cấu hình thông tin kết nối (Chế độ chờ)</span>
          </span>

          <span style={{ color: '#78350f', fontSize: '0.8rem' }}>
            Ứng dụng đang hiển thị luồng giao diện mẫu. Để kết nối cơ sở dữ liệu thật và RLS, hãy thêm biến môi trường vào <code>frontend/.env</code>.
          </span>
        </div>

        <button
          onClick={() => setShowSetupModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fcd34d',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Settings size={14} />
          <span>Hướng dẫn cấu hình kết nối</span>
        </button>
      </div>

      <SupabaseSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
    </>
  );
};
