import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, LayoutGrid, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Pagination } from '../components/ui/Pagination';
import { categoriesApi } from '../api/categories';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { cn } from '../utils/cn';
import type { Category } from '../types';

const Categories: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allParents, setAllParents] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent_id: '',
    icon_url: '',
    display_order: 0,
    is_active: true,
    is_featured: false,
    show_on_home: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Fetch all for tree view to work properly
      const res = await categoriesApi.getList();
      setCategories(res.data);
    } catch (err) {
      toastError('Không thể tải danh sách danh mục');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toastError]);

  const fetchAllParents = useCallback(async () => {
    try {
      const res = await categoriesApi.getList({ parent_only: true });
      setAllParents(res.data);
    } catch {
      // Ignore error for parents fetch
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchAllParents();
  }, [fetchCategories, fetchAllParents]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const allParentIds = categories.filter(c => categories.some(child => child.parent_id === c.id)).map(c => c.id);
    setExpandedIds(new Set(allParentIds));
  };

  const collapseAll = () => setExpandedIds(new Set());

  const handleOpenModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        parent_id: category.parent_id || '',
        icon_url: category.icon_url || '',
        display_order: category.display_order,
        is_active: category.is_active,
        is_featured: !!category.is_featured,
        show_on_home: !!category.show_on_home,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        parent_id: '',
        icon_url: '',
        display_order: 0,
        is_active: true,
        is_featured: false,
        show_on_home: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id || null,
        // If it's a child, set display_order to 0 (or some default) if you want to disable it
        display_order: formData.parent_id ? 0 : formData.display_order,
      };

      // Check for duplicate display_order among siblings
      const siblings = categories.filter(c => (c.parent_id || null) === (payload.parent_id || null) && c.id !== editingCategory?.id);
      if (!payload.parent_id && siblings.some(s => s.display_order === payload.display_order && payload.display_order !== 0)) {
        if (!window.confirm(`Thứ tự ${payload.display_order} đã tồn tại ở danh mục gốc khác. Bạn vẫn muốn tiếp tục?`)) {
          setSubmitting(false);
          return;
        }
      }

      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, payload);
        success('Cập nhật danh mục thành công');
      } else {
        await categoriesApi.create(payload);
        success('Tạo danh mục thành công');
      }
      setIsModalOpen(false);
      fetchCategories(true);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await categoriesApi.remove(id);
      success('Xóa danh mục thành công');
      fetchCategories(true);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Xóa danh mục thất bại');
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await categoriesApi.update(category.id, { is_active: !category.is_active });
      success('Đã cập nhật trạng thái');
      fetchCategories(true);
    } catch {
      toastError('Cập nhật thất bại');
    }
  };

  const handleToggleFeatured = async (category: Category) => {
    try {
      await categoriesApi.update(category.id, { is_featured: !category.is_featured });
      success('Đã cập nhật trạng thái nổi bật');
      fetchCategories(true);
    } catch {
      toastError('Cập nhật thất bại');
    }
  };

  // Categories is already sorted and filtered by server
  const parentOptions = allParents;

  // Filter by search
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Get root categories from filtered list
  const rootCategories = filteredCategories.filter(c => !c.parent_id);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(rootCategories.length / itemsPerPage);
  const paginatedRoots = rootCategories.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Function to check if an item should be visible in the tree
  const isVisible = (cat: Category) => {
    // If it's a root, it must be in the current paginated page
    if (!cat.parent_id) return paginatedRoots.some(r => r.id === cat.id);
    
    // If it's a child, its parent must be expanded AND visible
    let current: Category | undefined = cat;
    while (current?.parent_id) {
      if (!expandedIds.has(current.parent_id)) return false;
      const parent = categories.find(p => p.id === current?.parent_id);
      if (!parent) return false;
      if (!parent.parent_id) return paginatedRoots.some(r => r.id === parent.id);
      current = parent;
    }
    return true;
  };

  const visibleCategories = filteredCategories.filter(isVisible);

  return (
    <PageWrapper
      title="Quản lý Danh mục"
      subtitle={`Tổng số ${categories.length} danh mục`}
      actions={
        <div className="flex gap-2">
           <Button
            variant="secondary"
            size="sm"
            onClick={expandedIds.size > 0 ? collapseAll : expandAll}
          >
            {expandedIds.size > 0 ? 'Thu gọn hết' : 'Mở rộng hết'}
          </Button>
          <Button
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => handleOpenModal()}
          >
            Thêm danh mục
          </Button>
        </div>
      }
    >
      <Card className="p-3 mb-4">
        <form onSubmit={handleSearch} className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Tìm tên, slug..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[var(--bg-border)] bg-[var(--bg-elevated)]/30">
                <th className="px-4 py-2.5 font-semibold text-[var(--text-secondary)]">Tên danh mục</th>
                <th className="px-4 py-2.5 font-semibold text-[var(--text-secondary)]">Slug</th>
                <th className="px-4 py-2.5 font-semibold text-[var(--text-secondary)]">Danh mục cha</th>
                <th className="px-4 py-2.5 font-semibold text-[var(--text-secondary)] text-center">Thứ tự</th>
                <th className="px-4 py-2.5 font-semibold text-[var(--text-secondary)] text-center">Trạng thái</th>
                <th className="px-4 py-2.5 font-semibold text-[var(--text-secondary)] text-center">Nổi bật</th>
                <th className="px-4 py-2.5 font-semibold text-[var(--text-secondary)] text-center">Hiện Sp Home</th>
                <th className="px-4 py-2.5 font-semibold text-[var(--text-secondary)] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && categories.length === 0 ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-[var(--bg-border)]">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : visibleCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)] italic">
                    Không tìm thấy danh mục nào
                  </td>
                </tr>
              ) : (
                visibleCategories.map((cat) => {
                  const hasChildren = categories.some(child => child.parent_id === cat.id);
                  const isExpanded = expandedIds.has(cat.id);
                  
                  return (
                    <tr 
                      key={cat.id} 
                      className={cn(
                        "border-b border-[var(--bg-border)] last:border-0 hover:bg-[var(--bg-elevated)]/40 transition-all duration-200 relative group",
                        cat.parent_id 
                          ? "bg-[var(--bg-elevated)]/20 animate-in fade-in slide-in-from-top-1 duration-300" 
                          : "bg-white font-medium"
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center" style={{ paddingLeft: `${cat.parent_id ? 24 : 0}px` }}>
                            {hasChildren ? (
                              <button 
                                onClick={() => toggleExpand(cat.id)}
                                className="p-1 hover:bg-[var(--bg-elevated)] rounded transition-colors mr-1"
                              >
                                <ChevronRight className={cn(
                                  "w-4 h-4 transition-transform duration-200",
                                  isExpanded ? "rotate-90 text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
                                )} />
                              </button>
                            ) : (
                              <div className="w-6" />
                            )}
                            
                            {cat.icon_url && (
                              <div className="w-5 h-5 rounded bg-[var(--bg-elevated)] flex items-center justify-center overflow-hidden shrink-0 mr-2 shadow-sm border border-[var(--bg-border)]/50">
                                <img src={cat.icon_url} alt="" className="w-full h-full object-contain" />
                              </div>
                            )}
                            
                            <span className={cn(
                              "text-sm transition-colors duration-200",
                              cat.parent_id ? 'text-[var(--text-secondary)]' : 'font-bold text-[var(--text-primary)]',
                              isExpanded && !cat.parent_id && "text-[var(--accent-primary)]"
                            )}>
                              {cat.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-muted)] font-mono text-[11px]">{cat.slug}</td>
                      <td className="px-4 py-2.5">
                        {cat.parent_id ? (
                          <Badge variant="neutral" size="sm" className="opacity-70">
                            {categories.find(p => p.id === cat.parent_id)?.name}
                          </Badge>
                        ) : (
                          <span className="text-[var(--text-muted)] text-[11px]">Gốc</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm">{cat.display_order}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button onClick={() => handleToggleStatus(cat)} className="hover:scale-105 transition-transform">
                          {cat.is_active ? (
                            <Badge variant="success" size="sm">Bật</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">Tắt</Badge>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {!cat.parent_id && (
                          <button onClick={() => handleToggleFeatured(cat)} className="hover:scale-105 transition-transform">
                            {cat.is_featured ? (
                              <Badge variant="warning" size="sm">★ Nổi bật</Badge>
                            ) : (
                              <Badge variant="neutral" size="sm">Thường</Badge>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {!cat.parent_id && (
                          <div className="flex justify-center">
                             {cat.show_on_home ? (
                                <Badge variant="success" size="sm" className="bg-sky-100 text-sky-700">Hiện Sp</Badge>
                             ) : (
                                <span className="text-[10px] text-text-muted italic">-</span>
                             )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal(cat)}
                            className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => { 
                setPage(p); 
                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              showInfo
            />
          </div>
        )}
      </Card>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Tên danh mục</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Slug (Đường dẫn)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Nếu để trống sẽ tự tạo từ tên"
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Icon danh mục</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[var(--bg-elevated)] border-2 border-dashed border-[var(--bg-border)] flex items-center justify-center overflow-hidden relative group">
                  {formData.icon_url ? (
                    <>
                      <img src={formData.icon_url} alt="" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, icon_url: '' })}
                        className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                      >
                        Xóa
                      </button>
                    </>
                  ) : (
                    <LayoutGrid className="w-6 h-6 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="icon-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const { productsApi } = await import('../api/products');
                        const res = await productsApi.uploadImage(file);
                        setFormData({ ...formData, icon_url: res.data.url });
                        success('Tải ảnh lên thành công');
                      } catch {
                        toastError('Tải ảnh lên thất bại');
                      }
                    }}
                  />
                  <label 
                    htmlFor="icon-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm font-medium cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
                  >
                    Tải ảnh lên
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5 italic">
                    Dùng ảnh vuông (PNG, SVG, JPG) để hiển thị đẹp nhất.
                  </p>
                </div>
              </div>
            </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Danh mục cha</label>
            <select
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
            >
              <option value="">Không có (Danh mục gốc)</option>
              {parentOptions
                .filter(c => c.id !== editingCategory?.id)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))
              }
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {!formData.parent_id && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Thứ tự hiển thị</label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                />
              </div>
            )}
            <div className={formData.parent_id ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium mb-1.5">Trạng thái</label>
              <div className="flex items-center gap-2 h-10">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className="flex items-center gap-2 text-sm"
                >
                  {formData.is_active ? (
                    <>
                      <ToggleRight className="w-6 h-6 text-[var(--accent-primary)]" />
                      <span>Hoạt động</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-6 h-6 text-[var(--text-muted)]" />
                      <span>Tạm ngưng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {!formData.parent_id && (
              <>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Hiển thị nổi bật (Submenu)</label>
                  <div className="flex items-center gap-2 h-10">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                      className="flex items-center gap-2 text-sm"
                    >
                      {formData.is_featured ? (
                        <>
                          <ToggleRight className="w-6 h-6 text-amber-500" />
                          <span className="text-amber-500 font-bold">Đang hiển thị nổi bật</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-6 h-6 text-[var(--text-muted)]" />
                          <span>Không hiển thị</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Hiển thị Sản phẩm trên Trang chủ</label>
                  <div className="flex items-center gap-2 h-10">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, show_on_home: !formData.show_on_home })}
                      className="flex items-center gap-2 text-sm"
                    >
                      {formData.show_on_home ? (
                        <>
                          <ToggleRight className="w-6 h-6 text-sky-500" />
                          <span className="text-sky-500 font-bold">Hiện sản phẩm danh mục này</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-6 h-6 text-[var(--text-muted)]" />
                          <span>Không hiện</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Hủy
            </Button>
            <Button type="submit" loading={submitting}>
              {editingCategory ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Categories;
