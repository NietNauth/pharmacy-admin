import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, Phone, ToggleLeft, ToggleRight, Building2, Map as MapIcon, Loader2 } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { branchesApi } from '../api/branches';
import { locationApi, type Province, type District } from '../api/location';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import type { Branch } from '../types';

const Branches: React.FC = () => {
  const { success, error: toastError, toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    district: '',
    city: '',
    phone: '',
    lat: '',
    lng: '',
    is_active: true,
  });
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const fetchBranches = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await branchesApi.getList();
      setBranches(res.data as Branch[]);
    } catch (err) {
      toastError('Không thể tải danh sách chi nhánh');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchBranches();
    locationApi.getProvinces().then(setProvinces).catch(() => { });
  }, [fetchBranches]);

  const handleProvinceChange = async (code: number) => {
    setSelectedProvinceCode(code);
    const province = provinces.find(p => p.code === code);
    if (province) {
      setFormData(prev => ({ ...prev, city: province.name, district: '' }));
      setFetchingDistricts(true);
      try {
        const ds = await locationApi.getDistricts(code);
        setDistricts(ds);
      } catch {
        toastError('Không thể tải danh sách quận/huyện');
      } finally {
        setFetchingDistricts(false);
      }
    }
  };

  const handleGeocode = async () => {
    if (!formData.address || !formData.city) {
      toast('Vui lòng nhập địa chỉ và chọn thành phố để lấy tọa độ');
      return;
    }

    setGeocoding(true);
    try {
      const fullAddress = `${formData.address}${formData.district ? `, ${formData.district}` : ''}, ${formData.city}, Vietnam`;
      const coords = await locationApi.geocode(fullAddress);
      if (coords) {
        setFormData(prev => ({ ...prev, lat: coords.lat.toString(), lng: coords.lng.toString() }));
        success('Đã tự động lấy tọa độ thành công');
      } else {
        toastError('Không tìm thấy tọa độ cho địa chỉ này. Vui lòng kiểm tra lại hoặc nhập thủ công.');
      }
    } catch {
      toastError('Lỗi khi lấy tọa độ');
    } finally {
      setGeocoding(false);
    }
  };

  const handleOpenModal = (branch: Branch | null = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        address: branch.address,
        district: branch.district || '',
        city: branch.city,
        phone: branch.phone || '',
        lat: branch.lat?.toString() || '',
        lng: branch.lng?.toString() || '',
        is_active: branch.is_active,
      });

      // Try to find province code to load districts
      const p = provinces.find(prov => prov.name === branch.city);
      if (p) {
        setSelectedProvinceCode(p.code);
        locationApi.getDistricts(p.code).then(setDistricts).catch(() => { });
      }
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        address: '',
        district: '',
        city: '',
        phone: '',
        lat: '',
        lng: '',
        is_active: true,
      });
      setSelectedProvinceCode(null);
      setDistricts([]);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
      };

      if (editingBranch) {
        await branchesApi.update(editingBranch.id, payload);
        success('Cập nhật chi nhánh thành công');
      } else {
        await branchesApi.create(payload);
        success('Tạo chi nhánh thành công');
      }
      setIsModalOpen(false);
      fetchBranches(true);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chi nhánh này?')) return;
    try {
      await branchesApi.remove(id);
      success('Xóa chi nhánh thành công');
      fetchBranches(true);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Xóa chi nhánh thất bại');
    }
  };

  const handleToggleStatus = async (branch: Branch) => {
    try {
      await branchesApi.update(branch.id, { is_active: !branch.is_active });
      success('Đã cập nhật trạng thái');
      fetchBranches(true);
    } catch (err) {
      toastError('Cập nhật trạng thái thất bại');
    }
  };

  const filteredBranches = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase()) ||
    b.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper
      title="Quản lý Chi nhánh"
      subtitle={`Tổng số ${branches.length} chi nhánh`}
      actions={
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => handleOpenModal()}
        >
          Thêm chi nhánh
        </Button>
      }
    >
      <Card className="p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Tìm theo tên, địa chỉ, thành phố..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[var(--bg-border)]">
                <Skeleton className="h-6 w-20 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </Card>
          ))
        ) : filteredBranches.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[var(--text-muted)] italic">
            Không tìm thấy chi nhánh nào
          </div>
        ) : (
          filteredBranches.map((branch) => (
            <Card key={branch.id} className="p-6 hover:shadow-lg transition-all group border-l-4 border-l-transparent hover:border-l-[var(--accent-primary)] flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <button onClick={() => handleToggleStatus(branch)} className="transition-opacity">
                  {branch.is_active ? (
                    <Badge variant="success">Đang hoạt động</Badge>
                  ) : (
                    <Badge variant="neutral">Tạm ngưng</Badge>
                  )}
                </button>
              </div>

              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2 h-14">
                {branch.name}
              </h3>

              <div className="space-y-2.5 mb-6 flex-1">
                <div className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)] min-h-[40px]">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--text-muted)]" />
                  <span className="line-clamp-2">{branch.address}, {branch.district}, {branch.city}</span>
                </div>
                {branch.phone && (
                  <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                    <Phone className="w-4 h-4 flex-shrink-0 text-[var(--text-muted)]" />
                    <span>{branch.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-[var(--bg-border)] mt-auto">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  ID: {branch.id.substring(0, 8)}...
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(branch)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
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
        title={editingBranch ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Hủy
            </Button>
            <Button type="submit" form="branch-form" loading={submitting}>
              {editingBranch ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        }
      >
        <form id="branch-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Tên chi nhánh</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="Nhà thuốc Pharmacy #1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Địa chỉ cụ thể</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="flex-1 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                  placeholder="Số nhà, tên đường..."
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGeocode}
                  loading={geocoding}
                  icon={!geocoding && <MapIcon className="w-4 h-4" />}
                  title="Tự động lấy tọa độ"
                >
                  {geocoding ? 'Đang lấy...' : 'Lấy tọa độ'}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Tỉnh/Thành phố</label>
              <select
                required
                value={selectedProvinceCode || ''}
                onChange={(e) => handleProvinceChange(Number(e.target.value))}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
              >
                <option value="">Chọn tỉnh/thành phố</option>
                {provinces.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Quận/Huyện</label>
              <div className="relative">
                <select
                  required
                  value={formData.district}
                  disabled={!selectedProvinceCode || fetchingDistricts}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors disabled:opacity-50 appearance-none"
                >
                  <option value="">{fetchingDistricts ? 'Đang tải...' : 'Chọn quận/huyện'}</option>
                  {districts.map(d => (
                    <option key={d.code} value={d.name}>{d.name}</option>
                  ))}
                </select>
                {fetchingDistricts && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--accent-primary)]" />}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Số điện thoại</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="0123 456 789"
              />
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
                      <span>Đang hoạt động</span>
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

            <div>
              <label className="block text-sm font-medium mb-1.5">Vĩ độ (Lat)</label>
              <input
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="Ví dụ: 10.762"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Kinh độ (Lng)</label>
              <input
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="Ví dụ: 106.660"
              />
            </div>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Branches;
