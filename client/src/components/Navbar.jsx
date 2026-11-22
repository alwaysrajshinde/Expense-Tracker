import React from 'react';
import { Home, ReceiptText, Plus, BarChart2, MoreHorizontal } from 'lucide-react';

export default function Navbar({ activeTab, onTabChange, onOpenAddExpense }) {
  const leftTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText }
  ];

  const rightTabs = [
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'settings', label: 'More', icon: MoreHorizontal }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#16132A]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 max-w-lg mx-auto shadow-xl shadow-purple-950/10 lg:hidden transition-colors pb-safe">
      <div className="flex items-center justify-between py-2 px-3 relative">
        {/* Left Tabs */}
        <div className="flex items-center justify-around flex-1">
          {leftTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all group min-h-[46px] ${
                  isActive
                    ? 'text-[#6C47FF] dark:text-[#A78BFA]'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <div className={`relative p-1 rounded-xl transition-all ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] sm:text-[11px] mt-0.5 tracking-tight transition-all truncate max-w-full px-0.5 ${
                  isActive ? 'font-bold text-[#6C47FF] dark:text-[#A78BFA]' : 'font-medium text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Center Elevated Floating Add Button (FAB) */}
        <div className="flex-shrink-0 px-1 sm:px-2 -mt-5">
          <button
            type="button"
            onClick={onOpenAddExpense}
            aria-label="Quick Add Expense"
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#5824dc] via-[#6C47FF] to-[#8B5CF6] text-white flex items-center justify-center shadow-lg shadow-purple-600/40 ring-4 ring-white dark:ring-[#16132A] active:scale-90 hover:scale-105 transition-all cursor-pointer"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Right Tabs */}
        <div className="flex items-center justify-around flex-1">
          {rightTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all group min-h-[46px] ${
                  isActive
                    ? 'text-[#6C47FF] dark:text-[#A78BFA]'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <div className={`relative p-1 rounded-xl transition-all ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] sm:text-[11px] mt-0.5 tracking-tight transition-all truncate max-w-full px-0.5 ${
                  isActive ? 'font-bold text-[#6C47FF] dark:text-[#A78BFA]' : 'font-medium text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
