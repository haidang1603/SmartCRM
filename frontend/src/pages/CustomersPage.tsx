import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  Building,
  Mail,
  Phone,
  X,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { customerService } from '../services/customerService';
import { userService } from '../services/userService';
import type { Customer, CustomerStatus, CustomerInteraction, InteractionType, User } from '../types';
import { formatDate, formatDateTime, getCustomerStatusBadge } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { SupabaseSetupModal } from '../components/SupabaseSetupModal';

const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 1,
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@alpha-tech.vn',
    phoneNumber: '0903123456',
    companyName: 'Tập đoàn Công nghệ Alpha',
    status: 'ACTIVE_CLIENT',
    assignedToId: 1,
    assignedToName: 'Quản Trị Viên Hệ Thống',
    notes: 'Khách hàng chiến lược dự án ERP giai đoạn 1',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    fullName: 'Trần Thị Bích',
    email: 'bich.tran@beta-retail.vn',
    phoneNumber: '0912987654',
    companyName: 'Công ty Cổ phần Beta Retail',
    status: 'PROSPECT',
    assignedToId: 2,
    assignedToName: 'Nguyễn Thế Dũng (Trưởng Phòng)',
    notes: 'Đang tư vấn gói giải pháp bán lẻ đa kênh',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    fullName: 'Lê Hoàng Long',
    email: 'long.le@gamma-logistics.vn',
    phoneNumber: '0988776655',
    companyName: 'Gamma Logistics Quốc Tế',
    status: 'LEAD',
    assignedToId: 3,
    assignedToName: 'Trần Thu Hà (Chuyên Viên Sales)',
    notes: 'Liên hệ qua form website, cần demo trong tuần',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);

  // New customer form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    status: 'LEAD' as CustomerStatus,
    assignedToId: undefined as number | undefined,
    notes: '',
  });

  // New interaction form state
  const [interactionForm, setInteractionForm] = useState({
    interactionType: 'NOTE' as InteractionType,
    summary: '',
    details: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { isManager } = useAuth();
  const { showSuccess, showError } = useNotification();
  const isConfigured = customerService.isConfigured();

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      if (isConfigured) {
        const res = await customerService.list({
          search: debouncedSearch,
          status: statusFilter,
          page,
          size: 10,
        });
        setCustomers(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      } else {
        // Preview Mode with local filtering
        let filtered = [...DEMO_CUSTOMERS];
        if (debouncedSearch.trim()) {
          const s = debouncedSearch.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.fullName.toLowerCase().includes(s) ||
              c.email.toLowerCase().includes(s) ||
              (c.companyName && c.companyName.toLowerCase().includes(s))
          );
        }
        if (statusFilter) {
          filtered = filtered.filter((c) => c.status === statusFilter);
        }
        setCustomers(filtered);
        setTotalPages(1);
        setTotalElements(filtered.length);
      }
    } catch (err: any) {
      showError(err.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, [isConfigured, debouncedSearch, statusFilter, page, showError]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (isConfigured) {
      userService.active().then((users) => {
        setActiveUsers(users);
      }).catch(() => {});
    }
  }, [isConfigured]);

  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      companyName: '',
      status: 'LEAD',
      assignedToId: activeUsers.length > 0 ? activeUsers[0].id : undefined,
      notes: '',
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      fullName: c.fullName,
      email: c.email,
      phoneNumber: c.phoneNumber || '',
      companyName: c.companyName || '',
      status: c.status,
      assignedToId: c.assignedToId,
      notes: c.notes || '',
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleOpenInteractions = async (c: Customer) => {
    setSelectedCustomer(c);
    setInteractionsLoading(true);
    try {
      if (isConfigured) {
        const list = await customerService.getInteractions(c.id);
        setInteractions(list);
      } else {
        setInteractions([
          {
            id: 1,
            customerId: c.id,
            interactionType: 'NOTE',
            summary: 'Ghi chú khởi tạo hồ sơ',
            details: 'Hồ sơ khách hàng được tạo trong phiên làm việc ban đầu',
            interactionDate: c.createdAt,
            createdAt: c.createdAt,
          },
        ]);
      }
    } catch (err: any) {
      showError(err.message || 'Không thể tải nhật ký tương tác');
    } finally {
      setInteractionsLoading(false);
    }
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormErrors({ fullName: 'Vui lòng nhập họ và tên khách hàng' });
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormErrors({ email: 'Email không đúng định dạng' });
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      if (isConfigured) {
        if (editingCustomer) {
          await customerService.update(editingCustomer.id, formData);
          showSuccess('Cập nhật thông tin khách hàng trên Supabase thành công!');
        } else {
          await customerService.create(formData);
          showSuccess('Thêm mới khách hàng vào Supabase thành công!');
        }
      } else {
        // Preview mode local update
        if (editingCustomer) {
          setCustomers((prev) =>
            prev.map((item) => (item.id === editingCustomer.id ? { ...item, ...formData, updatedAt: new Date().toISOString() } : item))
          );
          showSuccess('Cập nhật khách hàng (Chế độ xem trước)!');
        } else {
          const newC: Customer = {
            id: Date.now(),
            ...formData,
            isDemo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCustomers((prev) => [newC, ...prev]);
          showSuccess('Đã thêm khách hàng mới (Chế độ xem trước)!');
        }
      }
      setShowAddModal(false);
      setEditingCustomer(null);
      if (isConfigured) {
        fetchCustomers();
      }
    } catch (err: any) {
      showError(err.message || 'Lỗi lưu thông tin khách hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      if (isConfigured) {
        await customerService.delete(id);
        showSuccess('Đã xóa khách hàng khỏi Supabase');
        fetchCustomers();
      } else {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        showSuccess('Đã xóa khách hàng (Chế độ xem trước)');
      }
    } catch (err: any) {
      showError(err.message || 'Không thể xóa khách hàng');
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !interactionForm.summary.trim()) return;

    try {
      if (isConfigured) {
        const item = await customerService.addInteraction(selectedCustomer.id, {
          interactionType: interactionForm.interactionType,
          summary: interactionForm.summary.trim(),
          details: interactionForm.details.trim(),
        });
        setInteractions((prev) => [item, ...prev]);
        showSuccess('Đã ghi nhận tương tác chăm sóc khách hàng vào Supabase!');
      } else {
        const mockItem: CustomerInteraction = {
          id: Date.now(),
          customerId: selectedCustomer.id,
          interactionType: interactionForm.interactionType,
          summary: interactionForm.summary.trim(),
          details: interactionForm.details.trim(),
          interactionDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        setInteractions((prev) => [mockItem, ...prev]);
        showSuccess('Đã thêm tương tác (Chế độ xem trước)!');
      }
      setInteractionForm({ interactionType: 'NOTE', summary: '', details: '' });
    } catch (err: any) {
      showError(err.message || 'Không thể thêm tương tác');
    }
  };

  return (
    <div id="customers-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Quản lý khách hàng (Customer Management)
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
            Theo dõi khách hàng tiềm năng, lịch sử chăm sóc và phân quyền phụ trách
          </p>
        </div>
        <button
          id="btn-add-customer"
          onClick={handleOpenAdd}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} />
          <span>Thêm khách hàng</span>
        </button>
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
              <strong>Chế độ xem trước:</strong> Supabase chưa được cấu hình. Danh sách bên dưới là dữ liệu mẫu để thử nghiệm giao diện. Khi cấu hình xong, dữ liệu sẽ được đọc/ghi trực tiếp vào bảng <code>customers</code> qua Supabase SDK.
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

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên khách hàng, email hoặc công ty..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CustomerStatus | '');
                setPage(0);
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="LEAD">Khách tiềm năng (Lead)</option>
              <option value="PROSPECT">Khách hàng triển vọng</option>
              <option value="ACTIVE_CLIENT">Khách hàng chính thức</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Công ty & Liên hệ</th>
                <th>Trạng thái</th>
                <th>Người phụ trách</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 8px' }}></div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Đang nạp danh sách khách hàng...</span>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} /> {c.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building size={13} color="#64748b" /> {c.companyName || 'Cá nhân'}
                      </div>
                      {c.phoneNumber && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Phone size={12} /> {c.phoneNumber}
                        </div>
                      )}
                    </td>
                    <td>{getCustomerStatusBadge(c.status)}</td>
                    <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {c.assignedToName || 'Chưa phân công'}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{formatDate(c.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenInteractions(c)}
                          className="btn btn-secondary btn-sm"
                          title="Lịch sử tương tác"
                          style={{ padding: '5px 8px' }}
                        >
                          <MessageSquare size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="btn btn-secondary btn-sm"
                          title="Chỉnh sửa"
                          style={{ padding: '5px 8px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        {isManager() && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="btn btn-danger btn-sm"
                            title="Xóa"
                            style={{ padding: '5px 8px' }}
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Không tìm thấy khách hàng nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Hiển thị {customers.length} trên tổng số {totalElements} khách hàng
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn btn-secondary btn-sm"
              >
                Trang trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn btn-secondary btn-sm"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
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
                {editingCustomer ? 'Cập nhật thông tin khách hàng' : 'Thêm mới khách hàng'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomer} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
                {formErrors.fullName && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.fullName}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    placeholder="email@company.com"
                  />
                  {formErrors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.email}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    placeholder="0901234567"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Công ty
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    placeholder="Tên công ty / Doanh nghiệp"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  >
                    <option value="LEAD">Khách tiềm năng (Lead)</option>
                    <option value="PROSPECT">Khách hàng triển vọng</option>
                    <option value="ACTIVE_CLIENT">Khách hàng chính thức</option>
                    <option value="INACTIVE">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  placeholder="Thông tin ghi chú về nhu cầu, ngân sách..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm"
                >
                  {submitting ? 'Đang lưu...' : editingCustomer ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactions Drawer / Modal */}
      {selectedCustomer && (
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
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                  Lịch sử tương tác: {selectedCustomer.fullName}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedCustomer.companyName}</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            {/* Interactions List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <form onSubmit={handleAddInteraction} style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px', marginBottom: '10px' }}>
                    <select
                      value={interactionForm.interactionType}
                      onChange={(e) => setInteractionForm({ ...interactionForm, interactionType: e.target.value as InteractionType })}
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    >
                      <option value="NOTE">Ghi chú</option>
                      <option value="CALL">Cuộc gọi</option>
                      <option value="MEETING">Cuộc họp</option>
                      <option value="EMAIL">Email</option>
                    </select>
                    <input
                      type="text"
                      value={interactionForm.summary}
                      onChange={(e) => setInteractionForm({ ...interactionForm, summary: e.target.value })}
                      placeholder="Tóm tắt nội dung trao đổi..."
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={interactionForm.details}
                      onChange={(e) => setInteractionForm({ ...interactionForm, details: e.target.value })}
                      placeholder="Chi tiết kết quả, bước tiếp theo (tùy chọn)..."
                      style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Send size={14} /> Gửi
                    </button>
                  </div>
                </form>
              </div>

              {interactionsLoading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div className="loading-spinner"></div>
                </div>
              ) : interactions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {interactions.map((it) => (
                    <div key={it.id} style={{ borderLeft: '3px solid #2563eb', paddingLeft: '12px', paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.summary}</span>
                        <span style={{ color: '#94a3b8' }}>{formatDateTime(it.interactionDate)}</span>
                      </div>
                      {it.details && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>{it.details}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                  Chưa có lịch sử chăm sóc nào cho khách hàng này.
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
