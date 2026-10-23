import React from 'react';
import type { CustomerStatus, DealStage } from '../types';

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyShort(amount: number | undefined | null): string {
  if (!amount) return '0 ₫';
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} Tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)} Tr`;
  }
  return formatCurrency(amount);
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getCustomerStatusBadge(status: CustomerStatus): React.ReactNode {
  let label: string = status;
  let className = 'badge-status-default';
  switch (status) {
    case 'LEAD':
      label = 'Tiềm năng (Lead)';
      className = 'badge-status-lead';
      break;
    case 'PROSPECT':
      label = 'Triển vọng (Prospect)';
      className = 'badge-status-prospect';
      break;
    case 'ACTIVE_CLIENT':
      label = 'Khách hàng (Active)';
      className = 'badge-status-active';
      break;
    case 'INACTIVE':
      label = 'Ngừng chăm sóc';
      className = 'badge-status-inactive';
      break;
  }
  return React.createElement('span', { className: `badge ${className}` }, label);
}

export function getDealStageBadge(stage: DealStage): React.ReactNode {
  let label: string = stage;
  let className = 'badge-deal-default';
  switch (stage) {
    case 'NEW':
      label = 'Mới tạo';
      className = 'badge-deal-new';
      break;
    case 'CONSULTING':
      label = 'Tư vấn';
      className = 'badge-deal-consulting';
      break;
    case 'NEGOTIATION':
      label = 'Đàm phán';
      className = 'badge-deal-negotiation';
      break;
    case 'WON':
      label = 'Thành công';
      className = 'badge-deal-won';
      break;
    case 'LOST':
      label = 'Thất bại';
      className = 'badge-deal-lost';
      break;
  }
  return React.createElement('span', { className: `badge ${className}` }, label);
}
