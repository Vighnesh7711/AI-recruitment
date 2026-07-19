import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { Bell, Check, CheckCheck, Sparkles, X } from 'lucide-react';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // Non-critical background fetch fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full transition-all flex items-center justify-center"
        style={{
          backgroundColor: isOpen ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#ffffff',
        }}
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-white" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center px-1.5 py-0.5 text-[10px] font-extrabold text-black rounded-full animate-pulse shadow-md"
            style={{ backgroundColor: '#c8f24c', minWidth: '18px', height: '18px' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: '#162e22',
            borderColor: 'rgba(255,255,255,0.15)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Dropdown Header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(0,0,0,0.2)',
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: '#c8f24c' }} />
              <span className="text-sm font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(200,242,76,0.15)', color: '#c8f24c' }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold flex items-center gap-1 transition-colors hover:underline"
                  style={{ color: '#c8f24c' }}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium text-slate-300">No notifications yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Updates on application status, offers, & interviews will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  className="p-3.5 transition-colors flex items-start justify-between gap-3 group relative"
                  style={{
                    backgroundColor: item.isRead
                      ? 'transparent'
                      : 'rgba(200,242,76,0.06)',
                  }}
                >
                  {!item.isRead && (
                    <div
                      className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: '#c8f24c' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold text-white truncate"
                      style={{ color: item.isRead ? 'rgba(255,255,255,0.85)' : '#ffffff' }}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                  {!item.isRead && (
                    <button
                      onClick={(e) => markAsRead(item._id, e)}
                      title="Mark as read"
                      className="p-1 rounded-md text-slate-400 hover:text-lime-300 hover:bg-white/10 transition-all shrink-0 mt-0.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
