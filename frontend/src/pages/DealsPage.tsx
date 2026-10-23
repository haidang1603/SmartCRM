import React, { useState, useEffect, useCallback } from 'react';
import {
  Kanban,
  List as ListIcon,
  Plus,
  ArrowRight,
  History,
  Building,
  X,
  Trash2,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import { dealService } from '../services/dealService';
import { customerService } from '../services/customerService';
import { userService } from '../services/userService';
import type { Deal, DealKanbanColumn, DealStage, DealStageHistory, CustomerSummary, User } from '../types';
import { formatCurrency, formatCurrencyShort, formatDate, formatDateTime, getDealStageBadge } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { SupabaseSetupModal } from '../components/SupabaseSetupModal';

const DEMO_KANBAN_COLUMNS: DealKanbanColumn[] = [
  {
    stage: 'NEW',
    title: 'Mới tiếp nhận',
    count: 2,
    totalValue: 90000000,
    deals: [
      {
        id: 101,
        title: 'Triển khai CRM cho Chuỗi Nhà Thuốc',
        dealValue: 50000000,
        stage: 'NEW',
        probability: 20,
        customerId: 1,
        customerName: 'Tập đoàn Công nghệ Alpha',
        customerCompany: 'Alpha Pharma Chain',
        assignedToName: 'Trần Thu Hà',
        isDemo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 102,
        title: 'Tích hợp Zalo Mini App',
        dealValue: 40000000,
        stage: 'NEW',
        probability: 25,
        customerId: 2,
        customerName: 'Công ty Cổ phần Beta Retail',
        customerCompany: 'Beta Retail',
        assignedToName: 'Nguyễn Thế Dũng',
        isDemo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    stage: 'CONSULTING',
    title: 'Tư vấn & Đánh giá',
    count: 1,
    totalValue: 150000000,
    deals: [
      {
        id: 103,
        title: 'Nâng cấp Hạ Tầng Database Cloud',
        dealValue: 150000000,
        stage: 'CONSULTING',
        probability: 50,
        customerId: 3,
        customerName: 'Gamma Logistics',
        assignedToName: 'Quản Trị Viên',
        isDemo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    stage: 'NEGOTIATION',
    title: 'Đàm phán hợp đồng',
    count: 1,
    totalValue: 210000000,
    deals: [
      {
        id: 104,
        title: 'Hợp đồng ERP Doanh Nghiệp Toàn Diện',
        dealValue: 210000000,
        stage: 'NEGOTIATION',
        probability: 80,
        customerId: 1,
        customerName: 'Tập đoàn Công nghệ Alpha',
        assignedToName: 'Nguyễn Thế Dũng',
        isDemo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    stage: 'WON',
    title: 'Thành công (Won)',
    count: 1,
    totalValue: 120000000,
    deals: [
      {
        id: 105,
        title: 'Triển khai Trạm Sạc Xe Điện',
        dealValue: 120000000,
        stage: 'WON',
        probability: 100,
        customerId: 2,
        customerName: 'Beta Retail',
        assignedToName: 'Trần Thu Hà',
        isDemo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    stage: 'LOST',
    title: 'Thất bại (Lost)',
    count: 1,
    totalValue: 35000000,
    deals: [
      {
        id: 106,
        title: 'Gói hỗ trợ kỹ thuật On-site 3 tháng',
        dealValue: 35000000,
        stage: 'LOST',
        probability: 0,
        customerId: 3,
        customerName: 'Gamma Logistics',
        assignedToName: 'Trần Thu Hà',
        notes: 'Khách hàng dời kế hoạch sang quý 4',
        isDemo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
];

export const DealsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [columns, setColumns] = useState<DealKanbanColumn[]>([]);
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Lookups
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [stageChangeDeal, setStageChangeDeal] = useState<Deal | null>(null);
  const [targetStage, setTargetStage] = useState<DealStage>('NEW');
  const [stageComment, setStageComment] = useState('');

  // History modal
  const [historyDeal, setHistoryDeal] = useState<Deal | null>(null);
  const [historyList, setHistoryList] = useState<DealStageHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    dealValue: 10000000,
    stage: 'NEW' as DealStage,
    probability: 10,
    customerId: 0,
    assignedToId: undefined as number | undefined,
    expectedCloseDate: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { isManager } = useAuth();
  const { showSuccess, showError } = useNotification();
  const isConfigured = dealService.isConfigured();

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      if (isConfigured) {
        if (viewMode === 'kanban') {
          const cols = await dealService.kanban();
          setColumns(cols);
        } else {
          const deals = await dealService.all();
          setAllDeals(deals);
        }
      } else {
        // Preview Mode
        if (viewMode === 'kanban') {
          setColumns(DEMO_KANBAN_COLUMNS);
        } else {
          const flattened = DEMO_KANBAN_COLUMNS.flatMap((c) => c.deals);
          setAllDeals(flattened);
        }
      }
    } catch (err: any) {
      showError(err.message || 'Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  }, [isConfigured, viewMode, showError]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    if (isConfigured) {
      customerService.summaries().then((list) => {
        setCustomers(list);
        if (list.length > 0) {
          setFormData((prev) => (prev.customerId === 0 ? { ...prev, customerId: list[0].id } : prev));
        }
      }).catch(() => {});

      userService.active().then((users) => {
        setActiveUsers(users);
      }).catch(() => {});
    } else {
      setCustomers([
        { id: 1, fullName: 'Nguyễn Văn An', email: 'an@alpha.vn', companyName: 'Tập đoàn Công nghệ Alpha' },
        { id: 2, fullName: 'Trần Thị Bích', email: 'bich@beta.vn', companyName: 'Beta Retail' },
        { id: 3, fullName: 'Lê Hoàng Long', email: 'long@gamma.vn', companyName: 'Gamma Logistics' },
      ]);
    }
  }, [isConfigured]);

  const handleOpenCreate = () => {
    setEditingDeal(null);
    setFormData({
      title: '',
      dealValue: 20000000,
      stage: 'NEW',
      probability: 10,
      customerId: customers.length > 0 ? customers[0].id : 1,
      assignedToId: activeUsers.length > 0 ? activeUsers[0].id : undefined,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: '',
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleOpenEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      dealValue: deal.dealValue,
      stage: deal.stage,
      probability: deal.probability,
      customerId: deal.customerId,
      assignedToId: deal.assignedToId,
      expectedCloseDate: deal.expectedCloseDate || '',
      notes: deal.notes || '',
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleOpenStageChange = (deal: Deal, stage: DealStage) => {
    setStageChangeDeal(deal);
    setTargetStage(stage);
    setStageComment('');
  };

  const handleConfirmStageChange = async () => {
    if (!stageChangeDeal) return;

    try {
      if (isConfigured) {
        await dealService.updateStage(stageChangeDeal.id, {
          newStage: targetStage,
          comment: stageComment.trim() || undefined,
        });
        showSuccess(`Đã chuyển giai đoạn cơ hội sang ${targetStage}!`);
        fetchDeals();
      } else {
        // Preview mode update
        setColumns((prevCols) => {
          return prevCols.map((col) => {
            if (col.stage === stageChangeDeal.stage) {
              return {
                ...col,
                deals: col.deals.filter((d) => d.id !== stageChangeDeal.id),
                count: col.deals.length - 1,
                totalValue: col.totalValue - stageChangeDeal.dealValue,
              };
            }
            if (col.stage === targetStage) {
              const updatedDeal = { ...stageChangeDeal, stage: targetStage };
              return {
                ...col,
                deals: [updatedDeal, ...col.deals],
                count: col.deals.length + 1,
                totalValue: col.totalValue + stageChangeDeal.dealValue,
              };
            }
            return col;
          });
        });
        showSuccess(`Chuyển giai đoạn (Chế độ xem trước): ${targetStage}`);
      }
      setStageChangeDeal(null);
    } catch (err: any) {
      showError(err.message || 'Lỗi cập nhật giai đoạn cơ hội');
    }
  };

  const handleOpenHistory = async (deal: Deal) => {
    setHistoryDeal(deal);
    setHistoryLoading(true);
    try {
      if (isConfigured) {
        const hist = await dealService.history(deal.id);
        setHistoryList(hist);
      } else {
        setHistoryList([
          {
            id: 1,
            dealId: deal.id,
            previousStage: undefined,
            newStage: 'NEW',
            changedByName: 'Hệ Thống',
            changeDate: deal.createdAt,
            comment: 'Tạo cơ hội ban đầu',
          },
        ]);
      }
    } catch (err: any) {
      showError(err.message || 'Không thể tải lịch sử chuyển đổi giai đoạn');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmitDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormErrors({ title: 'Vui lòng nhập tên giao dịch / cơ hội' });
      return;
    }
    if (formData.customerId === 0) {
      setFormErrors({ customerId: 'Vui lòng chọn khách hàng liên quan' });
      return;
    }

    setSubmitting(true);
    try {
      if (isConfigured) {
        if (editingDeal) {
          await dealService.update(editingDeal.id, formData);
          showSuccess('Cập nhật cơ hội bán hàng thành công!');
        } else {
          await dealService.create(formData);
          showSuccess('Tạo mới cơ hội bán hàng vào Supabase thành công!');
        }
        fetchDeals();
      } else {
        showSuccess(editingDeal ? 'Cập nhật deal (Preview Mode)!' : 'Tạo mới deal (Preview Mode)!');
        fetchDeals();
      }
      setShowCreateModal(false);
      setEditingDeal(null);
    } catch (err: any) {
      showError(err.message || 'Lỗi lưu thông tin cơ hội bán hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cơ hội bán hàng này?')) return;
    try {
      if (isConfigured) {
        await dealService.delete(id);
        showSuccess('Đã xóa cơ hội khỏi Supabase');
        fetchDeals();
      } else {
        showSuccess('Đã xóa (Chế độ xem trước)');
        fetchDeals();
      }
    } catch (err: any) {
      showError(err.message || 'Lỗi xóa cơ hội');
    }
  };

  return (
    <div id="deals-page-container">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Đường ống cơ hội bán hàng (Deal Pipeline)
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
            Theo dõi hành trình bán hàng từ cơ hội mới đến chốt thành công
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                fontWeight: viewMode === 'kanban' ? 600 : 500,
                color: viewMode === 'kanban' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              <Kanban size={15} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                fontWeight: viewMode === 'list' ? 600 : 500,
                color: viewMode === 'list' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              <ListIcon size={15} />
              <span>Danh sách</span>
            </button>
          </div>

          <button
            id="btn-add-deal"
            onClick={handleOpenCreate}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            <span>Tạo cơ hội mới</span>
          </button>
        </div>
      </div>

      {/* Supabase Notice */}
      {!isConfigured && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '0.85rem' }}>
            <AlertTriangle size={18} color="#d97706" />
            <span>
              <strong>Chế độ xem trước:</strong> Supabase chưa được cấu hình. Kanban board bên dưới là dữ liệu mẫu để thử nghiệm tính năng chuyển giai đoạn và xem lịch sử.
            </span>
          </div>
          <button
            onClick={() => setShowSetupModal(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Xem hướng dẫn kết nối
          </button>
        </div>
      )}

      {/* Kanban / List Views */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Đang nạp đường ống cơ hội...</span>
        </div>
      ) : (
        <>
          {viewMode === 'kanban' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(280px, 1fr))',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '20px',
          }}
        >
          {columns.map((col) => (
            <div
              key={col.stage}
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '600px',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px 12px 0 0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{col.title}</span>
                  <span
                    style={{
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    {col.count}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}>
                  {formatCurrencyShort(col.totalValue)}
                </div>
              </div>

              {/* Deals Cards */}
              <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="card"
                    style={{
                      padding: '14px',
                      cursor: 'pointer',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                      {deal.title}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                      <Building size={13} /> {deal.customerName}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#16a34a' }}>
                        {formatCurrency(deal.dealValue)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Xác suất: {deal.probability}%
                      </span>
                    </div>

                    {/* Stage quick change dropdown & actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => handleOpenHistory(deal)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <History size={13} /> Lịch sử
                      </button>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {col.stage !== 'WON' && col.stage !== 'LOST' && (
                          <button
                            onClick={() => {
                              const nextMap: Record<DealStage, DealStage> = {
                                NEW: 'CONSULTING',
                                CONSULTING: 'NEGOTIATION',
                                NEGOTIATION: 'WON',
                                WON: 'WON',
                                LOST: 'LOST',
                              };
                              handleOpenStageChange(deal, nextMap[col.stage]);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                            title="Chuyển bước kế tiếp"
                          >
                            <span>Tiếp</span> <ArrowRight size={11} />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(deal)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 6px' }}
                          title="Sửa"
                        >
                          <Edit2 size={12} />
                        </button>
                        {isManager() && (
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '3px 6px' }}
                            title="Xóa"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card">
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Tên giao dịch</th>
                  <th>Khách hàng</th>
                  <th>Giai đoạn</th>
                  <th>Giá trị</th>
                  <th>Dự kiến chốt</th>
                  <th>Phụ trách</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {allDeals.length > 0 ? (
                  allDeals.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{d.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: #{d.id}</div>
                      </td>
                      <td>{d.customerName}</td>
                      <td>{getDealStageBadge(d.stage)}</td>
                      <td style={{ fontWeight: 600, color: '#16a34a' }}>{formatCurrency(d.dealValue)}</td>
                      <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{formatDate(d.expectedCloseDate)}</td>
                      <td style={{ fontSize: '0.85rem' }}>{d.assignedToName || 'Chưa gán'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenHistory(d)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Lịch sử"
                          >
                            <History size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(d)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Sửa"
                          >
                            <Edit2 size={14} />
                          </button>
                          {isManager() && (
                            <button
                              onClick={() => handleDelete(d.id)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '5px 8px' }}
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Chưa có cơ hội bán hàng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {/* Stage Change Modal */}
      {stageChangeDeal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
          onClick={() => setStageChangeDeal(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 12px' }}>
              Chuyển giai đoạn: {stageChangeDeal.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px' }}>
              Từ giai đoạn <strong>{stageChangeDeal.stage}</strong> sang <strong>{targetStage}</strong>.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Lý do / Ghi chú chuyển giai đoạn
              </label>
              <textarea
                value={stageComment}
                onChange={(e) => setStageComment(e.target.value)}
                placeholder="Ví dụ: Khách hàng đồng ý báo giá, chuẩn bị hợp đồng..."
                rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setStageChangeDeal(null)} className="btn btn-secondary btn-sm">
                Hủy bỏ
              </button>
              <button onClick={handleConfirmStageChange} className="btn btn-primary btn-sm">
                Xác nhận chuyển giai đoạn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Deal Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '540px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                {editingDeal ? 'Cập nhật cơ hội bán hàng' : 'Tạo mới cơ hội bán hàng'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitDeal} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Tiêu đề cơ hội *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: Cung cấp giải pháp CRM Cloud..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
                {formErrors.title && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.title}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Khách hàng liên quan *
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.companyName || 'Cá nhân'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Giá trị dự kiến (VNĐ) *
                  </label>
                  <input
                    type="number"
                    value={formData.dealValue}
                    onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Giai đoạn
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as DealStage })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  >
                    <option value="NEW">Mới tiếp nhận</option>
                    <option value="CONSULTING">Tư vấn & Đánh giá</option>
                    <option value="NEGOTIATION">Đàm phán hợp đồng</option>
                    <option value="WON">Thành công (Won)</option>
                    <option value="LOST">Thất bại (Lost)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Xác suất thành công (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Ngày dự kiến chốt
                  </label>
                  <input
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Người phụ trách
                  </label>
                  <select
                    value={formData.assignedToId || ''}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value ? Number(e.target.value) : undefined })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  >
                    <option value="">Chưa phân công</option>
                    {activeUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  placeholder="Yêu cầu chi tiết của deal..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary btn-sm">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                  {submitting ? 'Đang lưu...' : editingDeal ? 'Cập nhật' : 'Tạo cơ hội'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyDeal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
          onClick={() => setHistoryDeal(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                  Lịch sử chuyển đổi giai đoạn
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{historyDeal.title}</span>
              </div>
              <button onClick={() => setHistoryDeal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div className="loading-spinner"></div>
                </div>
              ) : historyList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {historyList.map((h) => (
                    <div key={h.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563eb', marginTop: '6px', flexShrink: 0 }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {h.previousStage ? `${h.previousStage} ➔ ${h.newStage}` : `Khởi tạo: ${h.newStage}`}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{formatDateTime(h.changeDate)}</span>
                        </div>
                        {h.comment && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '3px 0 0' }}>{h.comment}</p>}
                        {h.changedByName && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bởi: {h.changedByName}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                  Chưa ghi nhận lịch sử chuyển đổi giai đoạn.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SupabaseSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
    </div>
  );
};
