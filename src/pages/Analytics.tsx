import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { dashboardApi } from '../api/dashboard';
import { formatCurrency } from '../utils/format';
import { ShoppingCart, TrendingUp, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { branchesApi } from '../api/branches';
import { useAuthStore } from '../stores/authStore';
import type { AnalyticsStats, Branch } from '../types';

const Analytics: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [type, setType] = useState<'day' | 'month' | 'year'>('month');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const isAdmin = user?.role === 'admin';

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getAnalytics(type, date, selectedBranchId);
      setStats(res.data);
    } catch {
      setError('Không thể tải dữ liệu thống kê');
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
    if (isAdmin) {
      loadBranches();
    }
  }, [isAdmin]);

  useEffect(() => {
    loadAnalytics();
  }, [type, date, selectedBranchId]);

  const statCards = [
    {
      label: 'Tổng đơn hàng',
      value: stats ? stats.sales.total_orders.toLocaleString() : '—',
      icon: ShoppingCart,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Tổng doanh thu',
      value: stats ? formatCurrency(stats.sales.total_revenue) : '—',
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Sản phẩm đã bán',
      value: stats ? stats.sales.total_products_sold.toLocaleString() : '—',
      icon: Package,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  return (
    <PageWrapper title="Thống kê & Báo cáo" subtitle="Thống kê doanh thu và sản phẩm bán chạy">
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="flex items-center gap-2 w-full md:w-auto bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--bg-border)]">
          <button
            onClick={() => setType('day')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${type === 'day' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'}`}
          >
            Theo Ngày
          </button>
          <button
            onClick={() => setType('month')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${type === 'month' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'}`}
          >
            Theo Tháng
          </button>
          <button
            onClick={() => setType('year')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${type === 'year' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'}`}
          >
            Theo Năm
          </button>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-[var(--text-muted)]" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 w-full px-4 py-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
            />
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--bg-border)]">
            <span className="text-xs font-bold text-[var(--text-secondary)] pl-2 uppercase tracking-wider">Chi nhánh:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[var(--accent-primary)] focus:outline-none cursor-pointer pr-2 min-w-[150px]"
            >
              <option value="">Tất cả hệ thống</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {statCards.map((s, i) => (
          <Card key={i} className="p-6 flex items-center gap-4 relative overflow-hidden group">
            <div className={`p-3 rounded-xl shrink-0 ${s.bg} ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-secondary)] truncate">{s.label}</p>
              {loading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <h3 className={`font-bold text-[var(--text-primary)] truncate ${s.label.includes('doanh thu') ? 'text-3xl text-[var(--accent-primary)]' : 'text-2xl'}`}>
                  {s.value}
                </h3>
              )}
            </div>
            {s.label.includes('doanh thu') && (
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-[var(--accent-primary)]">
                <TrendingUp className="w-24 h-24" />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-6 mb-6">
        <h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-[var(--accent-primary)]" />
          {type === 'day' ? 'Biểu đồ 7 ngày gần nhất' : type === 'month' ? 'Biểu đồ các tháng trong năm' : 'Biểu đồ 10 năm gần nhất'}
        </h4>
        {loading ? (
          <Skeleton className="w-full h-80" />
        ) : (
          <div className="h-80">
            {stats?.chart_data?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bg-border)" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left" 
                    axisLine={false} 
                    tickLine={false} 
                    width={100}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} 
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                  />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-surface)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: any, name: any) => {
                        if (name === 'Doanh thu') return [formatCurrency(value), 'Doanh thu'];
                        return [value, 'Đơn hàng'];
                      }}
                    />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar 
                    yAxisId="left" 
                    dataKey="revenue" 
                    name="Doanh thu" 
                    fill="url(#colorRevenue)"
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={40}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="orders" 
                    name="Đơn hàng" 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    dot={{ r: 6, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm italic">
                Không có dữ liệu biểu đồ
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Top Products */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--bg-border)] bg-[var(--bg-elevated)]/50">
          <h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--accent-primary)]" />
            Sản phẩm bán chạy nhất
          </h4>
        </div>

        {loading ? (
          <div className="p-6 flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-4 w-48" />
                <div className="flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : !stats?.top_products?.length ? (
          <div className="py-16 text-center text-[var(--text-muted)] text-sm italic">
            Không có dữ liệu sản phẩm bán chạy trong khoảng thời gian này
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bg-border)] bg-[var(--bg-elevated)]">
                  <th className="text-left px-6 py-3 font-medium text-[var(--text-secondary)] w-12">#</th>
                  <th className="text-left px-6 py-3 font-medium text-[var(--text-secondary)]">Sản phẩm</th>
                  <th className="text-right px-6 py-3 font-medium text-[var(--text-secondary)]">Đã bán</th>
                  <th className="text-right px-6 py-3 font-medium text-[var(--text-secondary)]">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_products.map((item, idx) => (
                  <tr
                    key={item.product_id}
                    className="border-b border-[var(--bg-border)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-[var(--text-secondary)]">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg border border-[var(--bg-border)] overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                          {item.product?.primary_image ? (
                            <img
                              src={item.product.primary_image}
                              alt={item.product.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)] line-clamp-1">
                            {item.product?.name ?? 'Sản phẩm đã bị xóa'}
                          </p>
                          {item.product && (
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {formatCurrency(item.product.sale_price ?? item.product.base_price)} / {item.product.unit}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-[var(--text-primary)]">
                      <span className="bg-[var(--bg-elevated)] px-2 py-1 rounded-md border border-[var(--bg-border)]">
                        {item.total_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[var(--accent-primary)] text-base">
                      {formatCurrency(item.total_revenue)}
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

export default Analytics;
