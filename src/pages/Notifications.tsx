import React, { useState, useEffect } from 'react';
import { 
  Bell, Clock, Check, Info, AlertTriangle, CheckCircle, 
  XCircle, ArrowRight, ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import { notificationApi } from '../api/notification';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import type { AppNotification } from '../types';

const Notifications: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  const { success: showToast } = useToast();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.getNotifications(page);
      setNotifications(response.data.data || []);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    setActionLoading(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      showToast('Đã đánh dấu đọc tất cả thông báo');
    } catch (error) {
      console.error('Failed to mark all as read', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter((n: AppNotification) => !n.read_at)
    : notifications;

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-rose-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    if (notification.data.link) {
      navigate(notification.data.link);
    }
  };

  return (
    <PageWrapper
      title="Trung tâm thông báo"
      subtitle="Quản lý và theo dõi các hoạt động trên hệ thống."
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={markAllAsRead}
          loading={actionLoading}
          disabled={!notifications.some((n: AppNotification) => !n.read_at)}
        >
          <Check className="w-4 h-4 mr-2" />
          Đánh dấu đã đọc tất cả
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Filters */}
        <div className="flex items-center gap-2 bg-[var(--bg-elevated)] p-1 rounded-xl w-fit border border-[var(--bg-border)]">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${
              filter === 'all' 
                ? 'bg-[var(--bg-surface)] text-[var(--brand-primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${
              filter === 'unread' 
                ? 'bg-[var(--bg-surface)] text-[var(--brand-primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Chưa đọc
          </button>
        </div>

        {/* List */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--bg-border)] overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-10 h-10 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[var(--text-secondary)] text-sm font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                <Bell className="w-10 h-10 text-[var(--text-primary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Không có thông báo nào</h3>
              <p className="text-[var(--text-secondary)] text-sm max-w-xs mx-auto leading-relaxed">
                {filter === 'unread' 
                  ? "Bạn đã xử lý hết các thông báo quan trọng rồi." 
                  : "Hệ thống chưa có hoạt động mới nào cần thông báo."}
              </p>
            </div>
          ) : (
          <div className="flex flex-col gap-4">
              {filteredNotifications.map((notification: AppNotification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 sm:p-5 rounded-xl transition-all duration-300 cursor-pointer flex gap-4 group relative border ${
                    !notification.read_at 
                      ? 'bg-emerald-500/[0.04] border-emerald-500/20 shadow-sm hover:bg-emerald-500/[0.08]' 
                      : 'bg-white border-[var(--bg-border)] hover:bg-[var(--bg-elevated)] hover:shadow-md'
                  }`}
                >
                  {!notification.read_at && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full" />
                  )}

                  <div className="mt-0.5 flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 ${
                      !notification.read_at ? 'bg-white shadow-sm border border-emerald-500/10' : 'bg-[var(--bg-elevated)]'
                    }`}>
                      {getIcon(notification.data.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div className="flex items-center gap-3">
                        {!notification.read_at && (
                          <div className="relative flex items-center justify-center">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping absolute"></span>
                            <span className="w-2 h-2 bg-emerald-500 rounded-full relative"></span>
                          </div>
                        )}
                        <h4 className={`text-base leading-tight ${
                          !notification.read_at ? 'text-emerald-950 font-bold' : 'text-[var(--text-secondary)] font-semibold'
                        }`}>
                          {notification.data.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider bg-[var(--bg-elevated)] px-2.5 py-1.5 rounded-lg border border-[var(--bg-border)] shrink-0">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {format(new Date(notification.created_at), 'HH:mm', { locale: vi })}
                        </span>
                        <div className="w-0.5 h-0.5 bg-[var(--bg-border)] rounded-full" />
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(notification.created_at), 'dd/MM', { locale: vi })}
                        </span>
                      </div>
                    </div>

                    <p className={`text-sm leading-relaxed mb-3 max-w-4xl ${
                      !notification.read_at ? 'text-emerald-900 font-medium' : 'text-[var(--text-muted)]'
                    }`}>
                      {notification.data.body}
                    </p>

                    {notification.data.link && (
                      <div className="inline-flex items-center gap-3 text-xs text-emerald-600 font-black uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                        Tiến hành xử lý <ArrowRight size={16} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-xl px-4"
            >
              <ChevronLeft size={18} className="mr-1" />
              Trước
            </Button>
            
            <div className="flex items-center gap-1.5">
              {[...Array(meta.last_page)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                    page === i + 1 
                      ? 'bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/20' 
                      : 'bg-[var(--bg-surface)] border border-[var(--bg-border)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              disabled={page === meta.last_page}
              onClick={() => setPage(p => p + 1)}
              className="rounded-xl px-4"
            >
              Sau
              <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Notifications;
