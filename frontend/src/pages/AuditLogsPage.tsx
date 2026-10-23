import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, User, Globe } from 'lucide-react';
import { auditService } from '../services/auditService';
import type { AuditLog } from '../types';
import { formatDateTime } from '../utils/format';
import { useNotification } from '../context/NotificationContext';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const { showError } = useNotification();
  const isConfigured = auditService.isConfigured();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      if (isConfigured) {
        const res = await auditService.list(page, 20);
        setLogs(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      } else {
        setLogs([
          {
            id: 1,
            action: 'LOGIN_SUCCESS',
            entityName: 'AUTH',
            entityId: 1,
            performedBy: 'admin',
            details: 'Người dùng đăng nhập thành công vào hệ thống SmartCRM',
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1',
          },
          {
            id: 2,
            action: 'DEAL_STAGE_CHANGE',
            entityName: 'DEAL',
            entityId: 101,
            performedBy: 'sales',
            details: 'Chuyển trạng thái từ NEW sang CONSULTING',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            ipAddress: '127.0.0.1',
          },
        ]);
        setTotalPages(1);
        setTotalElements(2);
      }
    } catch (err: any) {
      showError(err.message || 'Không thể tải nhật ký kiểm toán');
    } finally {
      setLoading(false);
    }
  }, [isConfigured, page, showError]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadgeClass = (action: string) => {
    if (action.includes('CREATE')) return 'badge-status-active';
    if (action.includes('UPDATE') || action.includes('CHANGE')) return 'badge-deal-negotiation';
    if (action.includes('DELETE')) return 'badge-deal-lost';
    if (action.includes('LOGIN')) return 'badge-deal-new';
    return 'badge-status-default';
  };

  return (
    <div id="audit-logs-page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Nhật ký kiểm toán hệ thống (Audit Trail)
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Ghi nhận và giám sát toàn bộ các thao tác nghiệp vụ quan trọng nhằm đảm bảo tính toàn vẹn
          </p>
        </div>

        <button
          id="btn-refresh-audit"
          onClick={fetchLogs}
          className="btn btn-secondary btn-sm"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới nhật ký</span>
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Hành động</th>
                <th>Thực thể liên quan</th>
                <th>Người thực hiện</th>
                <th>Chi tiết tác vụ</th>
                <th>Địa chỉ IP</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner"></div>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {log.entityName} {log.entityId ? `#${log.entityId}` : ''}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={13} color="#64748b" />
                        <span style={{ fontWeight: 500 }}>{log.performedBy}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '300px' }}>
                      {log.details || '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={12} /> {log.ipAddress || 'Internal'}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {formatDateTime(log.timestamp)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Chưa có nhật ký kiểm toán nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Hiển thị {logs.length} trên tổng số {totalElements} bản ghi
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
    </div>
  );
};
