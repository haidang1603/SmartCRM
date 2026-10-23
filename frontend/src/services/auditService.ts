import { supabase, isSupabaseConfigured } from './supabase';
import type { AuditLog, PageResponse } from '../types';

export const auditService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async list(page = 0, size = 20): Promise<PageResponse<AuditLog>> {
    if (!supabase) {
      return {
        content: [],
        pageNumber: 0,
        pageSize: size,
        totalElements: 0,
        totalPages: 0,
        last: true,
      };
    }

    const from = page * size;
    const to = from + size - 1;

    const { data, count, error } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Lỗi truy vấn nhật ký kiểm toán: ${error.message}`);
    }

    const logs: AuditLog[] = (data || []).map((r: any) => ({
      id: r.id,
      action: r.action,
      entityName: r.entity_name,
      entityId: r.entity_id || undefined,
      performedBy: r.performed_by,
      details: r.details || undefined,
      timestamp: r.timestamp,
      ipAddress: r.ip_address || undefined,
    }));

    const totalElements = count ?? 0;
    const totalPages = Math.ceil(totalElements / size);

    return {
      content: logs,
      pageNumber: page,
      pageSize: size,
      totalElements,
      totalPages,
      last: page >= totalPages - 1,
    };
  },
};
