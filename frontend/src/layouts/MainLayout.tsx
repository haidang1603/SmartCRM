import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { SupabaseStatusBanner } from '../components/SupabaseStatusBanner';
import { LoginPage } from '../pages/LoginPage';

// Code splitting / lazy loading cho các module
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CustomersPage = lazy(() => import('../pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const DealsPage = lazy(() => import('../pages/DealsPage').then(m => ({ default: m.DealsPage })));
const UsersPage = lazy(() => import('../pages/UsersPage').then(m => ({ default: m.UsersPage })));
const AuditLogsPage = lazy(() => import('../pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const ReportsPage = lazy(() => import('../pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const PerformanceLabPage = lazy(() => import('../pages/PerformanceLabPage').then(m => ({ default: m.PerformanceLabPage })));

const PageLoader: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    flexDirection: 'column',
    gap: '12px',
  }}>
    <div className="loading-spinner"></div>
    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Đang nạp dữ liệu phân hệ...</span>
  </div>
);

export const MainLayout: React.FC = () => {
  const { user, loading, isManager } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div className="loading-spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></div>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Đang khởi tạo SmartCRM Session...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Bảng điều khiển kinh doanh (Dashboard)';
      case 'customers': return 'Quản lý khách hàng (Customer Management)';
      case 'deals': return 'Đường ống cơ hội bán hàng (Deal Pipeline)';
      case 'reports': return 'Báo cáo bất đồng bộ (Reports)';
      case 'performance': return 'Phòng thí nghiệm hiệu năng (Performance Lab)';
      case 'users': return 'Quản lý thành viên & Phân quyền (Users)';
      case 'audit': return 'Nhật ký kiểm toán hệ thống (Audit Logs)';
      default: return 'SmartCRM';
    }
  };

  const renderContent = () => {
    return (
      <Suspense fallback={<PageLoader />}>
        {(() => {
          switch (currentTab) {
            case 'dashboard':
              return <DashboardPage />;
            case 'customers':
              return <CustomersPage />;
            case 'deals':
              return <DealsPage />;
            case 'reports':
              return <ReportsPage />;
            case 'performance':
              return isManager() ? <PerformanceLabPage /> : <DashboardPage />;
            case 'users':
              return isManager() ? <UsersPage /> : <DashboardPage />;
            case 'audit':
              return isManager() ? <AuditLogsPage /> : <DashboardPage />;
            default:
              return <DashboardPage />;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if ((tab === 'users' || tab === 'audit' || tab === 'performance') && !isManager()) {
            return;
          }
          setCurrentTab(tab);
        }}
      />
      <div className="main-viewport">
        <SupabaseStatusBanner />
        <TopNav title={getPageTitle()} />
        <main className="content-body">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
