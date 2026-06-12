import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronDown, User } from 'lucide-react';

import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { authApi } from '../../api/auth';
import { getRoleLabel } from '../../utils/format';
import { NotificationDropdown } from './NotificationDropdown';

export const Header: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) { }
    clearAuth();
    navigate('/login');
  };

  const getPageName = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/profile') return 'Hồ sơ cá nhân';
    if (pathname.startsWith('/products')) return 'Sản phẩm';
    if (pathname.startsWith('/orders')) return 'Đơn hàng';
    if (pathname.startsWith('/inventory')) return 'Tồn kho';
    if (pathname.startsWith('/users')) return 'Người dùng';
    if (pathname.startsWith('/prescriptions')) return 'Đơn thuốc';
    if (pathname.startsWith('/reviews')) return 'Hỏi & Đáp';
    if (pathname.startsWith('/branches')) return 'Chi nhánh';
    if (pathname.startsWith('/categories')) return 'Danh mục';
    if (pathname.startsWith('/brands')) return 'Thương hiệu';
    if (pathname.startsWith('/coupons')) return 'Khuyến mãi';
    if (pathname.startsWith('/analytics')) return 'Thống kê';
    return '';
  };

  return (
    <header className="h-16 bg-[var(--bg-surface)] border-b border-[var(--bg-border)] sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-lg font-medium text-[var(--text-primary)] hidden sm:block">
          {getPageName()}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <NotificationDropdown />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-[var(--bg-elevated)] p-1 pr-2 rounded-full transition-colors"
          >
            <Avatar name={user?.full_name || 'U'} size="sm" />
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl shadow-lg shadow-black/50 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-[var(--bg-border)]">
                <div className="font-medium text-[var(--text-primary)] truncate">{user?.full_name}</div>
                <div className="text-xs text-[var(--text-secondary)] truncate mb-2">{user?.email}</div>
                {user?.role && (
                  <Badge variant="info" size="sm">
                    {getRoleLabel(user.role)}
                  </Badge>
                )}
              </div>
              <div className="py-1">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                >
                  <User className="w-4 h-4" />
                  Hồ sơ cá nhân
                </button>
              </div>
              <div className="border-t border-[var(--bg-border)] py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
