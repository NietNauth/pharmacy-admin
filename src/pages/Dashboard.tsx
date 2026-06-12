import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Users, TrendingUp, Package, ArrowUpRight, Clock } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { dashboardApi } from '../api/dashboard';
import { branchesApi } from '../api/branches';
import { useAuthStore } from '../stores/authStore';
import type { DashboardStats, Branch } from '../types';
import { formatCurrency, formatDateTime, getOrderStatusLabel, getOrderStatusVariant } from '../utils/format';

const OperationCard: React.FC<{
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  action: string;
  link: string;
  loading?: boolean;
}> = ({ label, value, sub, icon: Icon, color, bg, action, link, loading }) => (
  <Link to={link}>
    <Card className="p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-[var(--accent-primary)]/5 transition-all duration-300 border border-[var(--bg-border)] hover:border-[var(--accent-primary)]/40 h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl shrink-0 ${bg} ${color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        {!loading && value > 0 && (
          <span className={`flex h-2 w-2 rounded-full ${color.replace('text', 'bg')} animate-pulse`} />
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-3xl font-black text-[var(--text-primary)] mb-1">
          {loading ? <Skeleton className="h-9 w-16" /> : value}
        </h3>
        <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">{label}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">{sub}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--bg-border)] flex items-center justify-between group-hover:border-[var(--accent-primary)]/20 transition-colors">
        <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{action}</span>
        <ArrowUpRight className={`w-4 h-4 ${color} transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5`} />
      </div>

      {/* Decorative background number */}
      <div className="absolute -right-2 -bottom-4 text-8xl font-black opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.06] transition-opacity">
        {value}
      </div>
    </Card>
  </Link>
);

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const isAdmin = user?.role === 'admin';

  const fetchData = async (branchId?: string) => {
    setLoading(true);
    try {
      const res = await dashboardApi.getStats(branchId);
      setStats(res.data);
    } catch {
      // Error handled by state
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await branchesApi.getList();
      setBranches(res.data);
    } catch (err) {
      console.error('Failed to load branches', err);
    }
  };

  useEffect(() => {
    fetchData(selectedBranchId);
  }, [selectedBranchId]);

  useEffect(() => {
    if (isAdmin) {
      loadBranches();
    }
  }, [isAdmin]);

  return (
    <PageWrapper 
      title="Tổng quan hệ thống" 
      subtitle={isAdmin ? 'Quản lý toàn bộ hệ thống nhà thuốc' : `Quản lý chi nhánh: ${user?.branch?.id ?? '—'}`}
      actions={
        isAdmin && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Xem chi nhánh:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-[var(--bg-surface)] border border-[var(--bg-border)] text-[var(--text-primary)] text-sm rounded-xl px-4 py-2 outline-none focus:border-[var(--accent-primary)] transition-all min-w-[200px]"
            >
              <option value="">Tất cả hệ thống</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )
      }
    >
      {/* Actionable Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <OperationCard
          label="Đơn hàng chờ"
          value={stats?.orders.pending ?? 0}
          sub="Cần xác nhận và xử lý ngay"
          icon={ShoppingCart}
          color="text-orange-500"
          bg="bg-orange-500/10"
          action="Xử lý ngay"
          link="/orders"
          loading={loading}
        />
        <OperationCard
          label="Đơn thuốc mới"
          value={stats?.prescriptions.pending ?? 0}
          sub="Đang chờ dược sĩ phê duyệt"
          icon={Clock}
          color="text-blue-500"
          bg="bg-blue-500/10"
          action="Duyệt đơn"
          link="/prescriptions"
          loading={loading}
        />
        <OperationCard
          label="Sắp hết hàng"
          value={stats?.products.low_stock ?? 0}
          sub="Sản phẩm dưới mức tồn kho tối thiểu"
          icon={Package}
          color="text-red-500"
          bg="bg-red-500/10"
          action="Nhập hàng"
          link="/inventory"
          loading={loading}
        />
        <OperationCard
          label="Khách hàng mới"
          value={stats?.users.new_today ?? 0}
          sub="Đăng ký mới trong hôm nay"
          icon={Users}
          color="text-green-500"
          bg="bg-green-500/10"
          action="Xem chi tiết"
          link="/users"
          loading={loading}
        />
      </div>

      {/* Recent Orders Section */}
      <Card className="overflow-hidden border border-[var(--bg-border)] shadow-xl shadow-black/5">
        <div className="px-6 py-4 border-b border-[var(--bg-border)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Đơn hàng gần đây</h2>
          </div>
          <Link
            to="/orders"
            className="text-sm font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
          >
            Xem tất cả <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : !stats?.recent_orders?.length ? (
          <div className="py-16 text-center text-[var(--text-muted)] text-sm italic">
            Chưa có đơn hàng nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bg-border)]">
                  <th className="text-left px-6 py-3 font-medium text-[var(--text-secondary)]">Mã đơn</th>
                  <th className="text-left px-6 py-3 font-medium text-[var(--text-secondary)]">Khách hàng</th>
                  <th className="text-left px-6 py-3 font-medium text-[var(--text-secondary)]">Trạng thái</th>
                  <th className="text-right px-6 py-3 font-medium text-[var(--text-secondary)]">Tổng tiền</th>
                  <th className="text-left px-6 py-3 font-medium text-[var(--text-secondary)]">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--bg-border)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <td className="px-6 py-3.5 font-mono font-medium text-[var(--accent-primary)]">
                      {order.order_code}
                    </td>
                    <td className="px-6 py-3.5 text-[var(--text-primary)]">
                      {order.user?.full_name ?? '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={getOrderStatusVariant(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-[var(--text-primary)]">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-3.5 text-[var(--text-secondary)]">
                      {order.created_at ? formatDateTime(order.created_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageWrapper>
  );
};

export default Dashboard;
