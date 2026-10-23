import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Database,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import type { DashboardMetrics, DealStage } from '../types';
import { formatCurrency, formatCurrencyShort, formatDate, getDealStageBadge } from '../utils/format';
import { useNotification } from '../context/NotificationContext';
import { SupabaseSetupModal } from '../components/SupabaseSetupModal';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const { showError } = useNotification();
  const isConfigured = dashboardService.isConfigured();

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      if (isConfigured) {
        const data = await dashboardService.getMetrics();
        setMetrics(data);
      } else {
        // Trạng thái chờ: Không giả mạo là đã kết nối DB, hiển thị khung dữ liệu mẫu trực quan
        setMetrics({
          totalCustomers: 12,
          realCustomersCount: 0,
          demoCustomersCount: 12,
          openDealsCount: 7,
          totalPipelineValue: 450000000,
          wonRevenue: 120000000,
          containsDemoData: true,
          dataModeNotice: 'Chế độ xem trước (Chưa kết nối Supabase) — Thống kê mẫu',
          stageBreakdown: [
            { stage: 'NEW', label: 'Mới tiếp nhận', count: 3, totalValue: 90000000 },
            { stage: 'CONSULTING', label: 'Tư vấn & Đánh giá', count: 2, totalValue: 150000000 },
            { stage: 'NEGOTIATION', label: 'Đàm phán hợp đồng', count: 2, totalValue: 210000000 },
            { stage: 'WON', label: 'Thành công (Won)', count: 1, totalValue: 120000000 },
            { stage: 'LOST', label: 'Thất bại (Lost)', count: 1, totalValue: 35000000 },
          ],
          recentDeals: [
            {
              id: 1,
              title: 'Hợp đồng ERP Doanh Nghiệp',
              dealValue: 120000000,
              stage: 'WON',
              probability: 100,
              customerId: 1,
              customerName: 'Tập đoàn Công nghệ Alpha',
              isDemo: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 2,
              title: 'Gói giải pháp CRM Cloud SaaS',
              dealValue: 85000000,
              stage: 'NEGOTIATION',
              probability: 80,
              customerId: 2,
              customerName: 'Công ty Cổ phần Beta Retail',
              isDemo: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        });
      }
    } catch (err: any) {
      showError(err.message || 'Không thể tải số liệu thống kê Dashboard');
    } finally {
      setLoading(false);
    }
  }, [isConfigured, showError]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const getStageColor = (stage: DealStage): string => {
    switch (stage) {
      case 'NEW': return '#38bdf8';
      case 'CONSULTING': return '#a855f7';
      case 'NEGOTIATION': return '#f59e0b';
      case 'WON': return '#10b981';
      case 'LOST': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const calculateTotalPipelineCount = () => {
    if (!metrics?.stageBreakdown) return 1;
    const total = metrics.stageBreakdown.reduce((sum, item) => sum + item.count, 0);
    return total > 0 ? total : 1;
  };

  return (
    <div id="dashboard-page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Tổng quan hiệu suất kinh doanh (Supabase CRM)
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
            Theo dõi KPIs, giá trị đường ống bán hàng và doanh thu thực tế
          </p>
        </div>
        <button
          id="btn-refresh-dashboard"
          onClick={fetchMetrics}
          className="btn btn-secondary btn-sm"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* Supabase Status Banner */}
      <div
        className="banner-notice"
        id="dashboard-data-banner"
        style={{
          backgroundColor: isConfigured ? '#f0fdf4' : '#fffbeb',
          borderColor: isConfigured ? '#bbf7d0' : '#fde68a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: isConfigured ? '#dcfce7' : '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isConfigured ? '#16a34a' : '#d97706',
            }}>
              {isConfigured ? <Database size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.88rem', color: isConfigured ? '#15803d' : '#92400e' }}>
                {isConfigured ? 'Cơ sở dữ liệu Supabase: Đang hoạt động' : 'Supabase: Trạng thái chờ cấu hình (Chế độ xem trước)'}
              </strong>
              <span style={{ fontSize: '0.82rem', color: isConfigured ? '#166534' : '#78350f' }}>
                {isConfigured
                  ? 'Toàn bộ chỉ số bên dưới được tính toán trực tiếp từ các bảng khách hàng và cơ hội trên Supabase.'
                  : 'Chưa tìm thấy VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env. Dữ liệu bên dưới là mẫu giao diện.'}
              </span>
            </div>
          </div>
          {!isConfigured && (
            <button
              onClick={() => setShowSetupModal(true)}
              className="btn btn-sm"
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none' }}
            >
              Xem hướng dẫn kết nối
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '28px',
        marginTop: '20px',
      }}>
        {/* Metric 1 */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Tổng khách hàng</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {loading ? '...' : (metrics?.totalCustomers ?? 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
            {isConfigured ? 'Dữ liệu trực tiếp từ bảng customers' : 'Mẫu cấu trúc dữ liệu'}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Cơ hội đang mở</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Briefcase size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {loading ? '...' : (metrics?.openDealsCount ?? 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '6px', fontWeight: 500 }}>
            {metrics?.totalPipelineValue ? formatCurrency(metrics.totalPipelineValue) : '0 ₫'} pipeline
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Doanh số thành công (Won)</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#15803d', letterSpacing: '-0.02em' }}>
            {loading ? '...' : formatCurrencyShort(metrics?.wonRevenue ?? 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '6px', fontWeight: 500 }}>
            {formatCurrency(metrics?.wonRevenue ?? 0)}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Tỷ lệ thắng (Win Rate)</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {(() => {
              if (!metrics?.stageBreakdown) return '0%';
              const won = metrics.stageBreakdown.find(s => s.stage === 'WON')?.count || 0;
              const lost = metrics.stageBreakdown.find(s => s.stage === 'LOST')?.count || 0;
              const closed = won + lost;
              return closed > 0 ? `${Math.round((won / closed) * 100)}%` : 'Chưa có';
            })()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
            Dựa trên các cơ hội đã chốt
          </div>
        </div>
      </div>

      {/* Pipeline Breakdown & Recent Deals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Stage Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              Phân bổ giai đoạn cơ hội bán hàng
            </h3>
          </div>
          <div className="card-body">
            {metrics?.stageBreakdown?.map((item) => {
              const percent = Math.round((item.count / calculateTotalPipelineCount()) * 100);
              return (
                <div key={item.stage} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>
                      {item.label} ({item.count})
                    </span>
                    <span style={{ color: '#64748b' }}>
                      {formatCurrency(item.totalValue)}
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        backgroundColor: getStageColor(item.stage),
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Deals */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              Cơ hội giao dịch gần đây
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Tiêu đề giao dịch</th>
                    <th>Khách hàng</th>
                    <th>Giai đoạn</th>
                    <th style={{ textAlign: 'right' }}>Giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.recentDeals && metrics.recentDeals.length > 0 ? (
                    metrics.recentDeals.map((deal) => (
                      <tr key={deal.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{deal.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {formatDate(deal.createdAt)}
                          </div>
                        </td>
                        <td>{deal.customerName}</td>
                        <td>{getDealStageBadge(deal.stage)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(deal.dealValue)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        Chưa có cơ hội nào được ghi nhận.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <SupabaseSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
    </div>
  );
};
