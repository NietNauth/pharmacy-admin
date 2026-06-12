import React, { useState } from 'react';
import { Mail, Phone, MapPin, Calendar, Lock, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/ui/Toast';
import { authApi } from '../api/auth';
import { getRoleLabel, formatDateTime } from '../utils/format';

const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToast();
  
  // Change Password State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState('');

  if (!user) return null;

  const handleOpenModal = () => {
    setFormData({
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    });
    setShowPasswords({ current: false, new: false, confirm: false });
    setError('');
    setIsModalOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.new_password !== formData.new_password_confirmation) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
        new_password_confirmation: formData.new_password_confirmation,
      });
      success('Đổi mật khẩu thành công');
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err.message || 'Có lỗi xảy ra, vui lòng thử lại';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper title="">
      <div className="max-w-2xl mx-auto py-8">
        <Card className="p-8 border-none shadow-xl shadow-black/5">
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-4">
              <Avatar name={user.full_name} size="lg" className="w-28 h-28 border-4 border-[var(--bg-surface)] shadow-lg" />
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-green-500 rounded-full border-4 border-[var(--bg-surface)]" title="Đang hoạt động"></div>
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{user.full_name}</h2>
            <Badge variant="info" className="mt-2 px-3 py-1 text-xs font-bold uppercase tracking-wider">{getRoleLabel(user.role)}</Badge>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--bg-border)] hover:border-[var(--accent-primary)]/30 transition-colors group">
                <div className="p-2.5 bg-[var(--accent-primary)]/10 rounded-xl group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                  <Mail className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Email</div>
                  <div className="text-sm font-semibold truncate">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--bg-border)] hover:border-[var(--accent-primary)]/30 transition-colors group">
                <div className="p-2.5 bg-[var(--accent-primary)]/10 rounded-xl group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                  <Phone className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Số điện thoại</div>
                  <div className="text-sm font-semibold">{user.phone || 'Chưa cập nhật'}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--bg-border)] hover:border-[var(--accent-primary)]/30 transition-colors group">
                <div className="p-2.5 bg-[var(--accent-primary)]/10 rounded-xl group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                  <MapPin className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Chi nhánh</div>
                  <div className="text-sm font-semibold truncate">{user.branch?.name || 'Chưa gán'}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--bg-border)] hover:border-[var(--accent-primary)]/30 transition-colors group">
                <div className="p-2.5 bg-[var(--accent-primary)]/10 rounded-xl group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                  <Calendar className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Ngày tham gia</div>
                  <div className="text-sm font-semibold">{formatDateTime(user.created_at)}</div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-[var(--bg-border)] flex justify-center">
              <button 
                onClick={handleOpenModal}
                className="flex items-center gap-2 px-8 py-3 bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)] text-sm font-bold rounded-2xl hover:bg-[var(--bg-border)] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
              >
                <Lock className="w-4 h-4 text-[var(--accent-primary)]" />
                Đổi mật khẩu
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Đổi mật khẩu"
      >
        <form onSubmit={handleChangePassword} className="space-y-5">
          <div className="p-4 bg-[var(--accent-primary)]/5 rounded-2xl border border-[var(--accent-primary)]/10 mb-2">
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">Bảo mật tài khoản</div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">Vui lòng nhập mật khẩu hiện tại để xác thực trước khi đổi mật khẩu mới.</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-500">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2 ml-1">Mật khẩu hiện tại</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.current_password}
                  onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors text-sm pr-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2 ml-1">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors text-sm pr-11"
                  placeholder="Ít nhất 8 ký tự, có chữ hoa và số"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2 ml-1">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.new_password_confirmation}
                  onChange={(e) => setFormData({ ...formData, new_password_confirmation: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors text-sm pr-11"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Hủy
            </Button>
            <Button type="submit" loading={loading}>
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Profile;
