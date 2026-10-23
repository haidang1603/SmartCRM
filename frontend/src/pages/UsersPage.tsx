import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import { userService } from '../services/userService';
import type { User } from '../types';
import { formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    roles: ['ROLE_SALES'] as string[],
    active: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { user: currentUser, isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.list();
      setUsers(data);
    } catch (err: any) {
      showError(err.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenAdd = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      phoneNumber: '',
      roles: ['ROLE_SALES'],
      active: true,
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      email: u.email,
      password: '',
      fullName: u.fullName,
      phoneNumber: u.phoneNumber || '',
      roles: u.roles,
      active: u.active,
    });
    setFormErrors({});
  };

  const toggleRole = (role: string) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(role);
      if (exists) {
        if (prev.roles.length === 1) {
          showError('Người dùng phải có ít nhất 1 quyền hạn');
          return prev;
        }
        return { ...prev, roles: prev.roles.filter((r) => r !== role) };
      } else {
        return { ...prev, roles: [...prev.roles, role] };
      }
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    try {
      if (editingUser) {
        const updated = await userService.update(editingUser.id, {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          roles: formData.roles,
          active: formData.active,
        });
        showSuccess(`Đã cập nhật thông tin người dùng ${updated.fullName}`);
        setEditingUser(null);
        fetchUsers();
      } else {
        if (!formData.username.trim() || !formData.email.trim()) {
          showError('Vui lòng nhập tên tài khoản và email hợp lệ');
          return;
        }
        const created = await userService.create({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          roles: formData.roles,
        });
        showSuccess(`Đã tạo tài khoản cho ${created.fullName}`);
        setShowAddModal(false);
        fetchUsers();
      }
    } catch (err: any) {
      showError(err.message || 'Lỗi khi lưu thông tin người dùng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === currentUser?.id) {
      showError('Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${u.fullName}" (${u.username})?`)) {
      return;
    }

    try {
      await userService.delete(u.id);
      showSuccess(`Đã xóa tài khoản ${u.username}`);
      fetchUsers();
    } catch (err: any) {
      showError(err.message || 'Không thể xóa tài khoản');
    }
  };

  return (
    <div id="users-page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Quản trị thành viên & Phân quyền
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Quản lý đội ngũ bán hàng, cấp quyền vai trò (Admin, Manager, Sales) và bảo vệ đặc quyền
          </p>
        </div>

        {isAdmin() && (
          <button
            id="btn-add-user"
            onClick={handleOpenAdd}
            className="btn btn-primary"
          >
            <UserPlus size={16} />
            <span>Thêm thành viên</span>
          </button>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '12px' }}>Đang nạp danh sách thành viên...</p>
          </div>
        ) : (
          <table className="data-table" id="users-table">
            <thead>
              <tr>
                <th>Họ tên & Tài khoản</th>
                <th>Liên hệ</th>
                <th>Vai trò (Roles)</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                {isAdmin() && <th style={{ textAlign: 'right' }}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.fullName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>@{u.username}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
                      <Mail size={12} color="#64748b" />
                      <span>{u.email}</span>
                    </div>
                    {u.phoneNumber && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        <Phone size={12} />
                        <span>{u.phoneNumber}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {u.roles.map((r) => (
                        <span key={r} className="badge badge-deal-consulting" style={{ fontSize: '0.72rem' }}>
                          <Shield size={10} style={{ marginRight: '2px' }} />
                          {r.replace('ROLE_', '')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {u.active ? (
                      <span className="badge badge-status-active">
                        <UserCheck size={12} />
                        <span>Hoạt động</span>
                      </span>
                    ) : (
                      <span className="badge badge-status-inactive">
                        <UserX size={12} />
                        <span>Vô hiệu</span>
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{formatDate(u.createdAt)}</span>
                  </td>
                  {isAdmin() && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn-icon btn-ghost"
                          title="Sửa thông tin & Quyền"
                        >
                          <Edit2 size={15} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn-icon btn-ghost"
                            style={{ color: '#ef4444' }}
                            title="Xóa người dùng"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {(showAddModal || editingUser) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingUser ? 'Chỉnh sửa tài khoản người dùng' : 'Tạo mới tài khoản người dùng'}</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                }}
                className="btn-icon btn-ghost"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="user-username">Tên đăng nhập *</label>
                    <input
                      id="user-username"
                      type="text"
                      className={`form-control ${formErrors.username ? 'error' : ''}`}
                      placeholder="VD: sales_lead"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={!!editingUser}
                      required
                    />
                    {formErrors.username && <div className="form-error">{formErrors.username}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="user-fullname">Họ và tên *</label>
                    <input
                      id="user-fullname"
                      type="text"
                      className={`form-control ${formErrors.fullName ? 'error' : ''}`}
                      placeholder="VD: Nguyễn Văn B"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                    {formErrors.fullName && <div className="form-error">{formErrors.fullName}</div>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="user-email">Email *</label>
                    <input
                      id="user-email"
                      type="email"
                      className={`form-control ${formErrors.email ? 'error' : ''}`}
                      placeholder="VD: user@smartcrm.dev"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!editingUser}
                      required
                    />
                    {formErrors.email && <div className="form-error">{formErrors.email}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="user-phone">Số điện thoại</label>
                    <input
                      id="user-phone"
                      type="text"
                      className="form-control"
                      placeholder="VD: 0912345678"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                {!editingUser && (
                  <div className="form-group">
                    <label htmlFor="user-password">Mật khẩu khởi tạo *</label>
                    <input
                      id="user-password"
                      type="password"
                      className={`form-control ${formErrors.password ? 'error' : ''}`}
                      placeholder="Tối thiểu 6 ký tự"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    {formErrors.password && <div className="form-error">{formErrors.password}</div>}
                  </div>
                )}

                {/* Roles Checklist */}
                <div className="form-group">
                  <label>Vai trò & Phân quyền truy cập *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.roles.includes('ROLE_ADMIN')}
                        onChange={() => toggleRole('ROLE_ADMIN')}
                        disabled={editingUser?.id === currentUser?.id}
                      />
                      <div>
                        <strong>ROLE_ADMIN:</strong> Quản trị viên toàn quyền hệ thống & phân quyền
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.roles.includes('ROLE_MANAGER')}
                        onChange={() => toggleRole('ROLE_MANAGER')}
                      />
                      <div>
                        <strong>ROLE_MANAGER:</strong> Quản lý phòng kinh doanh, xem nhật ký kiểm toán và báo cáo
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.roles.includes('ROLE_SALES')}
                        onChange={() => toggleRole('ROLE_SALES')}
                      />
                      <div>
                        <strong>ROLE_SALES:</strong> Nhân viên kinh doanh, quản lý khách hàng và cơ hội
                      </div>
                    </label>
                  </div>
                </div>

                {editingUser && (
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        disabled={editingUser.id === currentUser?.id}
                      />
                      <span>Tài khoản đang hoạt động (Active)</span>
                    </label>
                    {editingUser.id === currentUser?.id && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                        * Bạn không thể tự vô hiệu hóa tài khoản của chính mình.
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                  }}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  id="btn-save-user-submit"
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : 'Lưu tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
