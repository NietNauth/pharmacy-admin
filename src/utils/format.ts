import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import type {
  OrderStatus,
  PrescriptionStatus,
  ProductStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole
} from '../types';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' | 'pink' | 'cyan';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy');
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '---';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '---';
  return format(d, 'dd/MM/yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    processing: 'Đang xử lý',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
    refunded: 'Đã hoàn tiền',
  };
  return labels[status];
}

export function getOrderStatusVariant(status: OrderStatus): BadgeVariant {
  const variants: Record<OrderStatus, BadgeVariant> = {
    pending: 'warning',
    confirmed: 'cyan',
    processing: 'purple',
    shipped: 'pink',
    delivered: 'success',
    cancelled: 'error',
    refunded: 'purple',
  };
  return variants[status];
}

export function getPrescriptionStatusLabel(status: PrescriptionStatus): string {
  const labels: Record<PrescriptionStatus, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    expired: 'Hết hạn',
  };
  return labels[status];
}

export function getPrescriptionStatusVariant(status: PrescriptionStatus): BadgeVariant {
  const variants: Record<PrescriptionStatus, BadgeVariant> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    expired: 'neutral',
  };
  return variants[status];
}

export function getProductStatusLabel(status: ProductStatus): string {
  const labels: Record<ProductStatus, string> = {
    active: 'Đang bán',
    inactive: 'Ngừng bán',
    out_of_stock: 'Hết hàng',
    discontinued: 'Bỏ mẫu',
  };
  return labels[status];
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    cod: 'COD',
    bank_transfer: 'Chuyển khoản',
    momo: 'MoMo',
    vnpay: 'VNPay',
    zalopay: 'ZaloPay',
  };
  return labels[method];
}

export function getPaymentMethodVariant(method: PaymentMethod): BadgeVariant {
  const variants: Record<PaymentMethod, BadgeVariant> = {
    cod: 'neutral',
    bank_transfer: 'info',
    momo: 'pink',
    vnpay: 'cyan',
    zalopay: 'success',
  };
  return variants[method];
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    failed: 'Thất bại',
    refunded: 'Đã hoàn tiền',
  };
  return labels[status];
}

export function getPaymentStatusVariant(status: PaymentStatus): BadgeVariant {
  const variants: Record<PaymentStatus, BadgeVariant> = {
    pending: 'warning',
    paid: 'success',
    failed: 'error',
    refunded: 'pink',
  };
  return variants[status];
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    customer: 'Khách hàng',
    pharmacist: 'Dược sĩ',
    admin: 'Quản trị viên',
  };
  return labels[role];
}
