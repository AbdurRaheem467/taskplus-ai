import React from 'react';
import { X, Bell, CheckCheck, Trash2, Clock, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { NotificationItem, Task } from '../../types';
import { formatFullDateTime } from '../../utils/dateUtils';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSelectTaskFromNotification?: (taskId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onSelectTaskFromNotification,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Notifications Center
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Automated deadline reminders and overdue alerts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline disabled:opacity-40 flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>

          <button
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="text-slate-400 hover:text-rose-500 disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Bell className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No notifications yet
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Reminders will appear automatically before deadlines and when tasks become overdue.
              </p>
            </div>
          ) : (
            notifications.map(item => {
              const isOverdue = item.type === 'overdue';
              const isReminder = item.type === 'reminder';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onMarkRead(item.id);
                    if (item.taskId && onSelectTaskFromNotification) {
                      onSelectTaskFromNotification(item.taskId);
                      onClose();
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    !item.read
                      ? 'border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20'
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {isOverdue ? '🔴' : isReminder ? '🔔' : '⚡'}
                      </span>
                      <h4 className={`text-xs font-bold ${
                        isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {item.title}
                      </h4>
                    </div>

                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                    {item.message}
                  </p>

                  <div className="text-[10px] text-slate-400 pl-6 pt-1 flex items-center justify-between">
                    <span>{formatFullDateTime(item.timestamp)}</span>
                    {item.taskId && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        View task details →
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
