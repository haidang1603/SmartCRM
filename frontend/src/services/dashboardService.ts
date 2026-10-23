import { supabase, isSupabaseConfigured } from './supabase';
import type { DashboardMetrics, Deal, DealStage, StageStat } from '../types';

export const dashboardService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async getMetrics(): Promise<DashboardMetrics> {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình');
    }

    // 1. Thống kê khách hàng
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const { count: realCustomersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('is_demo', false);

    const { count: demoCustomersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('is_demo', true);

    // 2. Thống kê cơ hội bán hàng (Deals)
    const { data: dealsData, error: dealsError } = await supabase
      .from('deals')
      .select('*, customer:customers!fk_deals_customer(full_name), assigned_user:users!fk_deals_assigned_to(full_name)');

    if (dealsError) {
      throw new Error(`Lỗi thống kê cơ hội bán hàng: ${dealsError.message}`);
    }

    const allDeals = dealsData || [];

    const stages: DealStage[] = ['NEW', 'CONSULTING', 'NEGOTIATION', 'WON', 'LOST'];
    const stageLabels: Record<DealStage, string> = {
      NEW: 'Mới tiếp nhận',
      CONSULTING: 'Tư vấn & Đánh giá',
      NEGOTIATION: 'Đàm phán',
      WON: 'Thành công (Won)',
      LOST: 'Thất bại (Lost)',
    };

    let totalPipelineValue = 0;
    let wonRevenue = 0;
    let openDealsCount = 0;

    const stageMap: Record<DealStage, { count: number; totalValue: number }> = {
      NEW: { count: 0, totalValue: 0 },
      CONSULTING: { count: 0, totalValue: 0 },
      NEGOTIATION: { count: 0, totalValue: 0 },
      WON: { count: 0, totalValue: 0 },
      LOST: { count: 0, totalValue: 0 },
    };

    allDeals.forEach((d: any) => {
      const val = Number(d.deal_value) || 0;
      const st = d.stage as DealStage;
      if (stageMap[st]) {
        stageMap[st].count += 1;
        stageMap[st].totalValue += val;
      }
      if (st === 'WON') {
        wonRevenue += val;
      } else if (st !== 'LOST') {
        openDealsCount += 1;
        totalPipelineValue += val;
      }
    });

    const stageBreakdown: StageStat[] = stages.map((st) => ({
      stage: st,
      label: stageLabels[st],
      count: stageMap[st].count,
      totalValue: stageMap[st].totalValue,
    }));

    // Top 5 deals mới nhất
    const recentDeals: Deal[] = allDeals
      .slice(0, 5)
      .map((row: any) => ({
        id: row.id,
        title: row.title,
        dealValue: Number(row.deal_value),
        stage: row.stage as DealStage,
        probability: row.probability,
        customerId: row.customer_id,
        customerName: row.customer?.full_name || 'Khách hàng',
        assignedToId: row.assigned_to_id || undefined,
        assignedToName: row.assigned_user?.full_name || undefined,
        expectedCloseDate: row.expected_close_date || undefined,
        actualCloseDate: row.actual_close_date || undefined,
        notes: row.notes || undefined,
        isDemo: row.is_demo ?? false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

    return {
      totalCustomers: totalCustomers ?? 0,
      realCustomersCount: realCustomersCount ?? 0,
      demoCustomersCount: demoCustomersCount ?? 0,
      openDealsCount,
      totalPipelineValue,
      wonRevenue,
      stageBreakdown,
      recentDeals,
      containsDemoData: (demoCustomersCount ?? 0) > 0,
      dataModeNotice: 'Dữ liệu trực tiếp từ Supabase Database',
    };
  },
};
