import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, ChevronDown, MapPin } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { ordersApi } from '../api/orders';
import { useAuthStore } from '../stores/authStore';
import { branchesApi } from '../api/branches';
import type { Order, OrderStatus, Branch } from '../types';
import { formatCurrency, formatDateTime, getOrderStatusLabel, getOrderStatusVariant, getPaymentMethodLabel, getPaymentMethodVariant, getPaymentStatusLabel, getPaymentStatusVariant } from '../utils/format';

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
};

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isPharmacist = user?.role === 'pharmacist';

  const getCustomOrderStatusLabel = (status: string, deliveryType?: string) => {
    if (deliveryType === 'pickup') {
      if (status === 'processing') return 'Đang đóng gói';
      if (status === 'shipped') return 'Sẵn sàng tại chi nhánh';
      if (status === 'delivered') return 'Đã nhận hàng';
    }
    return getOrderStatusLabel(status as any);
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [branchFilter, setBranchFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState('');

  const [updating, setUpdating] = useState(false);
  
  // Update status modal
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');

  const fetchOrders = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page: p, per_page: 20 };
      if (statusFilter) params.status = statusFilter;
      if (branchFilter) params.branch_id = branchFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await ordersApi.getAdminList(params);
      setOrders(res.data);
      setTotalPages(res.meta.last_page);
      setTotal(res.meta.total);
    } catch {
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, branchFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (isAdmin) {
      branchesApi.getList().then(res => setBranches(res.data as Branch[])).catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchOrders(1);
    setPage(1);
  }, [fetchOrders]);

  useEffect(() => {
    const handleNewNotification = (e: any) => {
      // Refresh list for ANY order-related notification
      const title = (e.detail?.data?.title || '').toLowerCase();
      if (title.includes('đơn hàng')) {
        fetchOrders(page, true);
      }
    };
    window.addEventListener('new-notification', handleNewNotification);
    return () => window.removeEventListener('new-notification', handleNewNotification);
  }, [fetchOrders, page]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchOrders(p, true);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openUpdateModal = (order: Order) => {
    setUpdatingOrder(order);
    setSelectedStatus('');
  };

  const handleUpdateStatus = async () => {
    if (!updatingOrder || !selectedStatus) return;
    setUpdating(true);
    try {
      await ordersApi.updateStatus(updatingOrder.id, selectedStatus as OrderStatus);
      setUpdatingOrder(null);
      fetchOrders(page, true);
    } catch {
      alert('Cập nhật trạng thái thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewDetail = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const canUpdate = updatingOrder ? (NEXT_STATUS[updatingOrder.status] ?? []).length > 0 : false;

  return (
    <PageWrapper
      title="Đơn hàng"
      subtitle={`Tổng ${total} đơn hàng`}
      actions={
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={() => fetchOrders(page)}
        >
          Làm mới
        </Button>
      }
    >
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
              className="pl-9 pr-8 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] appearance-none cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
          </div>

          {isAdmin && (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] appearance-none cursor-pointer"
              >
                <option value="">Tất cả chi nhánh</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
            </div>
          )}

          {isPharmacist && user?.branch && (
             <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-secondary)]">
                <MapPin className="w-4 h-4" />
                <span>Chi nhánh: <span className="font-medium text-[var(--text-primary)]">{user.branch.name}</span></span>
             </div>
          )}

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            placeholder="Từ ngày"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            placeholder="Đến ngày"
          />
          {(statusFilter || branchFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setStatusFilter(''); setBranchFilter(''); setDateFrom(''); setDateTo(''); }}
              className="text-sm text-[var(--accent-primary)] hover:underline"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {error && (
          <div className="px-6 py-4 text-sm text-red-500 bg-red-500/5 border-b border-[var(--bg-border)]">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--bg-border)]">
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Mã đơn</th>
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Khách hàng</th>
                {isAdmin && <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Chi nhánh</th>}
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Trạng thái</th>
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Nhận hàng</th>
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Thanh toán</th>
                <th className="text-right px-5 py-3 font-medium text-[var(--text-secondary)]">Tổng tiền</th>
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Thời gian</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-[var(--bg-border)]">
                    {[...Array(isAdmin ? 8 : 7)].map((__, j) => (
                      <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-[var(--text-muted)] italic">
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-[var(--bg-border)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="px-5 py-3.5">
                      <button 
                        onClick={() => handleViewDetail(order.id)}
                        className="font-mono font-bold text-[var(--accent-primary)] hover:underline"
                      >
                        {order.order_code}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-primary)]">
                      <div>{order.user?.name ?? '—'}</div>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-[var(--text-secondary)]">
                        {order.branch?.name ?? '—'}
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <Badge variant={getOrderStatusVariant(order.status)}>
                        {getCustomOrderStatusLabel(order.status, order.delivery_type)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={order.delivery_type === 'pickup' ? 'warning' : 'info'}>
                        {order.delivery_type === 'standard' ? 'Giao tiêu chuẩn' : 
                         order.delivery_type === 'express' ? 'Giao hỏa tốc' : 'Nhận tại quầy'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {order.payment ? (
                        <div className="flex flex-col gap-1.5">
                          <Badge variant={getPaymentMethodVariant(order.payment.method)} size="sm" className="w-fit font-bold">
                            {getPaymentMethodLabel(order.payment.method)}
                          </Badge>
                          <Badge variant={getPaymentStatusVariant(order.payment.status)} size="sm" className="w-fit">
                            {getPaymentStatusLabel(order.payment.status)}
                          </Badge>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-[var(--text-primary)]">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)] whitespace-nowrap">
                      {order.created_at ? formatDateTime(order.created_at) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {(NEXT_STATUS[order.status] ?? []).length > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openUpdateModal(order)}
                        >
                          Cập nhật
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--bg-border)]">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} showInfo />
          </div>
        )}
      </Card>

      {/* Update Status Modal */}
      <Modal
        open={!!updatingOrder}
        onClose={() => setUpdatingOrder(null)}
        title="Cập nhật trạng thái đơn hàng"
      >
        {updatingOrder && (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-[var(--text-secondary)]">
              Đơn hàng: <span className="font-mono font-semibold text-[var(--text-primary)]">{updatingOrder.order_code}</span>
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              Trạng thái hiện tại:{' '}
              <Badge variant={getOrderStatusVariant(updatingOrder.status)}>
                {getCustomOrderStatusLabel(updatingOrder.status, updatingOrder.delivery_type)}
              </Badge>
            </div>
            {canUpdate ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Trạng thái mới</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="">-- Chọn trạng thái --</option>
                    {(NEXT_STATUS[updatingOrder.status] ?? []).map((s) => (
                      <option key={s} value={s}>{getCustomOrderStatusLabel(s, updatingOrder.delivery_type)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setUpdatingOrder(null)}>Hủy</Button>
                  <Button
                    disabled={!selectedStatus || updating}
                    loading={updating}
                    onClick={handleUpdateStatus}
                  >
                    Xác nhận
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--text-muted)] italic">Đơn hàng này không thể thay đổi trạng thái.</p>
            )}
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
};

export default Orders;
