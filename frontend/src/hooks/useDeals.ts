import { useState, useCallback, useEffect } from 'react';
import { dealService } from '../services/dealService';
import type { Deal, DealKanbanColumn, DealStage } from '../types';

export function useDeals() {
  const [kanbanColumns, setKanbanColumns] = useState<DealKanbanColumn[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    if (!dealService.isConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [cols, allDeals] = await Promise.all([
        dealService.kanban(),
        dealService.all(),
      ]);
      setKanbanColumns(cols);
      setDeals(allDeals);
    } catch (err: any) {
      setError(err?.message || 'Lỗi tải cơ hội bán hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const updateStage = async (dealId: number, newStage: DealStage, comment?: string) => {
    try {
      await dealService.updateStage(dealId, { newStage, comment });
      await fetchDeals();
    } catch (err: any) {
      throw new Error(err?.message || 'Lỗi cập nhật giai đoạn');
    }
  };

  return {
    kanbanColumns,
    deals,
    loading,
    error,
    refresh: fetchDeals,
    updateStage,
    isConfigured: dealService.isConfigured(),
  };
}
