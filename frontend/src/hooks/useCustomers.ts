import { useState, useCallback, useEffect } from 'react';
import { customerService } from '../services/customerService';
import type { Customer, CustomerStatus, PageResponse } from '../types';

export function useCustomers(initialStatus: CustomerStatus | '' = '', initialPage = 0, pageSize = 10) {
  const [data, setData] = useState<PageResponse<Customer>>({
    content: [],
    pageNumber: initialPage,
    pageSize,
    totalElements: 0,
    totalPages: 0,
    last: true,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<CustomerStatus | ''>(initialStatus);
  const [page, setPage] = useState<number>(initialPage);

  const fetchCustomers = useCallback(async () => {
    if (!customerService.isConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await customerService.list({
        search,
        status,
        page,
        size: pageSize,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Lỗi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, [search, status, page, pageSize]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers: data.content,
    pageResponse: data,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    refresh: fetchCustomers,
    isConfigured: customerService.isConfigured(),
  };
}
