import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  ShieldAlert,
  LogOut,
  Building2,
  FileSpreadsheet,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout, isManager } = useAuth();

  return (
    <aside className="sidebar" id="app-sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <Building2 size={22} />
        </div>
        <div className="brand-text">
          <h1>SmartCRM</h1>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-category">Tổng quan & Kinh doanh</div>

        <button
          id="nav-tab-dashboard"
          className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <button
          id="nav-tab-customers"
          className={`nav-link ${currentTab === 'customers' ? 'active' : ''}`}
          onClick={() => onTabChange('customers')}
        >
          <Users size={18} />
          <span>Khách hàng</span>
        </button>

        <button
          id="nav-tab-deals"
          className={`nav-link ${currentTab === 'deals' ? 'active' : ''}`}
          onClick={() => onTabChange('deals')}
        >
          <Briefcase size={18} />
          <span>Deal Pipeline</span>
        </button>

        <button
          id="nav-tab-reports"
          className={`nav-link ${currentTab === 'reports' ? 'active' : ''}`}
          onClick={() => onTabChange('reports')}
        >
          <FileSpreadsheet size={18} />
          <span>Báo cáo nền (Reports)</span>
        </button>

        {isManager() && (
          <>
            <div className="nav-category">Quản trị hệ thống</div>

            <button
              id="nav-tab-users"
              className={`nav-link ${currentTab === 'users' ? 'active' : ''}`}
              onClick={() => onTabChange('users')}
            >
              <UserCheck size={18} />
              <span>Thành viên & Phân quyền</span>
            </button>

            <button
              id="nav-tab-performance"
              className={`nav-link ${currentTab === 'performance' ? 'active' : ''}`}
              onClick={() => onTabChange('performance')}
            >
              <Activity size={18} />
              <span>Performance Lab</span>
            </button>

            <button
              id="nav-tab-audit"
              className={`nav-link ${currentTab === 'audit' ? 'active' : ''}`}
              onClick={() => onTabChange('audit')}
            >
              <ShieldAlert size={18} />
              <span>Nhật ký kiểm toán</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="user-card" id="user-profile-badge">
            <div className="user-avatar">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name" title={user.fullName}>{user.fullName}</div>
              <div className="user-role-badge">
                {user.roles.map(r => r.replace('ROLE_', '')).join(', ')}
              </div>
            </div>
            <button
              id="btn-sidebar-logout"
              className="btn-icon btn-ghost"
              onClick={logout}
              title="Đăng xuất"
              style={{ color: '#94a3b8' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
