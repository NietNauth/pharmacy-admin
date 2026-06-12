import React, { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, ChevronDown, Edit2, Plus } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Pagination } from '../components/ui/Pagination';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Switch } from '../components/ui/Switch';
import { useAuthStore } from '../stores/authStore';
import { usersApi } from '../api/users';
import { branchesApi } from '../api/branches';
import type { User, UserRole, Branch } from '../types';
import { formatDateTime, getRoleLabel } from '../utils/format';
import { useToast } from '../components/ui/Toast';

const ROLE_OPTIONS: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'pharmacist', label: 'Dược sĩ' },
  { value: 'customer', label: 'Khách hàng' },
];

const ROLE_VARIANT: Record<UserRole, 'info' | 'warning' | 'neutral'> = {
  admin: 'info',
  pharmacist: 'warning',
  customer: 'neutral',
};

const Users: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [error, setError] = useState('');

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer' as UserRole,
    branch_id: '',
  });

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    phone: '',
    branch_id: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page: p, per_page: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await usersApi.getList(params);
      setUsers(res.data);
      setTotalPages(res.meta.last_page);
      setTotal(res.meta.total);
    } catch {
      setError('Không thể tải danh sách người dùng');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers(1);
    setPage(1);
    branchesApi.getList().then(res => setBranches(res.data as Branch[])).catch(() => {});
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name,
      phone: user.phone || '',
      branch_id: user.branch?.id || '',
      is_active: user.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.create({
        ...createFormData,
        branch_id: createFormData.branch_id || null,
      });
      success('Tạo người dùng thành công');
      setIsCreateModalOpen(false);
      fetchUsers(1, true);
      setCreateFormData({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        role: 'customer',
        branch_id: '',
      });
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Tạo thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      await usersApi.update(editingUser.id, { 
        full_name: editFormData.full_name,
        phone: editFormData.phone || null,
        branch_id: editFormData.branch_id || null,
        is_active: editFormData.is_active
      });
      success('Cập nhật người dùng thành công');
      setIsEditModalOpen(false);
      fetchUsers(page, true);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper
      title="Người dùng"
      subtitle={`Tổng ${total} tài khoản`}
      actions={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => fetchUsers(page)}
          >
            Làm mới
          </Button>
          <Button
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Thêm người dùng
          </Button>
        </div>
      }
    >
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm tên, email, số điện thoại..."
              className="pl-9 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)] w-64"
            />
            <button type="submit" className="hidden">Search</button>
          </form>

          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              className="pl-3 pr-8 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] appearance-none cursor-pointer"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
          </div>

          {(search || roleFilter) && (
            <button
              onClick={() => { setSearch(''); setSearchInput(''); setRoleFilter(''); }}
              className="text-sm text-[var(--accent-primary)] hover:underline"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {error && (
          <div className="px-6 py-4 text-sm text-red-500 bg-red-500/5 border-b border-[var(--bg-border)]">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--bg-border)]">
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Tên người dùng</th>
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Email</th>
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Vai trò</th>
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Chi nhánh</th>
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Trạng thái</th>
                <th className="text-left px-5 py-3 font-medium text-[var(--text-secondary)]">Ngày tạo</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-[var(--bg-border)]">
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[var(--text-muted)] italic">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--bg-border)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.full_name} size="sm" />
                        <span className="font-medium text-[var(--text-primary)]">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)]">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={ROLE_VARIANT[user.role]}>{getRoleLabel(user.role)}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)]">
                      {user.branch ? (
                        <span className="text-[var(--text-secondary)]">
                          {user.branch.name}
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {user.is_active ? (
                        <Badge variant="success">Hoạt động</Badge>
                      ) : (
                        <Badge variant="error">Đã khóa</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)]">
                      {formatDateTime(user.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end items-center">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
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
                fetchUsers(p, true);
                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              showInfo
            />
          </div>
        )}
      </Card>

      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Thêm người dùng mới"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)} type="button">
              Hủy
            </Button>
            <Button type="submit" form="create-user-form" loading={saving}>
              Tạo tài khoản
            </Button>
          </div>
        }
      >
        <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Họ và tên</label>
            <input
              type="text"
              value={createFormData.full_name}
              onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
              placeholder="Nhập họ tên đầy đủ"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Mật khẩu</label>
              <input
                type="password"
                value={createFormData.password}
                onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="Tối thiểu 8 ký tự"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Số điện thoại</label>
              <input
                type="text"
                value={createFormData.phone}
                onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="09xxx..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Vai trò</label>
              <select
                value={createFormData.role}
                onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as UserRole })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] appearance-none cursor-pointer"
              >
                <option value="customer">Khách hàng</option>
                <option value="pharmacist">Dược sĩ</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
          </div>

          {createFormData.role !== 'customer' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Gán chi nhánh</label>
              <select
                value={createFormData.branch_id}
                onChange={(e) => setCreateFormData({ ...createFormData, branch_id: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
              >
                <option value="">Không gán chi nhánh</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa người dùng"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} type="button">
              Hủy
            </Button>
            <Button type="submit" form="edit-user-form" loading={saving}>
              Lưu thay đổi
            </Button>
          </div>
        }
      >
        <form id="edit-user-form" onSubmit={handleUpdateUser} className="space-y-4">
          <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--bg-border)] mb-4">
            <div className="text-sm font-medium">{editingUser?.full_name}</div>
            <div className="text-xs text-[var(--text-secondary)]">{editingUser?.email}</div>
            <div className="mt-2">
              <Badge variant={editingUser ? ROLE_VARIANT[editingUser.role] : 'neutral'}>
                {editingUser ? getRoleLabel(editingUser.role) : ''}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Họ và tên</label>
              <input
                type="text"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Số điện thoại</label>
              <input
                type="text"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="09xxx..."
              />
            </div>
          </div>

          {editingUser?.role !== 'customer' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Gán chi nhánh</label>
              <select
                value={editFormData.branch_id}
                onChange={(e) => setEditFormData({ ...editFormData, branch_id: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
              >
                <option value="">Không gán chi nhánh</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-[var(--text-muted)] mt-1.5 italic">
                Thường áp dụng cho nhân viên hoặc dược sĩ để quản lý kho tại chi nhánh đó.
              </p>
            </div>
          )}

          <div className="pt-2">
            <label className="block text-sm font-medium mb-3">Trạng thái tài khoản</label>
            <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl flex items-center justify-between">
              <div className="text-sm text-[var(--text-secondary)]">
                {editFormData.is_active ? 'Tài khoản đang hoạt động' : 'Tài khoản đang bị khóa'}
              </div>
              <Switch 
                checked={editFormData.is_active} 
                onChange={(checked) => setEditFormData({ ...editFormData, is_active: checked })}
                disabled={editingUser?.id === useAuthStore.getState().user?.id}
              />
            </div>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Users;
