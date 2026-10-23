import { supabase, isSupabaseConfigured } from './supabase';
import type { Customer, CustomerInteraction, CustomerStatus, CustomerSummary, PageResponse } from '../types';

export const customerService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async list(params: {
    search?: string;
    status?: CustomerStatus | '';
    assignedToId?: number | '';
    page?: number;
    size?: number;
  }): Promise<PageResponse<Customer>> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình. Vui lòng thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY');
    }

    const page = params.page ?? 0;
    const size = params.size ?? 10;
    const from = page * size;
    const to = from + size - 1;

    let query = supabase
      .from('customers')
      .select('*, assigned_user:users!fk_customer_assigned_to(full_name)', { count: 'exact' });

    if (params.search && params.search.trim() !== '') {
      const term = `%${params.search.trim()}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term},company_name.ilike.${term}`);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.assignedToId) {
      query = query.eq('assigned_to_id', params.assignedToId);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Lỗi truy vấn khách hàng từ Supabase: ${error.message}`);
    }

    const items: Customer[] = (data || []).map((row: any) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phoneNumber: row.phone_number || undefined,
      companyName: row.company_name || undefined,
      status: row.status as CustomerStatus,
      assignedToId: row.assigned_to_id || undefined,
      assignedToName: row.assigned_user?.full_name || undefined,
      notes: row.notes || undefined,
      isDemo: row.is_demo ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const totalElements = count ?? 0;
    const totalPages = Math.ceil(totalElements / size);

    return {
      content: items,
      pageNumber: page,
      pageSize: size,
      totalElements,
      totalPages,
      last: page >= totalPages - 1,
    };
  },

  async get(id: number): Promise<Customer> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*, assigned_user:users!fk_customer_assigned_to(full_name)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error(`Không tìm thấy khách hàng: ${error?.message}`);
    }

    const row = data as any;
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phoneNumber: row.phone_number || undefined,
      companyName: row.company_name || undefined,
      status: row.status as CustomerStatus,
      assignedToId: row.assigned_to_id || undefined,
      assignedToName: row.assigned_user?.full_name || undefined,
      notes: row.notes || undefined,
      isDemo: row.is_demo ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async create(data: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    companyName?: string;
    status?: CustomerStatus;
    assignedToId?: number;
    notes?: string;
  }): Promise<Customer> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    const { data: created, error } = await (supabase as any)
      .from('customers')
      .insert({
        full_name: data.fullName,
        email: data.email,
        phone_number: data.phoneNumber || null,
        company_name: data.companyName || null,
        status: data.status || 'LEAD',
        assigned_to_id: data.assignedToId || null,
        notes: data.notes || null,
        is_demo: false,
      })
      .select()
      .single();

    if (error || !created) {
      throw new Error(`Lỗi tạo khách hàng trên Supabase: ${error?.message}`);
    }

    return this.get((created as any).id);
  },

  async update(id: number, data: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    companyName?: string;
    status?: CustomerStatus;
    assignedToId?: number;
    notes?: string;
  }): Promise<Customer> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    const { error } = await (supabase as any)
      .from('customers')
      .update({
        full_name: data.fullName,
        email: data.email,
        phone_number: data.phoneNumber || null,
        company_name: data.companyName || null,
        status: data.status,
        assigned_to_id: data.assignedToId || null,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Lỗi cập nhật khách hàng trên Supabase: ${error.message}`);
    }

    return this.get(id);
  },

  async delete(id: number): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      throw new Error(`Lỗi xóa khách hàng trên Supabase: ${error.message}`);
    }
  },

  async summaries(): Promise<CustomerSummary[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, email, company_name')
      .order('full_name');

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      fullName: d.full_name,
      email: d.email,
      companyName: d.company_name || undefined,
    }));
  },

  async getInteractions(customerId: number): Promise<CustomerInteraction[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('customer_interactions')
      .select('*, performed_user:users!fk_interaction_user(full_name)')
      .eq('customer_id', customerId)
      .order('interaction_date', { ascending: false });

    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      customerId: r.customer_id,
      interactionType: r.interaction_type,
      summary: r.summary,
      details: r.details || undefined,
      performedById: r.performed_by_id || undefined,
      performedByName: r.performed_user?.full_name || undefined,
      interactionDate: r.interaction_date,
      createdAt: r.created_at,
    }));
  },

  async addInteraction(customerId: number, data: {
    interactionType: string;
    summary: string;
    details?: string;
    performedById?: number;
    interactionDate?: string;
  }): Promise<CustomerInteraction> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    const { data: created, error } = await (supabase as any)
      .from('customer_interactions')
      .insert({
        customer_id: customerId,
        interaction_type: data.interactionType,
        summary: data.summary,
        details: data.details || null,
        performed_by_id: data.performedById || null,
        interaction_date: data.interactionDate || new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !created) {
      throw new Error(`Lỗi thêm lịch sử tương tác: ${error?.message}`);
    }

    const row = created as any;
    return {
      id: row.id,
      customerId: row.customer_id,
      interactionType: row.interaction_type as any,
      summary: row.summary,
      details: row.details || undefined,
      performedById: row.performed_by_id || undefined,
      interactionDate: row.interaction_date,
      createdAt: row.created_at,
    };
  },
};
