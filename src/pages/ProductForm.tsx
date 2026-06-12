import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, Image as ImageIcon, ListPlus, ChevronLeft, Save, Plus, Trash2, GripVertical, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import { brandsApi } from '../api/brands';
import { cn } from '../utils/cn';
import type { Category, Brand, ProductStatus } from '../types';

interface ProductFormData {
  name: string;
  slug?: string;
  sku: string;
  category_id: string;
  brand_id: string;
  base_price: string;
  sale_price: string;
  unit: string;
  dosage_form?: string;
  active_ingredient?: string;
  manufacturer?: string;
  status: ProductStatus;
  requires_prescription: boolean;
  usage: string;
  notes: string;
  images: Array<{ tempId: string; url: string; is_primary: boolean; sort_order: number }>;
  attributes: Array<{ attr_key: string; attr_value: string }>;
}

const ProductForm: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productId, setProductId] = useState<string | null>(null);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    sku: '',
    category_id: '',
    brand_id: '',
    base_price: '',
    sale_price: '',
    unit: 'Hộp',
    dosage_form: '',
    active_ingredient: '',
    manufacturer: '',
    status: 'active',
    requires_prescription: false,
    usage: '',
    notes: '',
    images: [{ tempId: Math.random().toString(36).substr(2, 9), url: '', is_primary: true, sort_order: 0 }],
    attributes: [],
  });

  const isLoaded = useRef(false);

  useEffect(() => {
    const loadInitialData = async () => {
      if (isLoaded.current) return;
      isLoaded.current = true;
      setLoading(true);
      try {
        const [cats, brs] = await Promise.all([
          categoriesApi.getList(),
          brandsApi.getList()
        ]);
        setCategories(cats.data);
        setBrands(brs.data);

        if (slug) {
          const res = await productsApi.getBySlug(slug);
          const p = res.data;
          setProductId(p.id);
          setFormData({
            name: p.name,
            slug: p.slug,
            sku: p.sku,
            category_id: p.category?.id || '',
            brand_id: (p as any).brand?.id || '',
            base_price: String(p.base_price),
            sale_price: p.sale_price ? String(p.sale_price) : '',
            unit: p.unit,
            dosage_form: p.dosage_form || '',
            active_ingredient: p.active_ingredient || '',
            manufacturer: (p as any).manufacturer || '',
            status: p.status,
            requires_prescription: p.requires_prescription,
            usage: (p as any).usage || '',
            notes: (p as any).notes || '',
            images: p.images && p.images.length > 0
              ? p.images.sort((a, b) => a.sort_order - b.sort_order).map(img => ({ ...img, tempId: Math.random().toString(36).substr(2, 9) }))
              : [{ tempId: Math.random().toString(36).substr(2, 9), url: '', is_primary: true, sort_order: 0 }],
            attributes: (p as any).attributes ? (p as any).attributes.map((a: any) => ({
              attr_key: a.key,
              attr_value: a.value
            })) : [],
          });
        }
      } catch (err) {
        toastError('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [slug]);

  useEffect(() => {
    console.log('Current images state:', formData.images);
  }, [formData.images]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        images: formData.images
          .filter(img => img.url && typeof img.url === 'string' && img.url.trim() !== '')
          .map(img => ({
            url: img.url,
            is_primary: img.is_primary,
            sort_order: img.sort_order
          })),
        attributes: formData.attributes
          .filter(attr => attr.attr_key && attr.attr_key.trim() !== '')
          .map(attr => ({
            attr_key: attr.attr_key,
            attr_value: attr.attr_value
          })),
      };

      if (productId) {
        await productsApi.update(productId, payload);
        success('Cập nhật sản phẩm thành công');
      } else {
        const res = await productsApi.create(payload);
        success('Thêm sản phẩm mới thành công');
        if (res.data?.slug) {
          navigate(`/products/${res.data.slug}/edit`, { replace: true });
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lưu sản phẩm thất bại';
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Image helpers

  const removeImageField = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some(img => img.is_primary)) {
        newImages[0].is_primary = true;
      }
      return { ...prev, images: newImages };
    });
  };
  const updateImage = (index: number, url: string) => {
    setFormData(prev => {
      const nextImages = [...prev.images];
      nextImages[index] = { ...nextImages[index], url };
      return { ...prev, images: nextImages };
    });
  };
  const setPrimaryImage = (index: number) => {
    setFormData(prev => {
      const selectedImg = prev.images[index];
      const otherImages = prev.images.filter((_, i) => i !== index);

      // Move primary to start and re-index
      const newImages = [
        { ...selectedImg, is_primary: true, sort_order: 0 },
        ...otherImages.map((img, i) => ({ ...img, is_primary: false, sort_order: i + 1 }))
      ];

      return { ...prev, images: newImages };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    console.log('Starting upload for files:', fileList.map(f => f.name));

    if (index !== undefined) {
      // Replace existing row
      const file = fileList[0];
      if (file.size > 5 * 1024 * 1024) {
        toastError(`Ảnh ${file.name} vượt quá 5MB`);
        return;
      }
      try {
        setIsUploading(true);
        console.log('Uploading single image...', file.name);
        const res = await productsApi.uploadImage(file);
        console.log('Upload success, URL:', res.data.url);
        updateImage(index, res.data.url);
        success('Đã tải ảnh mới');
      } catch (err: any) {
        console.error('Upload failed:', err);
        toastError(`Tải ảnh thất bại`);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Bulk upload
      const filesToUpload = fileList;
      setIsUploading(true);
      console.log('Starting bulk upload for', filesToUpload.length, 'files');

      for (const file of filesToUpload) {
        if (file.size > 5 * 1024 * 1024) {
          toastError(`Ảnh ${file.name} vượt quá 5MB - Bỏ qua`);
          continue;
        }

        try {
          console.log('Uploading...', file.name);
          const res = await productsApi.uploadImage(file);
          const url = res.data.url;
          console.log('Success:', file.name, '->', url);

          setFormData(prev => {
            const newImg = {
              tempId: Math.random().toString(36).substr(2, 9),
              url,
              is_primary: prev.images.every(i => !i.url),
              sort_order: prev.images.filter(i => i.url).length
            };

            // Tìm xem có ô trống nào không để thay thế, nếu không thì thêm mới
            const emptyIdx = prev.images.findIndex(i => !i.url);
            let nextImages = [...prev.images];

            if (emptyIdx !== -1) {
              nextImages[emptyIdx] = newImg;
            } else {
              if (nextImages.length >= 6) {
                toastError('Đã đạt giới hạn 6 ảnh');
                return prev;
              }
              nextImages.push(newImg);
            }

            return { ...prev, images: nextImages };
          });
        } catch (err: any) {
          console.error('Bulk upload failed for:', file.name, err);
          const errorMsg = err.response?.data?.message || err.message || 'Lỗi không xác định';
          toastError(`Lỗi: ${file.name} - ${errorMsg}`);
        }
      }
      setIsUploading(false);
      success('Đã tải lên các ảnh được chọn');
    }
    e.target.value = '';
  };

  // Attribute helpers
  const addAttributeField = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { attr_key: '', attr_value: '' }]
    }));
  };
  const removeAttributeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };
  const updateAttribute = (index: number, key: string, value: string) => {
    setFormData(prev => {
      const newAttrs = [...prev.attributes];
      newAttrs[index] = { attr_key: key, attr_value: value };
      return { ...prev, attributes: newAttrs };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = formData.images.findIndex((img) => img.tempId === active.id);
      const newIndex = formData.images.findIndex((img) => img.tempId === over.id);

      const newImages = arrayMove(formData.images, oldIndex, newIndex).map((img, idx) => ({
        ...img,
        is_primary: idx === 0,
        sort_order: idx
      }));

      setFormData({ ...formData, images: newImages });
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Đang tải...">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={productId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
      subtitle={productId ? `Đang chỉnh sửa: ${formData.name}` : 'Điền đầy đủ thông tin để tạo sản phẩm mới'}
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => navigate('/products')}>
            Quay lại
          </Button>
          {productId && (
            <Button
              variant="secondary"
              icon={<ExternalLink className="w-4 h-4" />}
              onClick={() => window.open(`http://localhost:5173/products/${formData.slug}`, '_blank')}
            >
              Xem trên Shop
            </Button>
          )}
          <Button
            icon={<Save className="w-4 h-4" />}
            loading={saving}
            disabled={isUploading}
            onClick={handleSave}
          >
            {isUploading ? 'Đang tải ảnh...' : 'Lưu thay đổi'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Thông tin chính */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[var(--accent-primary)]" /> Thông tin cơ bản
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tên sản phẩm"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Paracetamol 500mg"
                  />
                  <Input
                    label="Slug (Đường dẫn)"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="vd: paracetamol-500mg"
                    title="Nếu để trống, slug sẽ tự tạo từ tên"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Mã SKU"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="PARA-500"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Phân loại sản phẩm *</label>
                    <input
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] transition-all"
                      placeholder="Hộp, Vỉ, Viên..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Danh mục *</label>
                    <select
                      required
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] transition-all"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(c => {
                        const parent = categories.find(p => p.id === c.parent_id);
                        return (
                          <option key={c.id} value={c.id}>
                            {parent ? `${parent.name} › ${c.name}` : c.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Hoạt chất chính"
                    value={formData.active_ingredient}
                    onChange={(e) => setFormData({ ...formData, active_ingredient: e.target.value })}
                    placeholder="VD: Paracetamol 500mg"
                  />
                  <Input
                    label="Dạng bào chế"
                    value={formData.dosage_form}
                    onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                    placeholder="VD: Viên nén, Siro..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nhà sản xuất"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="VD: Sanofi, DHG Pharma..."
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Thương hiệu</label>
                    <select
                      value={formData.brand_id}
                      onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] transition-all"
                    >
                      <option value="">Chọn thương hiệu</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 min-h-[300px]">
                  <label className="text-sm font-medium">Công dụng</label>
                  <div className="flex-1 bg-[var(--bg-elevated)] rounded-xl overflow-hidden border border-[var(--bg-border)]">
                    <ReactQuill
                      theme="snow"
                      modules={quillModules}
                      value={formData.usage}
                      onChange={(content) => setFormData(prev => ({ ...prev, usage: content }))}
                      placeholder="Mô tả chi tiết về công dụng, hướng dẫn sử dụng..."
                      className="h-[250px] border-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 min-h-[300px]">
                  <label className="text-sm font-medium">Lưu ý</label>
                  <div className="flex-1 bg-[var(--bg-elevated)] rounded-xl overflow-hidden border border-[var(--bg-border)]">
                    <ReactQuill
                      theme="snow"
                      modules={quillModules}
                      value={formData.notes}
                      onChange={(content) => setFormData(prev => ({ ...prev, notes: content }))}
                      placeholder="Các lưu ý khi sử dụng, tác dụng phụ, chống chỉ định..."
                      className="h-[250px] border-none"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ListPlus className="w-5 h-5 text-[var(--accent-primary)]" /> Thông số & Thuộc tính
                </h3>
                <Button type="button" variant="secondary" size="sm" className="whitespace-nowrap" icon={<Plus className="w-3.5 h-3.5" />} onClick={addAttributeField}>
                  Thêm thuộc tính
                </Button>
              </div>
              <div className="space-y-3">
                {formData.attributes.map((attr, idx) => (
                  <div key={idx} className="space-y-2 p-4 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--bg-border)] animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        value={attr.attr_key}
                        onChange={(e) => updateAttribute(idx, e.target.value, attr.attr_value)}
                        className="flex-1 min-w-0 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl text-sm font-bold outline-none focus:border-[var(--accent-primary)] transition-all"
                        placeholder="Tên thông số (VD: Thành phần chi tiết)"
                      />
                      <button type="button" onClick={() => removeAttributeField(idx)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="bg-[var(--bg-surface)] rounded-xl overflow-hidden border border-[var(--bg-border)]">
                      <ReactQuill
                        theme="snow"
                        value={attr.attr_value}
                        onChange={(content) => updateAttribute(idx, attr.attr_key, content)}
                        placeholder="Giá trị thông số..."
                        className="bg-transparent"
                        modules={{
                          toolbar: [
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['clean']
                          ]
                        }}
                      />
                    </div>
                  </div>
                ))}
                {formData.attributes.length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-[var(--bg-border)] rounded-2xl text-[var(--text-muted)] text-sm">
                    Chưa có thuộc tính bổ sung. Nhấn "Thêm thuộc tính" để bắt đầu.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Cột phải: Giá, Trạng thái & Ảnh */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-500">
                <span className="text-xl">₫</span> Giá & Trạng thái
              </h3>
              <div className="space-y-4">
                <Input
                  label="Giá gốc"
                  type="number"
                  required
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                />
                <Input
                  label="Giá khuyến mãi"
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Trạng thái bán</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                    className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] transition-all"
                  >
                    <option value="active">Đang kinh doanh</option>
                    <option value="inactive">Tạm dừng bán</option>
                    <option value="out_of_stock">Hết hàng</option>
                    <option value="discontinued">Ngừng kinh doanh</option>
                  </select>
                </div>
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                  formData.requires_prescription
                    ? "bg-red-500/5 border-red-500/20"
                    : "bg-gray-500/5 border-[var(--bg-border)]"
                )} onClick={() => setFormData({ ...formData, requires_prescription: !formData.requires_prescription })}>
                  {formData.requires_prescription ? (
                    <ToggleRight className="w-6 h-6 text-red-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-[var(--text-muted)]" />
                  )}
                  <div className="flex-1">
                    <div className={cn(
                      "text-sm font-bold",
                      formData.requires_prescription ? "text-red-600" : "text-[var(--text-primary)]"
                    )}>
                      Sản phẩm kê đơn (ETC)
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      Yêu cầu khách hàng phải có đơn thuốc của bác sĩ.
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[var(--accent-primary)]" /> Hình ảnh
                </h3>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="bulk-upload"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e)}
                    disabled={formData.images.length >= 6}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => document.getElementById('bulk-upload')?.click()}
                    disabled={formData.images.length >= 6}
                  >
                    Tải lên ({formData.images.length}/6)
                  </Button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={formData.images.map(img => img.tempId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {formData.images.map((img, idx) => (
                      <SortableImageItem
                        key={img.tempId}
                        img={img}
                        idx={idx}
                        updateImage={updateImage}
                        setPrimaryImage={setPrimaryImage}
                        handleFileUpload={handleFileUpload}
                        removeImageField={removeImageField}
                        setFormData={setFormData}
                        allImages={formData.images}
                      />
                    ))}
                    {formData.images.length === 0 && (
                      <div className="py-8 text-center border-2 border-dashed border-[var(--bg-border)] rounded-2xl text-[var(--text-muted)] text-sm">
                        Chưa có hình ảnh. Nhấn "Tải lên" để bắt đầu.
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </Card>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
};

export default ProductForm;

const SortableImageItem = ({
  img,
  idx,
  updateImage,
  setPrimaryImage,
  handleFileUpload,
  removeImageField
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: img.tempId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group p-2 bg-[var(--bg-elevated)] rounded-xl border border-[var(--bg-border)] transition-all relative flex items-center gap-3",
        isDragging && "shadow-xl border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] flex-shrink-0"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="w-16 h-16 rounded-lg overflow-hidden border border-[var(--bg-border)] bg-white flex-shrink-0 relative group/img">
        {img.url ? (
          <img
            src={img.url}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='11' fill='%2394a3b8' font-family='sans-serif'%3EKhông tải được%3C/text%3E%3C/svg%3E")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
            <ImageIcon className="w-6 h-6 opacity-20" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            value={img.url}
            onChange={(e) => updateImage(idx, e.target.value)}
            className="flex-1 min-w-0 px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg text-[11px] outline-none focus:border-[var(--accent-primary)]"
            placeholder="URL ảnh hoặc tải lên..."
          />
          <button type="button" onClick={() => removeImageField(idx)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setPrimaryImage(idx)}
              className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-md transition-all whitespace-nowrap",
                img.is_primary
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "bg-[var(--bg-surface)] border border-[var(--bg-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {img.is_primary ? "ẢNH CHÍNH" : "ĐẶT LÀM CHÍNH"}
            </button>
            <span className="text-[10px] bg-[var(--bg-surface)] border border-[var(--bg-border)] text-[var(--text-muted)] px-2 py-1 rounded-md whitespace-nowrap">
              Vị trí: {idx}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              id={`upload-${img.tempId}`}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, idx)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 text-[10px] px-2.5 whitespace-nowrap"
              onClick={() => document.getElementById(`upload-${img.tempId}`)?.click()}
              icon={<ImageIcon className="w-3 h-3" />}
            >
              {img.url ? 'Thay thế' : 'Tải ảnh'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
