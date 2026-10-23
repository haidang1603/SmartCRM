import { supabase, isSupabaseConfigured } from './supabase';
import type { ReportJob, ReportType, ReportFormat } from '../types';

const STORAGE_KEY = 'smartcrm_report_jobs';

export const reportService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  getStoredJobs(): ReportJob[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [
      {
        jobUuid: 'rep-init-01',
        reportType: 'CUSTOMERS',
        format: 'CSV',
        status: 'COMPLETED',
        requestedByFullName: 'Quản Trị Viên Hệ Thống',
        fileName: 'bao_cao_khach_hang_tong_hop.csv',
        fileSizeBytes: 18450,
        rowCount: 5,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3550000).toISOString(),
      },
      {
        jobUuid: 'rep-init-02',
        reportType: 'DEALS',
        format: 'XLSX',
        status: 'COMPLETED',
        requestedByFullName: 'Nguyễn Thế Dũng',
        fileName: 'bao_cao_co_hoi_ban_hang.xlsx',
        fileSizeBytes: 24600,
        rowCount: 5,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 86350000).toISOString(),
      },
    ];
  },

  saveJobs(jobs: ReportJob[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch {
      // ignore
    }
  },

  async list(page: number = 0, size: number = 10): Promise<{ content: ReportJob[]; totalPages: number; totalElements: number }> {
    const jobs = this.getStoredJobs();
    const start = page * size;
    const content = jobs.slice(start, start + size);
    return {
      content,
      totalPages: Math.max(1, Math.ceil(jobs.length / size)),
      totalElements: jobs.length,
    };
  },

  async create(payload: {
    reportType: ReportType;
    format: ReportFormat;
    startDate?: string;
    endDate?: string;
    requestedByName?: string;
  }): Promise<ReportJob> {
    const jobUuid = `rep-${Date.now()}`;
    const ext = payload.format === 'CSV' ? 'csv' : 'xlsx';
    const typeLabel = payload.reportType === 'CUSTOMERS' ? 'khach_hang' : payload.reportType === 'DEALS' ? 'co_hoi' : 'hieu_nang';
    const fileName = `bao_cao_${typeLabel}_${new Date().toISOString().slice(0, 10)}.${ext}`;

    let rowCount = 5;
    if (supabase && isSupabaseConfigured()) {
      try {
        if (payload.reportType === 'CUSTOMERS') {
          const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true });
          if (count !== null && count !== undefined) rowCount = count;
        } else if (payload.reportType === 'DEALS') {
          const { count } = await supabase.from('deals').select('*', { count: 'exact', head: true });
          if (count !== null && count !== undefined) rowCount = count;
        }
      } catch {
        // use fallback
      }
    }

    const newJob: ReportJob = {
      jobUuid,
      reportType: payload.reportType,
      format: payload.format,
      status: 'COMPLETED',
      requestedByFullName: payload.requestedByName || 'Người dùng hiện tại',
      fileName,
      fileSizeBytes: Math.max(1200, rowCount * 320),
      rowCount,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const current = this.getStoredJobs();
    current.unshift(newJob);
    this.saveJobs(current);

    return newJob;
  },

  async download(jobUuid: string, fileName?: string): Promise<void> {
    const jobs = this.getStoredJobs();
    const job = jobs.find((j) => j.jobUuid === jobUuid);
    const reportType = job ? job.reportType : 'CUSTOMERS';

    let csvContent = '\uFEFF'; // BOM UTF-8 for Excel Vietnamese display

    if (reportType === 'CUSTOMERS') {
      let rows: any[] = [];
      if (supabase && isSupabaseConfigured()) {
        const { data } = await supabase.from('customers').select('id, full_name, email, phone_number, company_name, status, lead_source, created_at');
        if (data) rows = data;
      }
      csvContent += 'Mã KH,Họ và Tên,Email,Số Điện Thoại,Công Ty,Trạng Thái,Nguồn Lead,Ngày Tạo\n';
      rows.forEach((r) => {
        csvContent += `"${r.id}","${r.full_name || ''}","${r.email || ''}","${r.phone_number || ''}","${r.company_name || ''}","${r.status || ''}","${r.lead_source || ''}","${r.created_at || ''}"\n`;
      });
    } else if (reportType === 'DEALS') {
      let rows: any[] = [];
      if (supabase && isSupabaseConfigured()) {
        const { data } = await supabase.from('deals').select('id, title, value, probability, stage, expected_close_date, created_at');
        if (data) rows = data;
      }
      csvContent += 'Mã Deal,Tên Cơ Hội,Giá Trị (VNĐ),Xác Suất (%),Giai Đoạn,Ngày Dự Kiến Chốt,Ngày Tạo\n';
      rows.forEach((r) => {
        csvContent += `"${r.id}","${r.title || ''}","${r.value || 0}","${r.probability || 0}","${r.stage || ''}","${r.expected_close_date || ''}","${r.created_at || ''}"\n`;
      });
    } else {
      csvContent += 'Chỉ Số,Giá Trị,Đơn Vị,Thời Điểm\n';
      csvContent += `"Database Engine","Supabase PostgreSQL Cloud","Engine","${new Date().toISOString()}"\n`;
      csvContent += `"Bảo mật RLS","Kích hoạt (Row Level Security)","Security","${new Date().toISOString()}"\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
