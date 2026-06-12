import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Edit2, Trash2, 
  Calendar, Tag, AlertCircle
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { couponApi } from '../api/coupons';
import type { Coupon } from '../types';
import { formatCurrency } from '../utils/format';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '../components/ui/Toast';

const Coupons: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCoupons = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await couponApi.getList();
      setCoupons(res.data);
    } catch (err) {
      toastError('Không thể tải danh sách mã giảm giá');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Convert types
    const payload = {
      ...data,
      discount_value: Number(data.discount_value),
      min_order_value: Number(data.min_order_value),
      max_discount: data.max_discount ? Number(data.max_discount) : null,
      max_uses: Number(data.max_uses),
      is_active: data.is_active === 'on'
    };

    try {
      if (editingCoupon) {
        await couponApi.update(editingCoupon.id, payload);
        success('Đã cập nhật mã giảm giá');
      } else {
        await couponApi.create(payload);
        success('Đã tạo mã giảm giá mới');
      }
      setIsModalOpen(false);
      fetchCoupons(true);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
      await couponApi.delete(id);
      success('Đã xóa mã giảm giá');
      fetchCoupons(true);
    } catch (err) {
      toastError('Xóa mã giảm giá thất bại');
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageWrapper 
      title="Quản lý Mã giảm giá"
      subtitle="Tạo và quản lý các chương trình khuyến mãi"
      actions={
        <Button 
          icon={<Plus className="w-4 h-4" />}
          onClick={() => { setEditingCoupon(null); setIsModalOpen(true); }}
        >
          Thêm mã mới
        </Button>
      }
    >
      {/* Search Bar */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input 
            type="text"
            placeholder="Tìm kiếm mã hoặc mô tả..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Coupons Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[var(--bg-border)] bg-[var(--bg-elevated)]/50">
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Mã / Mô tả</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Loại giảm giá</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Giá trị</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Lượt dùng</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Hiệu lực</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg-border)]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-6"><Skeleton className="h-10 w-full" /></td></tr>
                ))
              ) : filteredCoupons.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)] italic">Không tìm thấy mã giảm giá nào</td></tr>
              ) : filteredCoupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-[var(--bg-elevated)]/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-[var(--text-primary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded text-xs self-start border border-[var(--bg-border)]">{coupon.code}</span>
                      <span className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-1">{coupon.description || 'Không có mô tả'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      coupon.discount_type === 'percent' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      <Tag size={12} />
                      {coupon.discount_type === 'percent' ? 'Phần trăm' : 'Cố định'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--text-primary)]">
                      {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : formatCurrency(coupon.discount_value)}
                    </div>
                    {coupon.min_order_value > 0 && (
                      <div className="text-[10px] text-[var(--text-muted)]">ĐH tối thiểu: {formatCurrency(coupon.min_order_value)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden min-w-[60px] border border-[var(--bg-border)]">
                        <div 
                          className="h-full bg-[var(--accent-primary)]" 
                          style={{ width: `${Math.min((coupon.used_count / coupon.max_uses) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">{coupon.used_count}/{coupon.max_uses}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                        <Calendar size={12} className="text-[var(--text-muted)]" />
                        {format(new Date(coupon.valid_from), 'dd/MM/yyyy', { locale: vi })}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-muted)]">
                        <AlertCircle size={12} />
                        {format(new Date(coupon.valid_until), 'dd/MM/yyyy', { locale: vi })}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {coupon.is_active ? (
                      <Badge variant="success">Hoạt động</Badge>
                    ) : (
                      <Badge variant="neutral">Tạm khóa</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingCoupon(coupon); setIsModalOpen(true); }}
                        className="p-2 hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Form */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
        size="xl"
        footer={
          <div className="flex gap-3">
            <Button 
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button 
              onClick={() => (document.getElementById('coupon-form') as HTMLFormElement)?.requestSubmit()}
              className="flex-[2] shadow-lg shadow-[var(--accent-primary)]/20"
              loading={actionLoading}
            >
              {editingCoupon ? 'Cập nhật thay đổi' : 'Tạo mã ngay'}
            </Button>
          </div>
        }
      >
        <form id="coupon-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Mã giảm giá</label>
              <input 
                name="code"
                required
                defaultValue={editingCoupon?.code}
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl focus:border-[var(--accent-primary)] outline-none font-bold uppercase transition-colors"
                placeholder="VÍ DỤ: GIAM50K"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Loại giảm giá</label>
              <select 
                name="discount_type"
                defaultValue={editingCoupon?.discount_type || 'fixed'}
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl focus:border-[var(--accent-primary)] outline-none font-bold transition-colors"
              >
                <option value="fixed">Giảm tiền cố định</option>
                <option value="percent">Giảm theo %</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Mô tả</label>
            <textarea 
              name="description"
              defaultValue={editingCoupon?.description}
              className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl focus:border-[var(--accent-primary)] outline-none font-medium transition-colors"
              rows={2}
              placeholder="Nhập mô tả cho chương trình khuyến mãi..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Giá trị giảm</label>
              <input 
                name="discount_value"
                type="number"
                required
                defaultValue={editingCoupon?.discount_value}
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl focus:border-[var(--accent-primary)] outline-none font-bold transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Đơn tối thiểu</label>
              <input 
                name="min_order_value"
                type="number"
                defaultValue={editingCoupon?.min_order_value || 0}
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl focus:border-[var(--accent-primary)] outline-none font-bold transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Giảm tối đa</label>
              <input 
                name="max_discount"
                type="number"
                defaultValue={editingCoupon?.max_discount || ''}
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl focus:border-[var(--accent-primary)] outline-none font-bold transition-colors"
                placeholder="Chỉ cho %"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Tổng lượt dùng</label>
              <input 
                name="max_uses"
                type="number"
                required
                defaultValue={editingCoupon?.max_uses}
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl focus:border-[var(--accent-primary)] outline-none font-bold transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Ngày bắt đầu</label>
              <input 
                name="valid_from"
                type="date"
                required
                defaultValue={editingCoupon?.valid_from ? format(new Date(editingCoupon.valid_from), 'yyyy-MM-dd') : ''}
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl focus:border-[var(--accent-primary)] outline-none font-bold transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Ngày kết thúc</label>
              <input 
                name="valid_until"
                type="date"
                required
                defaultValue={editingCoupon?.valid_until ? format(new Date(editingCoupon.valid_until), 'yyyy-MM-dd') : ''}
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl focus:border-[var(--accent-primary)] outline-none font-bold transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input 
              type="checkbox" 
              name="is_active" 
              id="is_active"
              defaultChecked={editingCoupon ? editingCoupon.is_active : true}
              className="w-4 h-4 rounded border-[var(--bg-border)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]" 
            />
            <label htmlFor="is_active" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">Kích hoạt mã ngay</label>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Coupons;
