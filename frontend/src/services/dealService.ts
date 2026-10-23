import { supabase, isSupabaseConfigured } from './supabase';
import type { Deal, DealKanbanColumn, DealStage, DealStageHistory, PageResponse } from '../types';

const STAGES: { stage: DealStage; title: string }[] = [
  { stage: 'NEW', title: 'Mới tiếp nhận' },
  { stage: 'CONSULTING', title: 'Tư vấn & Đánh giá' },
  { stage: 'NEGOTIATION', title: 'Đàm phán hợp đồng' },
  { stage: 'WON', title: 'Thành công (Won)' },
  { stage: 'LOST', title: 'Thất bại (Lost)' },
];

export const dealService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async list(page = 0, size = 15): Promise<PageResponse<Deal>> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    const from = page * size;
    const to = from + size - 1;

    const { data, count, error } = await supabase
      .from('deals')
      .select('*, customer:customers!fk_deals_customer(full_name, company_name), assigned_user:users!fk_deals_assigned_to(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Lỗi truy vấn cơ hội bán hàng: ${error.message}`);
    }

    const items: Deal[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      dealValue: Number(row.deal_value),
      stage: row.stage as DealStage,
      probability: row.probability,
      customerId: row.customer_id,
      customerName: row.customer?.full_name || 'Khách hàng',
      customerCompany: row.customer?.company_name || undefined,
      assignedToId: row.assigned_to_id || undefined,
      assignedToName: row.assigned_user?.full_name || undefined,
      expectedCloseDate: row.expected_close_date || undefined,
      actualCloseDate: row.actual_close_date || undefined,
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

  async all(): Promise<Deal[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('deals')
      .select('*, customer:customers!fk_deals_customer(full_name, company_name), assigned_user:users!fk_deals_assigned_to(full_name)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      dealValue: Number(row.deal_value),
      stage: row.stage as DealStage,
      probability: row.probability,
      customerId: row.customer_id,
      customerName: row.customer?.full_name || 'Khách hàng',
      customerCompany: row.customer?.company_name || undefined,
      assignedToId: row.assigned_to_id || undefined,
      assignedToName: row.assigned_user?.full_name || undefined,
      expectedCloseDate: row.expected_close_date || undefined,
      actualCloseDate: row.actual_close_date || undefined,
      notes: row.notes || undefined,
      isDemo: row.is_demo ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async kanban(): Promise<DealKanbanColumn[]> {
    const deals = await this.all();

    return STAGES.map(({ stage, title }) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      const totalValue = stageDeals.reduce((sum, d) => sum + d.dealValue, 0);

      return {
        stage,
        title,
        count: stageDeals.length,
        totalValue,
        deals: stageDeals,
      };
    });
  },

  async get(id: number): Promise<Deal> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    const { data, error } = await supabase
      .from('deals')
      .select('*, customer:customers!fk_deals_customer(full_name, company_name), assigned_user:users!fk_deals_assigned_to(full_name)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error(`Không tìm thấy cơ hội bán hàng: ${error?.message}`);
    }

    const row = data as any;
    return {
      id: row.id,
      title: row.title,
      dealValue: Number(row.deal_value),
      stage: row.stage as DealStage,
      probability: row.probability,
      customerId: row.customer_id,
      customerName: row.customer?.full_name || 'Khách hàng',
      customerCompany: row.customer?.company_name || undefined,
      assignedToId: row.assigned_to_id || undefined,
      assignedToName: row.assigned_user?.full_name || undefined,
      expectedCloseDate: row.expected_close_date || undefined,
      actualCloseDate: row.actual_close_date || undefined,
      notes: row.notes || undefined,
      isDemo: row.is_demo ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async create(data: {
    title: string;
    dealValue: number;
    stage?: DealStage;
    probability?: number;
    customerId: number;
    assignedToId?: number;
    expectedCloseDate?: string;
    notes?: string;
  }): Promise<Deal> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    const { data: created, error } = await (supabase as any)
      .from('deals')
      .insert({
        title: data.title,
        deal_value: data.dealValue,
        stage: data.stage || 'NEW',
        probability: data.probability ?? 10,
        customer_id: data.customerId,
        assigned_to_id: data.assignedToId || null,
        expected_close_date: data.expectedCloseDate || null,
        notes: data.notes || null,
        is_demo: false,
      })
      .select()
      .single();

    if (error || !created) {
      throw new Error(`Lỗi tạo deal trên Supabase: ${error?.message}`);
    }

    const createdId = (created as any).id;

    // Ghi log chuyển đổi giai đoạn đầu tiên vào deal_stage_history
    await (supabase as any).from('deal_stage_history').insert({
      deal_id: createdId,
      previous_stage: null,
      new_stage: data.stage || 'NEW',
      changed_by_id: data.assignedToId || null,
      comment: 'Tạo cơ hội bán hàng mới',
    });

    return this.get(createdId);
  },

  async update(id: number, data: {
    title: string;
    dealValue: number;
    stage?: DealStage;
    probability?: number;
    customerId: number;
    assignedToId?: number;
    expectedCloseDate?: string;
    actualCloseDate?: string;
    notes?: string;
  }): Promise<Deal> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    const { error } = await (supabase as any)
      .from('deals')
      .update({
        title: data.title,
        deal_value: data.dealValue,
        stage: data.stage,
        probability: data.probability,
        customer_id: data.customerId,
        assigned_to_id: data.assignedToId || null,
        expected_close_date: data.expectedCloseDate || null,
        actual_close_date: data.actualCloseDate || null,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Lỗi cập nhật deal: ${error.message}`);
    }

    return this.get(id);
  },

  async updateStage(id: number, data: {
    newStage: DealStage;
    comment?: string;
    changedById?: number;
  }): Promise<Deal> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    // Lấy thông tin deal hiện tại để lưu previousStage
    const currentDeal = await this.get(id);
    const prevStage = currentDeal.stage;

    const isClosedWon = data.newStage === 'WON';
    const isClosedLost = data.newStage === 'LOST';
    const actualCloseDate = (isClosedWon || isClosedLost) ? new Date().toISOString().slice(0, 10) : null;

    const { error: updateError } = await (supabase as any)
      .from('deals')
      .update({
        stage: data.newStage,
        actual_close_date: actualCloseDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Lỗi cập nhật giai đoạn deal: ${updateError.message}`);
    }

    // Thêm bản ghi lịch sử
    await (supabase as any).from('deal_stage_history').insert({
      deal_id: id,
      previous_stage: prevStage,
      new_stage: data.newStage,
      changed_by_id: data.changedById || null,
      comment: data.comment || `Chuyển giai đoạn từ ${prevStage} sang ${data.newStage}`,
    });

    return this.get(id);
  },

  async history(dealId: number): Promise<DealStageHistory[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('deal_stage_history')
      .select('*, changed_user:users!fk_dsh_user(full_name)')
      .eq('deal_id', dealId)
      .order('change_date', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      dealId: r.deal_id,
      previousStage: r.previous_stage as DealStage | undefined,
      newStage: r.new_stage as DealStage,
      changedById: r.changed_by_id || undefined,
      changedByName: r.changed_user?.full_name || undefined,
      changeDate: r.change_date,
      comment: r.comment || undefined,
    }));
  },

  async delete(id: number): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    const { error } = await supabase.from('deals').delete().eq('id', id);
    if (error) {
      throw new Error(`Lỗi xóa deal trên Supabase: ${error.message}`);
    }
  },
};
