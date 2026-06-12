import React, { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, AlertTriangle, Edit2, X, Check, History, MapPin, ChevronDown, PlusCircle } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { inventoryApi } from '../api/inventory';
import { branchesApi } from '../api/branches';
import type { Inventory, Branch, InventoryLog } from '../types';
import { formatDateTime } from '../utils/format';
import { cn } from '../utils/cn';

const InventoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isPharmacist = user?.role === 'pharmacist';

  const [items, setItems] = useState<Inventory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [error, setError] = useState('');

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving] = useState(false);

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<Inventory | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsMeta, setLogsMeta] = useState<{ last_page: number } | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Restock Modal
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<Inventory | null>(null);
  const [restockQty, setRestockQty] = useState('1');
  const [restockNote, setRestockNote] = useState('');

  const fetchData = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page: p, per_page: 20 };
      if (search) params.search = search;
      if (branchFilter) params.branch_id = branchFilter;
      if (lowStockOnly) params.is_low_stock = true;
      const res = await inventoryApi.getList(params);
      setItems(res.data);
      setTotalPages(res.meta.last_page);
      setTotal(res.meta.total);
    } catch {
      setError('Không thể tải dữ liệu tồn kho');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, branchFilter, lowStockOnly]);

  useEffect(() => {
    if (isAdmin) {
      branchesApi.getList().then(res => setBranches(res.data as Branch[])).catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => { fetchData(page); }, [fetchData, page]);

  const startEdit = (item: Inventory) => {
    setEditingId(item.id);
    setEditQty(String(item.quantity_available));
    setEditNote('');
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (item: Inventory) => {
    setSaving(true);
    try {
      await inventoryApi.update(item.id, { quantity_available: parseInt(editQty), note: editNote || undefined });
      setEditingId(null);
      fetchData(page, true);
    } catch { alert('Cập nhật thất bại'); }
    finally { setSaving(false); }
  };

  const openHistory = async (item: Inventory) => {
    setHistoryItem(item);
    setHistoryModalOpen(true);
    setLogsLoading(true);
    setLogsPage(1);
    setStartDate('');
    setEndDate('');
    try {
      const res = await inventoryApi.getLogs(item.id, { page: 1 });
      setLogs(res.data);
      setLogsMeta(res.meta);
    } catch {
      alert('Không thể tải lịch sử');
    } finally {
      setLogsLoading(false);
    }
  };

  const filterLogs = async () => {
    if (!historyItem) return;
    setLogsLoading(true);
    setLogsPage(1);
    try {
      const res = await inventoryApi.getLogs(historyItem.id, { 
        page: 1, 
        start_date: startDate || undefined, 
        end_date: endDate || undefined 
      });
      setLogs(res.data);
      setLogsMeta(res.meta);
    } catch {
      alert('Lỗi khi lọc lịch sử');
    } finally {
      setLogsLoading(false);
    }
  };

  const loadMoreLogs = async () => {
    if (!historyItem || !logsMeta || logsPage >= logsMeta.last_page) return;
    const nextPage = logsPage + 1;
    setLogsLoading(true);
    try {
      const res = await inventoryApi.getLogs(historyItem.id, { 
        page: nextPage,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      setLogs([...logs, ...res.data]);
      setLogsPage(nextPage);
      setLogsMeta(res.meta);
    } catch {
      alert('Không thể tải thêm lịch sử');
    } finally {
      setLogsLoading(false);
    }
  };

  const openRestock = (item: Inventory) => {
    setRestockItem(item);
    setRestockQty('1');
    setRestockNote('');
    setRestockModalOpen(true);
  };

  const handleRestock = async () => {
    if (!restockItem) return;
    setSaving(true);
    try {
      await inventoryApi.restock(restockItem.id, { 
        quantity: parseInt(restockQty), 
        note: restockNote || undefined 
      });
      setRestockModalOpen(false);
      fetchData(page, true);
    } catch {
      alert('Nhập kho thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper
      title="Tồn kho"
      subtitle={`${total} bản ghi`}
      actions={
        <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => fetchData(page)}>
          Làm mới
        </Button>
      }
    >
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm sản phẩm, mã SKU..."
              className="pl-9 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)] w-60"
            />
          </form>

          {isAdmin && (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <select
                value={branchFilter}
                onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
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

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
              className="w-4 h-4 accent-[var(--accent-primary)]"
            />
            <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Chỉ hàng sắp hết
            </span>
          </label>

          {(search || branchFilter || lowStockOnly) && (
            <button onClick={() => { setSearch(''); setSearchInput(''); setBranchFilter(''); setLowStockOnly(false); setPage(1); }} className="text-sm text-[var(--accent-primary)] hover:underline">Xóa lọc</button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {error && <div className="px-6 py-4 text-sm text-red-500 bg-red-500/5 border-b border-[var(--bg-border)]">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--bg-border)]">
                {['Sản phẩm', isAdmin ? 'Chi nhánh' : null, 'Tồn kho', 'Tồn tối thiểu', 'Trạng thái', 'Cập nhật lần cuối', 'Thao tác'].filter(Boolean).map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-[var(--bg-border)]">
                    {[...Array(isAdmin ? 7 : 6)].map((__, j) => <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full" /></td>)}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 6} className="py-16 text-center text-[var(--text-muted)] italic">Không có dữ liệu tồn kho</td></tr>
              ) : (
                items.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className={`border-b border-[var(--bg-border)] last:border-0 transition-colors ${item.is_low_stock ? 'bg-amber-500/5' : 'hover:bg-[var(--bg-elevated)]'}`}>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-[var(--text-primary)] line-clamp-2 whitespace-normal">{item.product?.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{item.product?.sku} {item.product?.dosage_form && `· ${item.product.dosage_form}`}</div>
                      </td>
                      {isAdmin && <td className="px-5 py-3.5 text-[var(--text-secondary)]">{item.branch?.name}</td>}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              className="w-24 px-2 py-1 bg-[var(--bg-surface)] border border-[var(--accent-primary)] rounded text-sm text-[var(--text-primary)] outline-none"
                            />
                            <input
                              type="text"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="Ghi chú..."
                              className="w-36 px-2 py-1 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded text-xs text-[var(--text-secondary)] outline-none"
                            />
                          </div>
                        ) : (
                          <span className={`font-semibold ${item.is_low_stock ? 'text-amber-500' : 'text-[var(--text-primary)]'}`}>
                            {item.quantity_available.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-secondary)]">{item.quantity_minimum}</td>
                      <td className="px-5 py-3.5">
                        {item.is_low_stock ? (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Sắp hết
                          </Badge>
                        ) : (
                          <Badge variant="success">Đủ hàng</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-secondary)] whitespace-nowrap">
                        {item.updated_at ? formatDateTime(item.updated_at) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(item)} disabled={saving} className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors" title="Lưu">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-border)] transition-colors" title="Hủy">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                               <button onClick={() => openRestock(item)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-500/10 transition-colors" title="Nhập kho">
                                <PlusCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors" title="Chỉnh sửa">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => openHistory(item)} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-primary)] transition-colors" title="Lịch sử">
                                <History className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--bg-border)]">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => {
              setPage(p);
              fetchData(p, true);
              document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
            }} showInfo />
          </div>
        )}
      </Card>

      <Modal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Lịch sử tồn kho: ${historyItem?.product?.name || ''}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--bg-border)] flex justify-between">
            <div>
              <div className="text-xs text-[var(--text-muted)] uppercase mb-1">Hiện tại</div>
              <div className="text-lg font-bold">{historyItem?.quantity_available?.toLocaleString() || '0'} <span className="text-sm font-normal text-[var(--text-secondary)]">{historyItem?.product?.dosage_form}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--bg-border)]">
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Đến ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <button
                onClick={filterLogs}
                disabled={logsLoading}
                className="h-10 px-6 bg-[var(--accent-primary)] text-white text-sm font-bold rounded-xl shadow-lg shadow-[var(--accent-primary)]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                Lọc
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {logsLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--bg-border)]">
                  <div className="flex gap-4 mb-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))
            ) : logs.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-[var(--bg-border)] rounded-2xl">
                <History className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-20" />
                <div className="text-[var(--text-muted)] italic">Chưa có lịch sử thay đổi</div>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="group p-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]/50 border border-[var(--bg-border)] rounded-2xl transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                        log.quantity_delta > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                      )}>
                        {log.quantity_delta > 0 ? <PlusCircle className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 rotate-180" />}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--text-primary)] flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="capitalize">
                            {log.action_type === 'restock' ? 'Nhập kho' :
                             log.action_type === 'adjustment' ? 'Điều chỉnh' :
                             log.action_type === 'sale' ? 'Bán hàng' :
                             log.action_type === 'reserved' ? 'Tạm giữ (Đơn hàng)' :
                             log.action_type === 'released' ? 'Hoàn tồn (Hủy đơn)' :
                             log.action_type === 'expired_removal' ? 'Xuất hủy (Hết hạn)' :
                             log.action_type}
                          </span>
                          <span className={cn(
                            "text-[11px] font-bold px-2 py-0.5 rounded-full",
                            log.quantity_delta > 0 ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
                          )}>
                            {log.quantity_delta > 0 ? `+${log.quantity_delta}` : log.quantity_delta}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-1">
                          <History className="w-3.5 h-3.5" />
                          {formatDateTime(log.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-0.5">Tồn kho sau</div>
                      <div className="text-base font-black text-[var(--text-primary)] leading-none">{log.quantity_after.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-[var(--bg-border)]/50 flex flex-col gap-3">
                    <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-elevated)]/50 p-3 rounded-xl border border-[var(--bg-border)]/30 italic">
                      {log.note ? `"${log.note}"` : '— Không có ghi chú —'}
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                            {log.actor.full_name.charAt(0)}
                          </div>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Cập nhật bởi <span className="text-[var(--text-secondary)] font-semibold">{log.actor.full_name}</span>
                          </span>
                       </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {logsMeta && logsPage < logsMeta.last_page && (
              <button
                onClick={loadMoreLogs}
                disabled={logsLoading}
                className="w-full py-3 mt-4 text-sm font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 hover:bg-[var(--accent-primary)]/10 rounded-xl border border-[var(--accent-primary)]/20 transition-all disabled:opacity-50"
              >
                {logsLoading ? 'Đang tải...' : 'Xem thêm lịch sử'}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Restock Modal */}
      <Modal
        open={restockModalOpen}
        onClose={() => setRestockModalOpen(false)}
        title="Nhập thêm hàng vào kho"
      >
        {restockItem && (
          <div className="space-y-4">
            <div className="p-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--bg-border)]">
              <div className="text-sm font-medium text-[var(--text-primary)]">{restockItem.product?.name}</div>
              <div className="text-xs text-[var(--text-muted)]">{restockItem.branch?.name} · Hiện có: {restockItem.quantity_available}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Số lượng nhập thêm</label>
              <input
                type="number"
                min="1"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                placeholder="Nhập số lượng..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Ghi chú nhập kho</label>
              <textarea
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
                placeholder="Lý do nhập kho, số hóa đơn..."
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] h-20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setRestockModalOpen(false)}>Hủy</Button>
              <Button loading={saving} onClick={handleRestock}>Xác nhận nhập</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
};

export default InventoryPage;
