import React from 'react';
import { Home, ReceiptText, BarChart2, MoreHorizontal } from 'lucide-react';

export default function Navbar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'settings', label: 'More', icon: MoreHorizontal }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#16132A]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 max-w-lg mx-auto shadow-lg shadow-purple-950/5 lg:hidden transition-colors">
      <div className="flex items-center justify-around py-2.5 px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all group ${
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
              <span className={`text-[11px] mt-0.5 tracking-tight transition-all ${
                isActive ? 'font-bold text-[#6C47FF] dark:text-[#A78BFA]' : 'font-medium text-slate-500 dark:text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
