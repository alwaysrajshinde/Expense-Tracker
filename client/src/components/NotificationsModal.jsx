import React from 'react';
import { X, Bell, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function NotificationsModal({ isOpen, onClose, dashboardData, formatCurrency }) {
  if (!isOpen) return null;

  const totalSpent = dashboardData?.total_spent || 0;
  const budget = dashboardData?.budget || 12000;
  const percentSpent = dashboardData?.percent_spent || 0;

  const notifications = [
    {
      id: 1,
      title: 'Historical Records Loaded',
      description: '1,198 historical expense records and 67 categories have been loaded successfully from Daily Expense.xlsx into SQLite.',
      time: 'Just now',
      type: 'success',
      icon: CheckCircle
    },
    {
      id: 2,
      title: percentSpent > 90 ? 'Budget Warning' : 'Monthly Budget Tracking',
      description: `You have spent ${formatCurrency(totalSpent)} (${percentSpent}%) of your ${formatCurrency(budget)} budget for this month.`,
      time: 'Today',
      type: percentSpent > 90 ? 'warning' : 'info',
      icon: percentSpent > 90 ? AlertTriangle : Info
    },
    {
      id: 3,
      title: 'Windows Desktop Layout & Theme Active',
      description: 'Full Windows desktop workspace enabled with Light & Dark fintech theme support.',
      time: 'Today',
      type: 'info',
      icon: TrendingUp
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1A172B] rounded-3xl shadow-2xl p-5 z-10 space-y-4 border border-slate-100 dark:border-white/10 animate-scale-in">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#6C47FF] dark:text-[#8B5CF6]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {notifications.map((n) => {
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
          })}
        </div>
      </div>
    </div>
  );
}
