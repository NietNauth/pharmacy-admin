import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse,
  Users, FileText, HelpCircle, MapPin, LayoutGrid, Shield, Ticket, TrendingUp,
  MessageSquare, Image as ImageIcon
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';

const navItems = {
  admin: [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Thống kê', path: '/analytics', icon: TrendingUp },
    { label: 'Đơn hàng', path: '/orders', icon: ShoppingCart },
    { label: 'Hỗ trợ khách', path: '/chat', icon: MessageSquare },
    { label: 'Đơn thuốc', path: '/prescriptions', icon: FileText },
    { label: 'Tồn kho', path: '/inventory', icon: Warehouse },
    { label: 'Sản phẩm', path: '/products', icon: Package },
    { label: 'Danh mục', path: '/categories', icon: LayoutGrid },
    { label: 'Thương hiệu', path: '/brands', icon: Shield },
    { label: 'Hỏi & Đáp', path: '/reviews', icon: HelpCircle },
    { label: 'Chi nhánh', path: '/branches', icon: MapPin },
    { label: 'Người dùng', path: '/users', icon: Users },
    { label: 'Khuyến mãi', path: '/coupons', icon: Ticket },
    { label: 'Quản lý Slide', path: '/slides', icon: ImageIcon },
    { label: 'Cấu hình AI', path: '/chatbot-settings', icon: Shield },
  ],
  pharmacist: [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Thống kê', path: '/analytics', icon: TrendingUp },
    { label: 'Hỗ trợ khách', path: '/chat', icon: MessageSquare },
    { label: 'Đơn hàng', path: '/orders', icon: ShoppingCart },
    { label: 'Đơn thuốc', path: '/prescriptions', icon: FileText },
    { label: 'Tồn kho', path: '/inventory', icon: Warehouse },
  ]
};

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user } = useAuthStore();

  const roleItems = user?.role === 'admin' ? navItems.admin : (user?.role === 'pharmacist' ? navItems.pharmacist : []);

  return (
    <div className="flex flex-col h-full w-60 bg-[var(--bg-surface)] border-r border-[var(--bg-border)] overflow-hidden">
      <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--bg-border)] shrink-0">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="PharmaVN Logo" className="w-8 h-8 object-contain" />
          <img src="/logo-text.png" alt="PharmaVN" className="h-6 object-contain" />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 -mr-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {roleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ease-out border-l-2',
              isActive
                ? 'bg-[var(--accent-muted)] text-[var(--accent-primary)] border-[var(--accent-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
