import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, Globe, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { brandsApi } from '../api/brands';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import type { Brand } from '../types';

const Brands: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    country_of_origin: '',
    logo_url: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchBrands = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await brandsApi.getList();
      setBrands(res.data);
    } catch (err) {
      toastError('Không thể tải danh sách thương hiệu');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleOpenModal = (brand: Brand | null = null) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        country_of_origin: brand.country_of_origin || '',
        logo_url: brand.logo_url || '',
        is_active: brand.is_active,
      });
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        country_of_origin: '',
        logo_url: '',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBrand) {
        await brandsApi.update(editingBrand.id, formData);
        success('Cập nhật thương hiệu thành công');
      } else {
        await brandsApi.create(formData);
        success('Tạo thương hiệu thành công');
      }
      setIsModalOpen(false);
      fetchBrands(true);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) return;
    try {
      await brandsApi.remove(id);
      success('Xóa thương hiệu thành công');
      fetchBrands(true);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Xóa thương hiệu thất bại');
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    try {
      await brandsApi.update(brand.id, { is_active: !brand.is_active });
      success('Đã cập nhật trạng thái');
      fetchBrands(true);
    } catch (err) {
      toastError('Cập nhật trạng thái thất bại');
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.country_of_origin?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper
      title="Quản lý Thương hiệu"
      subtitle={`Tổng số ${brands.length} thương hiệu`}
      actions={
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => handleOpenModal()}
        >
          Thêm thương hiệu
        </Button>
      }
    >
      <Card className="p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Tìm tên thương hiệu, quốc gia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </Card>
          ))
        ) : filteredBrands.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[var(--text-muted)] italic">
            Không tìm thấy thương hiệu nào
          </div>
        ) : (
          filteredBrands.map((brand) => (
            <Card key={brand.id} className="p-6 hover:shadow-lg transition-shadow border-t-4 border-t-[var(--accent-primary)]/20">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 rounded-xl bg-[var(--bg-elevated)] border border-[var(--bg-border)] flex items-center justify-center overflow-hidden">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Shield className="w-8 h-8 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(brand)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg text-[var(--text-primary)]">{brand.name}</h3>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Globe className="w-4 h-4" />
                  {brand.country_of_origin || 'Chưa cập nhật quốc gia'}
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <button onClick={() => handleToggleStatus(brand)}>
                    {brand.is_active ? (
                      <Badge variant="success">Hoạt động</Badge>
                    ) : (
                      <Badge variant="neutral">Tạm ngưng</Badge>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBrand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Tên thương hiệu</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Quốc gia</label>
            <input
              type="text"
              value={formData.country_of_origin}
              onChange={(e) => setFormData({ ...formData, country_of_origin: e.target.value })}
              placeholder="VD: Việt Nam, Mỹ, Pháp..."
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Logo thương hiệu</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-[var(--bg-elevated)] border-2 border-dashed border-[var(--bg-border)] flex items-center justify-center overflow-hidden relative group">
                {formData.logo_url ? (
                  <>
                    <img src={formData.logo_url} alt="" className="w-full h-full object-contain p-2" />
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, logo_url: '' })}
                      className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                    >
                      Xóa
                    </button>
                  </>
                ) : (
                  <Shield className="w-6 h-6 text-[var(--text-muted)]" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const { productsApi } = await import('../api/products');
                      const res = await productsApi.uploadImage(file);
                      setFormData({ ...formData, logo_url: res.data.url });
                      success('Tải logo lên thành công');
                    } catch {
                      toastError('Tải logo lên thất bại');
                    }
                  }}
                />
                <label 
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm font-medium cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
                >
                  Tải logo lên
                </label>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5 italic">
                  Khuyên dùng ảnh PNG trong suốt hoặc SVG.
                </p>
              </div>
            </div>
          </div>

          <div>
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
                    <span className="font-medium text-[var(--text-primary)]">Hoạt động</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-6 h-6 text-[var(--text-muted)]" />
                    <span className="font-medium text-[var(--text-secondary)]">Tạm ngưng</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Hủy
            </Button>
            <Button type="submit" loading={submitting}>
              {editingBrand ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Brands;
