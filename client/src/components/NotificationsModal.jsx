import React, { useState } from 'react';
import { X, Bell, TrendingUp, AlertTriangle, CheckCircle, Info, ShieldCheck, CheckCheck } from 'lucide-react';

export default function NotificationsModal({ 
  isOpen, 
  onClose, 
  dashboardData, 
  formatCurrency,
  onClearUnread
}) {
  const [cleared, setCleared] = useState(false);

  if (!isOpen) return null;

  const totalSpent = dashboardData?.total_spent || 0;
  const budget = dashboardData?.budget || 0;
  const percentSpent = dashboardData?.percent_spent || 0;

  let prefs = { notify80: true, notify100: true, notifySync: true };
  try {
    const saved = localStorage.getItem('expense_tracker_notification_prefs');
    if (saved) prefs = { ...prefs, ...JSON.parse(saved) };
  } catch (e) {}

  const dynamicNotifications = [];

  // Notification 1: Budget setting prompt if budget is 0
  if (budget === 0) {
    dynamicNotifications.push({
      id: 'set-budget',
      title: 'Set Monthly Budget',
      description: 'You have not set a monthly spending limit. Setting a target enables budget pace tracking and spending warnings.',
      time: 'Now',
      type: 'warning',
      icon: AlertTriangle
    });
  } else {
    // Notification 2: Budget threshold alerts based on user preferences
    if (percentSpent >= 100 && prefs.notify100) {
      dynamicNotifications.push({
        id: 'budget-exceeded',
        title: 'Monthly Budget Limit Exceeded',
        description: `You have spent ${formatCurrency(totalSpent)} (${percentSpent}%), which is ${formatCurrency(totalSpent - budget)} over your target limit.`,
        time: 'Critical Alert',
        type: 'warning',
        icon: AlertTriangle
      });
    } else if (percentSpent >= 80 && prefs.notify80) {
      dynamicNotifications.push({
        id: 'budget-warning',
        title: 'Spending Approaching 80% Limit',
        description: `You have spent ${formatCurrency(totalSpent)} (${percentSpent}%) of your ${formatCurrency(budget)} monthly budget.`,
        time: 'Warning Alert',
        type: 'warning',
        icon: AlertTriangle
      });
    } else if (percentSpent < 80) {
      dynamicNotifications.push({
        id: 'budget-pace',
        title: 'Monthly Budget On Track',
        description: `You have spent ${formatCurrency(totalSpent)} (${percentSpent}%) of your ${formatCurrency(budget)} monthly budget. Spending pace is healthy.`,
        time: 'Pace Status',
        type: 'success',
        icon: CheckCircle
      });
    }
  }

  // Notification 3: Cloud Vault Sync Status
  if (prefs.notifySync) {
    dynamicNotifications.push({
      id: 'vault-active',
      title: 'Cloud Vault Synchronized',
      description: 'Your expense records are encrypted and isolated in your private cloud vault with offline caching enabled.',
      time: 'Active Vault',
      type: 'info',
      icon: ShieldCheck
    });
  }

  const handleMarkAllRead = () => {
    setCleared(true);
    if (onClearUnread) onClearUnread();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1A172B] rounded-3xl shadow-2xl p-5 z-10 space-y-4 border border-slate-100 dark:border-white/10 animate-scale-in">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#6C47FF] dark:text-[#8B5CF6]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            {!cleared && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#6C47FF] dark:text-[#A78BFA] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck size={13} />
                <span>Mark read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {cleared ? (
            <div className="py-8 text-center space-y-1.5">
              <CheckCircle size={28} className="mx-auto text-emerald-500" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">All caught up!</p>
              <p className="text-[11px] text-slate-400">No unread notifications</p>
            </div>
          ) : (
            dynamicNotifications.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        size={15}
                        className={
                          n.type === 'success'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : n.type === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[#6C47FF] dark:text-[#8B5CF6]'
                        }
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                    {n.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
