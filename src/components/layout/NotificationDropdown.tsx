import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Check, Clock, ExternalLink, Info, AlertTriangle, 
  CheckCircle, XCircle, ArrowUpRight 
} from 'lucide-react';
import { notificationApi } from '../../api/notification';
import type { AppNotification } from '../../types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/Toast';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast: _toast } = useToast();
  const prevLatestId = useRef<string | null>(null);
  const isFirstLoad = useRef(true);
  const [activeAlerts, setActiveAlerts] = useState<(AppNotification & { alertId: string; timeLeft: number })[]>([]);
  const POPUP_DURATION = 5000; // 5 seconds

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications();
      const items = response.data.data || [];
      const newUnreadCount = items.filter((n: AppNotification) => !n.read_at).length;

      const latestNotification = items[0];
      const latestId = latestNotification?.id;

      // If there is a NEW notification at the top of the list
      if (!isFirstLoad.current && latestId && latestId !== prevLatestId.current) {
        if (!latestNotification.read_at) {
          // Play notification sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => console.log('Audio play blocked'));

          // Add to active alerts
          const newAlert = { 
            ...latestNotification, 
            alertId: `${latestId}-${Date.now()}`,
            timeLeft: POPUP_DURATION 
          };
          setActiveAlerts(prev => [newAlert, ...prev].slice(0, 3)); // Max 3 alerts

          // Show Browser Notification
          if (Notification.permission === 'granted') {
            new Notification(latestNotification.data.title, {
              body: latestNotification.data.body,
              icon: '/favicon.ico'
            });
          }

          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('new-notification', { detail: latestNotification }));
        }
      }

      setNotifications(items);
      setUnreadCount(newUnreadCount);
      prevLatestId.current = latestId;
      isFirstLoad.current = false;
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), 5000);
    return () => clearInterval(interval);
  }, []);

  // Timer for active alerts
  useEffect(() => {
    if (activeAlerts.length > 0) {
      const interval = setInterval(() => {
        setActiveAlerts(prev => {
          const next = prev
            .map(a => ({ ...a, timeLeft: a.timeLeft - 100 }))
            .filter(a => a.timeLeft > 0);
          return next;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [activeAlerts.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      if (link) {
        setIsOpen(false);
        navigate(link);
      }
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[var(--bg-surface)] shadow-sm animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-[var(--bg-border)] flex items-center justify-between bg-[var(--bg-elevated)]/50">
            <h3 className="font-semibold text-[var(--text-primary)]">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-[var(--brand-primary)] hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3 opacity-20" />
                <p className="text-[var(--text-secondary)] text-sm">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--bg-border)]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleMarkAsRead(notification.id, notification.data.link)}
                    className={`px-4 py-4 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer flex gap-3 ${!notification.read_at ? 'bg-[var(--brand-primary)]/5' : ''}`}
                  >
                    <div className="mt-1 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!notification.read_at ? 'bg-[var(--brand-primary)]/20' : 'bg-[var(--bg-border)]'}`}>
                        {getIcon(notification.data.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-none mb-1 ${!notification.read_at ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                          {notification.data.title}
                        </p>
                        {!notification.read_at && (
                          <span className="w-2 h-2 bg-[var(--brand-primary)] rounded-full mt-1"></span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">
                        {notification.data.body}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                          <Clock className="w-3 h-3" />
                          {format(new Date(notification.created_at), 'HH:mm dd/MM')}
                        </div>
                        {notification.data.link && (
                          <ExternalLink className="w-3 h-3 text-[var(--text-tertiary)]" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-[var(--bg-border)] bg-[var(--bg-elevated)]/30 text-center">
            <button 
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
      {/* Tiny Brand-Aligned Notification Stack */}
      <div className="absolute right-0 top-full mt-3 flex flex-col gap-2 pointer-events-none">
        {activeAlerts.map((alert, index) => (
          <div 
            key={alert.alertId}
            className="w-56 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-right-5 duration-300 pointer-events-auto relative ring-1 ring-black/[0.05]"
            style={{ 
              zIndex: 60 - index,
              transform: `scale(${1 - index * 0.05}) translateY(${index * 4}px)`,
              opacity: 1 - index * 0.2
            }}
          >
            {/* Minimalist Progress Header */}
            <div className="h-1 bg-[var(--bg-elevated)] w-full">
              <div 
                className="h-full bg-[var(--accent-primary)] transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.5)]"
                style={{ width: `${(alert.timeLeft / POPUP_DURATION) * 100}%` }}
              />
            </div>

            <div className="p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-[var(--accent-primary)]/10 rounded flex items-center justify-center text-[var(--accent-primary)] relative overflow-hidden">
                    {/* Pulsing background effect */}
                    <div className="absolute inset-0 bg-[var(--accent-primary)]/20 animate-pulse" />
                    <Bell className="w-2.5 h-2.5 fill-[var(--accent-primary)]/20 animate-[ring_2s_ease-in-out_infinite] relative z-10" />
                  </div>
                  <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    Thông báo mới
                  </span>
                </div>
                <button 
                  onClick={() => setActiveAlerts(prev => prev.filter(a => a.alertId !== alert.alertId))} 
                  className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
              
              <h4 className="text-[10px] font-black text-[var(--text-primary)] leading-tight mb-1">
                {alert.data.title}
              </h4>
              <p className="text-[9px] text-[var(--text-secondary)] leading-relaxed mb-2.5 line-clamp-2">
                {alert.data.body}
              </p>

              <button 
                className="w-full bg-[var(--accent-primary)] hover:opacity-90 text-white text-[9px] font-black py-1.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                onClick={() => {
                  if (alert.data.link) {
                    navigate(alert.data.link);
                    setActiveAlerts(prev => prev.filter(a => a.alertId !== alert.alertId));
                    setIsOpen(false);
                  }
                }}
              >
                Xem ngay
                <ArrowUpRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ))}
        <style>{`
          @keyframes ring {
            0%, 100% { transform: rotate(0); }
            10%, 30%, 50%, 70%, 90% { transform: rotate(-18deg); }
            20%, 40%, 60%, 80% { transform: rotate(18deg); }
          }
        `}</style>
      </div>
    </div>
  );
};
