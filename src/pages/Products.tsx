import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, ExternalLink, Package, ListPlus, Info } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Pagination } from '../components/ui/Pagination';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import type { Product, Category, ProductStatus, ProductDetail } from '../types';
import { formatCurrency } from '../utils/format';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');

  // Modal state
  const [viewProduct, setViewProduct] = useState<ProductDetail | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchProducts = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: any = { page: p, per_page: 10 };
      if (search) params.search = search;
      if (catFilter) params.category_id = catFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await productsApi.getList(params);
      setProducts(res.data);
      setTotalPages(res.meta.last_page);
      setTotal(res.meta.total);
    } catch (err) {
      toastError('Không thể tải danh sách sản phẩm');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, catFilter, statusFilter, toastError]);

  useEffect(() => {
    fetchProducts(1);
    setPage(1);
  }, [fetchProducts]);

  useEffect(() => {
    categoriesApi.getList().then(res => setCategories(res.data)).catch(() => { });
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await productsApi.remove(id);
      success('Xóa sản phẩm thành công');
      fetchProducts(page, true);
    } catch (err) {
      toastError('Xóa sản phẩm thất bại');
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus: ProductStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await productsApi.update(product.id, { status: newStatus });
      success(`Đã chuyển trạng thái sản phẩm`);
      fetchProducts(page, true);
    } catch (err) {
      toastError('Cập nhật trạng thái thất bại');
    }
  };

  const handleOpenDetail = async (slug: string) => {
    setIsViewing(true);
    setViewLoading(true);
    try {
      const res = await productsApi.getBySlug(slug);
      setViewProduct(res.data);
    } catch (err) {
      toastError('Không thể tải chi tiết sản phẩm');
      setIsViewing(false);
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <PageWrapper
      title="Quản lý Sản phẩm"
      subtitle={`Tổng số ${total} sản phẩm`}
      actions={
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/products/create')}
        >
          Thêm sản phẩm
        </Button>
      }
    >
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm tên sản phẩm, SKU, hoạt chất..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] min-w-[180px]"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => {
              const parent = categories.find(p => p.id === c.parent_id);
              return (
                <option key={c.id} value={c.id}>
                  {parent ? `${parent.name} › ${c.name}` : c.name}
                </option>
              );
            })}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProductStatus)}
            className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] min-w-[150px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Tạm ngưng</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>

          {(search || catFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setCatFilter(''); setStatusFilter(''); }}
              className="text-sm text-[var(--accent-primary)] hover:underline"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </Card>

      {/* Product Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[var(--bg-border)] bg-[var(--bg-elevated)]/50">
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Sản phẩm</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Danh mục</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Giá bán</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && products.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-[var(--bg-border)]">
                    <td className="px-6 py-4"><Skeleton className="h-12 w-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)] italic">
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-[var(--bg-border)] hover:bg-[var(--bg-elevated)]/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] flex items-center justify-center overflow-hidden shrink-0">
                          {product.primary_image ? (
                            <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-[var(--text-muted)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[var(--text-primary)] line-clamp-2 whitespace-normal" title={product.name}>{product.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {product.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {formatCurrency(product.sale_price ?? product.base_price)}
                      </div>
                      {product.sale_price && (
                        <div className="text-[10px] text-[var(--text-muted)] line-through">
                          {formatCurrency(product.base_price)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        title="Click để đổi trạng thái"
                      >
                        {product.status === 'active' ? (
                          <Badge variant="success">Đang bán</Badge>
                        ) : product.status === 'inactive' ? (
                          <Badge variant="neutral">Tạm ngưng</Badge>
                        ) : product.status === 'out_of_stock' ? (
                          <Badge variant="warning">Hết hàng</Badge>
                        ) : (
                          <Badge variant="error">Ngừng kinh doanh</Badge>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetail(product.slug)}
                          className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                          title="Xem nhanh"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/products/${product.slug}/edit`)}
                          className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(`http://localhost:5173/products/${product.slug}`, '_blank')}
                          className="p-2 rounded-lg hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] transition-colors"
                          title="Xem trên shop"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                fetchProducts(p, true);
                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              showInfo
            />
          </div>
        )}
      </Card>

      {/* Product Detail Modal */}
      <Modal
        open={isViewing}
        onClose={() => setIsViewing(false)}
        title={viewLoading ? 'Đang tải...' : viewProduct?.name || 'Chi tiết sản phẩm'}
        size="xl"
      >
        {viewLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : viewProduct ? (
          <div className="space-y-6">
            {/* Images Gallery */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {viewProduct.images.length > 0 ? (
                viewProduct.images.map((img, i) => (
                  <div key={i} className="w-48 h-48 rounded-xl border border-[var(--bg-border)] overflow-hidden shrink-0 bg-[var(--bg-elevated)]">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="w-full h-48 rounded-xl border-2 border-dashed border-[var(--bg-border)] flex items-center justify-center text-[var(--text-muted)]">
                  Chưa có hình ảnh
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--bg-border)]">
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Mã SKU</div>
                <div className="font-mono font-medium">{viewProduct.sku}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Danh mục</div>
                <div className="font-medium text-[var(--accent-primary)]">{viewProduct.category.name}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Giá gốc</div>
                <div className="font-bold text-lg">{formatCurrency(viewProduct.base_price)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Giá khuyến mãi</div>
                <div className="font-bold text-lg text-red-500">
                  {viewProduct.sale_price ? formatCurrency(viewProduct.sale_price) : '—'}
                </div>
              </div>
            </div>

            {/* Usage */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-[var(--accent-primary)]" /> Công dụng
              </h4>
              <div
                className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-elevated)]/30 p-4 rounded-xl border border-[var(--bg-border)] prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: (viewProduct as any).usage || '<p class="italic text-muted">Chưa có thông tin</p>' }}
              />
            </div>

            {/* Notes */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-500" /> Lưu ý
              </h4>
              <div
                className="text-sm text-[var(--text-secondary)] leading-relaxed bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: (viewProduct as any).notes || '<p class="italic text-muted">Chưa có lưu ý</p>' }}
              />
            </div>

            {/* Technical Specs */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-[var(--accent-primary)]" /> Thông số sản phẩm
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)]/30 border border-[var(--bg-border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">Phân loại</div>
                  <div className="text-sm font-medium">{viewProduct.unit}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)]/30 border border-[var(--bg-border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">Dạng bào chế</div>
                  <div className="text-sm font-medium">{viewProduct.dosage_form || '—'}</div>
                </div>
                {viewProduct.attributes.map((attr, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[var(--bg-elevated)]/30 border border-[var(--bg-border)]">
                    <div className="text-xs text-[var(--text-muted)] mb-0.5">{attr.key}</div>
                    <div className="text-sm font-medium">{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </PageWrapper>
  );
};

export default Products;
