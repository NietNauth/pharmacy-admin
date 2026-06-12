import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Link as LinkIcon, Save, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { slidesApi } from '../api/slides';
import type { Slide } from '../api/slides';

// --- Sortable Item Component ---
interface SortableSlideItemProps {
  slide: Slide;
  onEdit: (slide: Slide) => void;
  onToggleActive: (slide: Slide) => void;
  onDelete: (id: number) => void;
}

const SortableSlideItem: React.FC<SortableSlideItemProps> = ({ slide, onEdit, onToggleActive, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group overflow-hidden">
      <Card className="overflow-hidden border-2 border-transparent hover:border-[var(--accent-primary)]/20 transition-all">
        <div className="flex flex-col md:flex-row gap-6 p-4">
          {/* Drag Handle */}
          <div 
            {...attributes} 
            {...listeners} 
            className="flex items-center justify-center px-1 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <GripVertical className="w-6 h-6" />
          </div>

          <div className="w-full md:w-64 h-32 rounded-xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--bg-border)] shrink-0">
            <img src={slide.image_url} alt={slide.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          
          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-[var(--text-primary)]">
                  {slide.title || <span className="italic text-[var(--text-muted)] font-normal">Không có tiêu đề</span>}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant={slide.is_active ? 'success' : 'neutral'}>
                    {slide.is_active ? 'Đang hiển thị' : 'Đang ẩn'}
                  </Badge>
                </div>
              </div>
              
              {slide.link && (
                <div className="flex items-center gap-2 text-sm text-[var(--accent-primary)] mb-4">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span className="truncate max-w-md">{slide.link}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => onEdit(slide)}
              >
                Sửa
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={slide.is_active ? 'text-amber-500 border-amber-500/20 hover:bg-amber-500/10' : 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'}
                onClick={() => onToggleActive(slide)}
              >
                {slide.is_active ? 'Ẩn slide' : 'Hiện slide'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 border-red-500/20 hover:bg-red-500/10 ml-auto"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => onDelete(slide.id)}
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- Main Component ---
const Slides: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    image_url: '',
    title: '',
    description: '',
    link: '',
    is_active: true
  });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await slidesApi.getList();
      setSlides(res.data);
    } catch (err) {
      toastError('Không thể tải danh sách slide');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);

      const newSlides = arrayMove(slides, oldIndex, newIndex);
      setSlides(newSlides);

      try {
        await slidesApi.updateOrder(newSlides.map(s => s.id));
        success('Đã cập nhật thứ tự slide');
      } catch (err) {
        toastError('Lỗi khi cập nhật thứ tự');
        fetchSlides(); // Revert on error
      }
    }
  };

  const handleOpenModal = (slide?: Slide) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData({
        image_url: slide.image_url,
        title: slide.title || '',
        description: slide.description || '',
        link: slide.link || '',
        is_active: slide.is_active
      });
    } else {
      setEditingSlide(null);
      setFormData({
        image_url: '',
        title: '',
        description: '',
        link: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSlide(null);
    setFormData({
      image_url: '',
      title: '',
      description: '',
      link: '',
      is_active: true
    });
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await slidesApi.uploadImage(file);
      setFormData(prev => ({ ...prev, image_url: res.data.url }));
      success('Tải ảnh lên thành công');
    } catch (err) {
      toastError('Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toastError('Vui lòng chọn ảnh cho slide');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSlide) {
        await slidesApi.update(editingSlide.id, formData);
        success('Cập nhật slide thành công');
      } else {
        // For new slide, we can just let backend handle order (or add at end)
        await slidesApi.create({ ...formData, order: slides.length });
        success('Thêm slide thành công');
      }
      fetchSlides();
      handleCloseModal();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Lỗi khi lưu slide');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa slide này?')) return;
    try {
      await slidesApi.remove(id);
      success('Xóa slide thành công');
      fetchSlides();
    } catch (err) {
      toastError('Xóa slide thất bại');
    }
  };

  const handleToggleActive = async (slide: Slide) => {
    try {
      await slidesApi.update(slide.id, { is_active: !slide.is_active });
      success('Đã cập nhật trạng thái slide');
      fetchSlides();
    } catch (err) {
      toastError('Cập nhật trạng thái thất bại');
    }
  };

  return (
    <PageWrapper
      title="Quản lý Slide"
      subtitle="Kéo thả để sắp xếp thứ tự hiển thị trên trang chủ"
      actions={
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => handleOpenModal()}
        >
          Thêm Slide
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 flex gap-6 items-center">
              <Skeleton className="w-64 h-32 rounded-xl shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </Card>
          ))
        ) : slides.length === 0 ? (
          <Card className="p-12 text-center">
            <ImageIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-20" />
            <p className="text-[var(--text-secondary)] italic">Chưa có slide nào</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => handleOpenModal()}
            >
              Thêm slide đầu tiên
            </Button>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slides.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {slides.map((slide) => (
                <SortableSlideItem 
                  key={slide.id} 
                  slide={slide} 
                  onEdit={handleOpenModal}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingSlide ? 'Cập nhật Slide' : 'Thêm Slide mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Preview & Upload */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Hình ảnh Slide</label>
            <div className="relative group">
              <div className="w-full h-48 rounded-2xl border-2 border-dashed border-[var(--bg-border)] overflow-hidden bg-[var(--bg-elevated)] flex items-center justify-center">
                {formData.image_url ? (
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-xs text-[var(--text-muted)]">Kích thước khuyên dùng: 1920x1080px</p>
                  </div>
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-[var(--bg-surface)]/80 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Đang tải lên...</span>
                    </div>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                id="slide-image"
                className="hidden"
                accept="image/*"
                onChange={handleUploadImage}
                disabled={uploading}
              />
              <label
                htmlFor="slide-image"
                className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
              >
                <div className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {formData.image_url ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Tiêu đề (không bắt buộc)</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tiêu đề slide..."
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Mô tả ngắn (dưới tiêu đề)</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Nhập mô tả slide..."
                rows={2}
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Liên kết khi click</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={formData.link}
                  onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] bg-[var(--bg-border)]"
                  style={{ backgroundColor: formData.is_active ? 'var(--accent-primary)' : 'var(--bg-border)' }}
                  onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">Hiển thị slide này</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--bg-border)]">
            <Button variant="outline" type="button" onClick={handleCloseModal}>Huỷ</Button>
            <Button
              type="submit"
              loading={submitting}
              icon={<Save className="w-4 h-4" />}
            >
              {editingSlide ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Slides;
