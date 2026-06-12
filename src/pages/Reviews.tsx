import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  MessageSquare, 
  Eye, 
  EyeOff, 
  Reply, 
  Trash2, 
  CheckCircle2, 
  Package,
  User,
  Clock,
  Send,
  Edit2
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Pagination } from '../components/ui/Pagination';
import { reviewsApi } from '../api/reviews';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import type { ProductQa } from '../types';
import { formatRelativeTime } from '../utils/format';

const ProductQas: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [qas, setQas] = useState<ProductQa[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Reply state
  const [isReplying, setIsReplying] = useState(false);
  const [currentQa, setCurrentQa] = useState<ProductQa | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQas = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: any = { 
        page: p, 
        per_page: 10,
        include: 'user,product.images'
      };
      if (search) params.search = search;
      if (statusFilter !== 'all') {
        params.is_visible = statusFilter === 'visible' ? 1 : 0;
      }

      const res = await reviewsApi.getList(params);
      setQas(res.data.data);
      setTotalPages(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch (err) {
      toastError('Không thể tải danh sách câu hỏi');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, statusFilter, toastError]);

  useEffect(() => {
    fetchQas(1);
    setPage(1);
  }, [fetchQas]);

  const handleToggleVisibility = async (qa: ProductQa) => {
    try {
      await reviewsApi.update(qa.id, { is_visible: !qa.is_visible });
      success(qa.is_visible ? 'Đã ẩn câu hỏi' : 'Đã hiện câu hỏi');
      fetchQas(page, true);
    } catch (err) {
      toastError('Cập nhật trạng thái thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
    try {
      await reviewsApi.remove(id);
      success('Xóa câu hỏi thành công');
      fetchQas(page, true);
    } catch (err) {
      toastError('Xóa thất bại');
    }
  };

  const handleOpenReply = (qa: ProductQa) => {
    setCurrentQa(qa);
    setReplyText(qa.admin_reply || '');
    setIsReplying(true);
  };

  const handleSendReply = async () => {
    if (!currentQa || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await reviewsApi.reply(currentQa.id, replyText);
      success('Đã gửi câu trả lời');
      setIsReplying(false);
      fetchQas(page, true);
    } catch (err) {
      toastError('Gửi phản hồi thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper
      title="Hỏi & Đáp"
      subtitle={`Quản lý ${total} câu hỏi từ khách hàng`}
    >
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm theo nội dung câu hỏi hoặc tên khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--bg-border)]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${statusFilter === 'all' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-border)]/50'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('visible')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${statusFilter === 'visible' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-border)]/50'}`}
            >
              Đang hiện
            </button>
            <button
              onClick={() => setStatusFilter('hidden')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${statusFilter === 'hidden' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-border)]/50'}`}
            >
              Đang ẩn
            </button>
          </div>
        </div>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {loading && qas.length === 0 ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="p-6"><Skeleton className="h-32 w-full" /></Card>
          ))
        ) : qas.length === 0 ? (
          <Card className="p-12 text-center text-[var(--text-muted)] italic">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            Chưa có câu hỏi nào cần xử lý
          </Card>
        ) : (
          qas.map((qa) => (
            <Card key={qa.id} className={`p-6 transition-all border-l-4 ${qa.admin_reply ? 'border-emerald-500' : 'border-amber-500'}`}>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Info */}
                <div className="md:w-48 shrink-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] flex items-center justify-center overflow-hidden shrink-0">
                      {qa.product?.primary_image ? (
                        <img src={qa.product.primary_image} alt={qa.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{qa.product?.name ?? 'Sản phẩm không tồn tại'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <User size={14} className="text-[var(--accent-primary)]" />
                      <span className="font-medium truncate">{qa.user?.full_name || 'Khách hàng'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                      <Clock size={12} />
                      {formatRelativeTime(qa.created_at)}
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[var(--text-primary)]">Câu hỏi từ khách hàng</h4>
                      {qa.is_visible ? (
                        <Badge variant="success" className="text-[10px]">Đang hiển thị</Badge>
                      ) : (
                        <Badge variant="neutral" className="text-[10px]">Đang ẩn</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleToggleVisibility(qa)}
                        className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
                        title={qa.is_visible ? "Ẩn câu hỏi" : "Hiện câu hỏi"}
                      >
                        {qa.is_visible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button 
                        onClick={() => handleDelete(qa.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 italic">
                    "{qa.body}"
                  </p>

                  {/* Admin Reply */}
                  {qa.admin_reply ? (
                    <div className="bg-[var(--bg-elevated)]/50 p-4 rounded-xl border border-[var(--bg-border)] relative group">
                      <div className="flex items-center gap-2 text-[var(--accent-primary)] font-bold text-[10px] uppercase tracking-wider mb-2">
                        <CheckCircle2 size={12} />
                        PharmaVN đã trả lời
                      </div>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                        {qa.admin_reply}
                      </p>
                      <button 
                        onClick={() => handleOpenReply(qa)}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-[var(--accent-primary)]"
                        title="Sửa câu trả lời"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenReply(qa)}
                      className="flex items-center gap-2 text-sm font-bold text-[var(--accent-primary)] hover:opacity-80 transition-opacity"
                    >
                      <Reply size={16} />
                      Trả lời câu hỏi này
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => { setPage(p); fetchQas(p, true); }}
          />
        </div>
      )}

      {/* Reply Modal */}
      <Modal
        open={isReplying}
        onClose={() => setIsReplying(false)}
        title="Trả lời câu hỏi khách hàng"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Câu hỏi của {currentQa?.user?.full_name || 'Khách hàng'}:</div>
            <p className="text-sm text-slate-600 italic">"{currentQa?.body}"</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung câu trả lời</label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Nhập câu trả lời tư vấn cho khách hàng..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] transition-colors min-h-[150px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsReplying(false)}>Hủy</Button>
            <Button 
              onClick={handleSendReply}
              loading={submitting}
              icon={<Send className="w-4 h-4" />}
            >
              Gửi câu trả lời
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
};

export default ProductQas;
