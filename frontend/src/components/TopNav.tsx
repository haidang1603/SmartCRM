import React from 'react';
import { Database, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';

interface TopNavProps {
  title: string;
}

export const TopNav: React.FC<TopNavProps> = ({ title }) => {
  const { user, logout } = useAuth();
  const configured = isSupabaseConfigured();

  return (
    <header className="top-bar" id="app-topbar">
      <h2 className="page-title">{title}</h2>

      <div className="top-bar-actions">
        <div className="demo-indicator pulse" id="db-storage-indicator">
          <Database size={14} />
          <span>{configured ? 'Supabase Cloud • Online' : 'Chế độ chờ'}</span>
        </div>

        {user && (
          <div className="badge badge-status-active" id="current-role-indicator">
            <ShieldCheck size={14} />
            <span>{user.roles.map(r => r.replace('ROLE_', '')).join(' | ')}</span>
          </div>
        )}

        <button
          id="btn-topnav-logout"
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Đăng xuất khỏi hệ thống"
        >
          <LogOut size={14} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};
