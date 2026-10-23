import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Trash2,
  HardDrive
} from 'lucide-react';
import { reportService } from '../services/reportService';
import type { ReportJob, ReportType, ReportFormat, ReportJobStatus } from '../types';
import { formatDateTime } from '../utils/format';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Form state
  const [reportType, setReportType] = useState<ReportType>('CUSTOMERS');
  const [format, setFormat] = useState<ReportFormat>('XLSX');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const pollingTimerRef = useRef<any>(null);

  const fetchReports = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await reportService.list(page, 10);
      setReports(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      // fallback
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Real-time polling when jobs are QUEUED or RUNNING
  useEffect(() => {
    const hasActiveJobs = reports.some(r => r.status === 'QUEUED' || r.status === 'RUNNING');
    if (hasActiveJobs) {
      pollingTimerRef.current = setTimeout(() => {
        fetchReports(true);
      }, 3000);
    }
    return () => {
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    };
  }, [reports, fetchReports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      showError('Ngày bắt đầu không được sau ngày kết thúc');
      return;
    }

    setSubmitting(true);
    try {
      await reportService.create({
        reportType,
        format,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        requestedByName: user?.fullName || 'Người dùng hiện tại',
      });
      showSuccess('Báo cáo đã được tạo và sẵn sàng tải về');
      setPage(0);
      fetchReports();
    } catch (err: any) {
      showError(err.message || 'Lỗi khi yêu cầu tạo báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (job: ReportJob) => {
    if (job.status !== 'COMPLETED') return;
    setDownloadingId(job.jobUuid);
    try {
      await reportService.download(job.jobUuid, job.fileName);
      showSuccess(`Đã tải xuống file ${job.fileName || 'thành công'}`);
    } catch (err: any) {
      showError(err.message || 'Không thể tải file báo cáo');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: ReportJobStatus) => {
    switch (status) {
      case 'QUEUED':
        return {
          label: 'Đang xếp hàng...',
          className: 'badge-warning',
          icon: <Clock size={12} className="animate-spin" />
        };
      case 'RUNNING':
        return {
          label: 'Đang xử lý nền...',
          className: 'badge-info',
          icon: <RefreshCw size={12} className="animate-spin" />
        };
      case 'COMPLETED':
        return {
          label: 'Hoàn thành',
          className: 'badge-success',
          icon: <CheckCircle2 size={12} />
        };
      case 'FAILED':
        return {
          label: 'Thất bại',
          className: 'badge-danger',
          icon: <AlertCircle size={12} />
        };
      case 'EXPIRED':
        return {
          label: 'Đã hết hạn',
          className: 'badge-secondary',
          icon: <Trash2 size={12} />
        };
    }
  };

  const mapReportTypeName = (type: ReportType) => {
    switch (type) {
      case 'CUSTOMERS': return 'Danh sách khách hàng';
      case 'DEALS': return 'Đường ống cơ hội bán hàng';
      case 'REVENUE_SUMMARY': return 'Tổng hợp doanh thu & Pipeline';
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Xuất báo cáo bất đồng bộ (Asynchronous Reports)</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px' }}>
            Điều phối tác vụ xuất dữ liệu nặng qua RabbitMQ & Background Worker — Không nghẽn luồng HTTP, bảo vệ bộ nhớ và hỗ trợ tải file bảo mật.
          </p>
        </div>
        <button
          onClick={() => fetchReports()}
          className="btn btn-secondary"
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Report Configuration Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSpreadsheet size={18} color="#2563eb" />
          <span>Tạo yêu cầu báo cáo mới</span>
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Report Type */}
            <div>
              <label className="form-label" style={{ fontWeight: 500, fontSize: '0.85rem' }}>Loại dữ liệu báo cáo</label>
              <select
                className="form-control"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
              >
                <option value="CUSTOMERS">Danh sách khách hàng (Customers)</option>
                <option value="DEALS">Đường ống cơ hội bán hàng (Deals)</option>
                <option value="REVENUE_SUMMARY">Tổng hợp doanh thu & Pipeline (Summary)</option>
              </select>
            </div>

            {/* Format */}
            <div>
              <label className="form-label" style={{ fontWeight: 500, fontSize: '0.85rem' }}>Định dạng xuất file</label>
              <select
                className="form-control"
                value={format}
                onChange={(e) => setFormat(e.target.value as ReportFormat)}
              >
                <option value="XLSX">Excel Spreadsheet (.xlsx) — Đầy đủ bảng biểu & định dạng</option>
                <option value="CSV">Comma Separated Values (.csv) — Chuẩn UTF-8 BOM</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="form-label" style={{ fontWeight: 500, fontSize: '0.85rem' }}>Từ ngày (Start Date)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="form-label" style={{ fontWeight: 500, fontSize: '0.85rem' }}>Đến ngày (End Date)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              * Job được xử lý bất đồng bộ trong nền và tự động lưu trữ 24 giờ.
            </span>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              id="btn-submit-report-job"
            >
              {submitting ? (
                <>
                  <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                  <span>Đang gửi đến RabbitMQ...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Gửi yêu cầu tạo báo cáo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Reports History Table */}
      <div className="table-container">
        <div className="table-toolbar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#1e293b' }}>
            <FileText size={18} />
            <span>Lịch sử các yêu cầu báo cáo ({totalElements})</span>
          </div>
        </div>

        {loading && reports.length === 0 ? (
          <div className="empty-state">
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '12px' }}>Đang tải danh sách báo cáo...</p>
          </div>
        ) : reports.length > 0 ? (
          <table className="data-table" id="reports-table">
            <thead>
              <tr>
                <th>Mã Job / Tên file</th>
                <th>Loại báo cáo</th>
                <th>Định dạng</th>
                <th>Trạng thái</th>
                <th>Số bản ghi</th>
                <th>Dung lượng</th>
                <th>Thời gian tạo</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const statusBadge = getStatusBadge(r.status);
                const isDownloading = downloadingId === r.jobUuid;
                return (
                  <tr key={r.jobUuid}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {r.fileName || `Job-${r.jobUuid.substring(0, 8)}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        ID: {r.jobUuid}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                        {mapReportTypeName(r.reportType)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.format === 'XLSX' ? 'badge-primary' : 'badge-secondary'}`}>
                        {r.format}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge.className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {statusBadge.icon}
                        <span>{statusBadge.label}</span>
                      </span>
                      {r.errorMessage && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', maxWidth: '240px' }} title={r.errorMessage}>
                          {r.errorMessage}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        {r.status === 'COMPLETED' ? `${r.rowCount} dòng` : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {r.status === 'COMPLETED' ? formatFileSize(r.fileSizeBytes) : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {formatDateTime(r.createdAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {r.status === 'COMPLETED' && (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#16a34a', borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}
                          onClick={() => handleDownload(r)}
                          disabled={isDownloading}
                          title="Tải xuống tệp tin"
                        >
                          <Download size={14} className={isDownloading ? 'animate-bounce' : ''} />
                          <span>{isDownloading ? 'Đang tải...' : 'Tải về'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <HardDrive size={36} color="#94a3b8" />
            <h4 style={{ marginTop: '12px', color: '#334155' }}>Chưa có yêu cầu báo cáo nào</h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
              Hãy chọn loại báo cáo và nhấn "Gửi yêu cầu tạo báo cáo" ở phía trên.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-bar">
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Trang {page + 1} / {totalPages} ({totalElements} yêu cầu)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Trước
              </button>
              <button
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
