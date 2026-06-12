import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, User, MapPin, CreditCard, 
  Clock, AlertCircle, Printer, ShoppingBag 
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { ordersApi } from '../api/orders';
import type { OrderDetail, OrderStatus } from '../types';
import { 
  formatCurrency, 
  formatDateTime, 
  getOrderStatusLabel, 
  getOrderStatusVariant, 
  getPaymentMethodLabel, 
  getPaymentMethodVariant, 
  getPaymentStatusLabel, 
  getPaymentStatusVariant 
} from '../utils/format';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const getCustomOrderStatusLabel = (status: string, deliveryType?: string) => {
    if (deliveryType === 'pickup') {
      if (status === 'processing') return 'Đang đóng gói';
      if (status === 'shipped') return 'Sẵn sàng tại chi nhánh';
      if (status === 'delivered') return 'Đã nhận hàng';
    }
    return getOrderStatusLabel(status as any);
  };
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'status' | 'payment';
    value: string;
    label: string;
  }>({ show: false, type: 'status', value: '', label: '' });

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      // If the notification link matches current order path, refresh details
      const link = e.detail?.data?.link;
      if (link && link.includes(id)) {
        fetchOrderDetail();
      }
    };
    window.addEventListener('new-notification', handleUpdate);
    return () => window.removeEventListener('new-notification', handleUpdate);
  }, [id]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getAdminDetail(id!);
      setOrder(res.data);
    } catch {
      alert('Không thể tải chi tiết đơn hàng');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      await ordersApi.updateStatus(order.id, status);
      setConfirmModal(prev => ({ ...prev, show: false }));
      fetchOrderDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentStatus = async (status: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      await ordersApi.updatePaymentStatus(order.id, status);
      setConfirmModal(prev => ({ ...prev, show: false }));
      fetchOrderDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cập nhật trạng thái thanh toán thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const openConfirmModal = (type: 'status' | 'payment', value: string, label: string) => {
    setConfirmModal({ show: true, type, value, label });
  };

  if (loading) {
    return (
      <PageWrapper title="Chi tiết đơn hàng">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </PageWrapper>
    );
  }

  if (!order) return null;

  const availableNextStatus = NEXT_STATUS[order.status] ?? [];

  return (
    <>
      <PageWrapper
        title={`Chi tiết đơn hàng: ${order.order_code}`}
        subtitle={`Đặt lúc ${formatDateTime(order.created_at)}`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/orders')}
            >
              Quay lại
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              In hóa đơn
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Order Status Card (Green) */}
            <Card className="p-6 border-l-4 border-l-emerald-500">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <Package size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] font-medium">Trạng thái đơn hàng</p>
                    <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={order.payment ? getOrderStatusVariant(order.status) : 'neutral'} size="md">
                      {getCustomOrderStatusLabel(order.status, order.delivery_type)}
                    </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableNextStatus.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={status === 'cancelled' ? 'danger' : 'primary'}
                      onClick={() => openConfirmModal('status', status, getCustomOrderStatusLabel(status, order.delivery_type))}
                    >
                      Chuyển sang: {getCustomOrderStatusLabel(status, order.delivery_type)}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* 2. Payment Details Card (RED BORDER) */}
            <Card className="p-6 border-l-4 border-l-red-500">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] font-medium">Chi tiết thanh toán</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={order.payment ? getPaymentStatusVariant(order.payment.status) : 'neutral'} size="md">
                        {order.payment ? getPaymentStatusLabel(order.payment.status) : 'Chưa có'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {order.payment?.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-red-600 hover:bg-red-700 border-none"
                    onClick={() => openConfirmModal('payment', 'paid', 'Đã thanh toán')}
                  >
                    Xác nhận đã thu tiền
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[var(--bg-border)] pt-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Phương thức</span>
                    <div className="flex items-center gap-2">
                    <Badge variant={order.payment ? getPaymentMethodVariant(order.payment.method) : 'neutral'} size="sm">
                      {order.payment ? getPaymentMethodLabel(order.payment.method) : '—'}
                    </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Mã giao dịch</span>
                    <span className="text-sm font-mono font-bold text-[var(--text-primary)]">{order.payment?.transaction_id ?? 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Thời gian thanh toán</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {order.payment?.paid_at ? formatDateTime(order.payment.paid_at) : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Products List Card (Blue) */}
            <Card className="border-l-4 border-l-blue-500 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] font-medium">Danh sách sản phẩm</p>
                    <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{order.items.length} món hàng</p>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--bg-elevated)] border-y border-[var(--bg-border)]">
                        <th className="text-left px-6 py-3 font-bold text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">Sản phẩm</th>
                        <th className="text-center px-6 py-3 font-bold text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">Số lượng</th>
                        <th className="text-right px-6 py-3 font-bold text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">Đơn giá</th>
                        <th className="text-right px-6 py-3 font-bold text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-b border-[var(--bg-border)] last:border-0 hover:bg-[var(--bg-elevated)]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {item.product?.primary_image && (
                                <img src={item.product.primary_image} alt="" className="w-12 h-12 rounded-xl object-cover bg-[var(--bg-base)] border border-[var(--bg-border)] shadow-sm" />
                              )}
                              <div>
                                <p className="font-bold text-[var(--text-primary)] leading-tight">{item.product?.name ?? 'Sản phẩm đã xóa'}</p>
                                <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">ID: {item.product?.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-[var(--text-primary)]">{item.quantity}</td>
                          <td className="px-6 py-4 text-right font-medium text-[var(--text-secondary)]">{formatCurrency(item.unit_price)}</td>
                          <td className="px-6 py-4 text-right font-black text-blue-600">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 flex justify-end pt-6 border-t border-[var(--bg-border)]">
                  <div className="w-full max-w-xs space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Tạm tính:</span>
                      <span className="font-bold text-[var(--text-primary)]">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Phí vận chuyển:</span>
                      <span className="font-bold text-[var(--text-primary)]">{formatCurrency(order.shipping_fee)}</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-500 font-medium">Giảm giá voucher:</span>
                        <span className="font-bold text-red-500">-{formatCurrency(order.discount_amount)}</span>
                      </div>
                    )}
                    <div className="h-px bg-gradient-to-r from-transparent via-[var(--bg-border)] to-transparent my-4" />
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <span className="text-sm font-bold text-blue-900">Tổng cộng:</span>
                      <span className="text-2xl font-black text-blue-600 font-mono">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--bg-border)] pb-4 mb-4">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                  <User size={18} />
                </div>
                <h3 className="font-bold text-[var(--text-primary)]">Khách hàng</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--bg-base)] rounded-full flex items-center justify-center text-[var(--text-muted)]">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{order.recipient_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{order.recipient_phone}</p>
                  </div>
                </div>
                {order.note && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-500 mt-0.5" />
                    <p className="text-xs text-amber-800 font-medium">Ghi chú: {order.note}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--bg-border)] pb-4 mb-4">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                  <MapPin size={18} />
                </div>
                <h3 className="font-bold text-[var(--text-primary)]">Giao hàng</h3>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--text-muted)] font-medium">Phương thức</span>
                  <Badge variant={order.delivery_type === 'pickup' ? 'warning' : 'info'} size="sm" className="w-fit">
                    {order.delivery_type === 'standard' ? 'Giao tiêu chuẩn' : 
                     order.delivery_type === 'express' ? 'Giao hỏa tốc' : 'Nhận tại quầy'}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--text-muted)] font-medium">Địa chỉ</span>
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">{order.delivery_address}</p>
                </div>
                {order.branch && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Chi nhánh xử lý</p>
                    <p className="text-xs text-blue-700 font-bold">{order.branch.name}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 border-b border-[var(--bg-border)] pb-4 mb-4">
                <div className="w-8 h-8 bg-slate-500/10 rounded-lg flex items-center justify-center text-slate-500">
                  <Clock size={18} />
                </div>
                <h3 className="font-bold text-[var(--text-primary)]">Lịch sử</h3>
              </div>
              <div className="space-y-6">
                {!order.histories || order.histories.length === 0 ? (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5" />
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">Đặt hàng thành công</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{formatDateTime(order.created_at)}</p>
                    </div>
                  </div>
                ) : (
                  order.histories.map((history, idx) => (
                    <div key={history.id} className="flex gap-3 relative">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 z-10" />
                      {idx < order.histories.length - 1 && (
                        <div className="absolute top-4 left-1 w-px h-full bg-[var(--bg-border)]" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">
                          {idx === 0 && history.status === 'pending' ? 'Đặt hàng thành công' : getCustomOrderStatusLabel(history.status, order.delivery_type)}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {formatDateTime(history.created_at)}
                          {history.note && ` • ${history.note}`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </PageWrapper>

      {/* Confirmation Modal */}
      <Modal
        open={confirmModal.show}
        onClose={() => !updating && setConfirmModal(prev => ({ ...prev, show: false }))}
        title="Xác nhận thay đổi"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Bạn có chắc chắn muốn chuyển {confirmModal.type === 'status' ? 'trạng thái đơn hàng' : 'trạng thái thanh toán'} sang <strong>{confirmModal.label}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="secondary" 
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
              disabled={updating}
            >
              Hủy
            </Button>
            <Button 
              variant="primary" 
              loading={updating}
              onClick={() => {
                if (confirmModal.type === 'status') {
                  handleUpdateStatus(confirmModal.value as any);
                } else {
                  handleUpdatePaymentStatus(confirmModal.value);
                }
              }}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default OrderDetail;
