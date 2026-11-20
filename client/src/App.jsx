import React, { useState, useEffect } from 'react';
import WindowsSidebar from './components/WindowsSidebar';
import WindowsHeader from './components/WindowsHeader';
import Header from './components/Header';
import Navbar from './components/Navbar';
import AndroidHome from './pages/AndroidHome';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AddExpenseModal from './components/AddExpenseModal';
import NotificationsModal from './components/NotificationsModal';
import AuthGate from './components/AuthGate';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import syncService from './services/syncService';
import * as api from './services/api';

function MainApp() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();

  // Screen size detection for responsive platform presentation
  const [isDesktopScreen, setIsDesktopScreen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState('home');
  const [settingsSection, setSettingsSection] = useState('budget');
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [availableMonths, setAvailableMonths] = useState(['2026-11']);
  const [dashboardData, setDashboardData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({
    monthly_budget: '12000',
    currency: '₹',
    user_name: user?.name || 'Raj Shinde',
    user_email: user?.email || 'raaajshinde@gmail.com'
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Load initial data
  const loadInitialData = async () => {
    try {
      const [cats, sett] = await Promise.all([
        api.getCategories(),
        api.getSettings()
      ]);
      setCategories(cats);
      setSettings(prev => ({ 
        ...prev, 
        ...sett,
        user_name: user?.name || sett.user_name || 'Raj Shinde',
        user_email: user?.email || sett.user_email || 'raaajshinde@gmail.com'
      }));
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  // Load monthly dashboard & reports data
  const loadMonthData = async (month) => {
    try {
      const [dash, rep] = await Promise.all([
        api.getDashboard(month),
        api.getReports(month)
      ]);
      setDashboardData(dash);
      setReportsData(rep);
      if (dash.available_months && dash.available_months.length > 0) {
        setAvailableMonths(dash.available_months);
      }
    } catch (err) {
      console.error('Error loading month data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [user]);

  useEffect(() => {
    loadMonthData(selectedMonth);
  }, [selectedMonth]);

  const handleRefreshAll = () => {
    loadInitialData();
    loadMonthData(selectedMonth);
  };

  const handleSidebarTabChange = (tabId) => {
    if (tabId === 'categories') {
      setActiveTab('settings');
      setSettingsSection('categories');
    } else if (tabId === 'budget') {
      setActiveTab('settings');
      setSettingsSection('budget');
    } else if (tabId === 'import_export' || tabId === 'backup_restore') {
      setActiveTab('settings');
      setSettingsSection('data');
    } else if (tabId === 'settings') {
      setActiveTab('settings');
      setSettingsSection('profile');
    } else {
      setActiveTab(tabId);
    }
  };

  // Currency formatter
  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    const formatted = Math.abs(num).toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
    const curr = settings.currency || '₹';
    return num < 0 ? `-${curr}${formatted}` : `${curr}${formatted}`;
  };

  const handleSaveTransaction = async (data) => {
    try {
      // 1. Enqueue for offline resilience and two-way Google Sheets synchronization
      syncService.enqueue(data.id ? 'update' : 'create', data, data.id);

      // 2. Save to active backend
      if (data.id) {
        await api.updateTransaction(data.id, data);
      } else {
        await api.createTransaction(data);
      }
    } catch (err) {
      console.warn('Direct API save error, retained in sync queue:', err);
    }
    handleRefreshAll();
  };

  const handleDeleteTransaction = async (id) => {
    try {
      syncService.enqueue('delete', {}, id);
      await api.deleteTransaction(id);
    } catch (err) {
      console.warn('Direct delete deferred to queue:', err);
    }
    handleRefreshAll();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors flex flex-col font-sans">
      {/* ========================================================
          1. WINDOWS DESKTOP DASHBOARD (>= 1024px)
          Strictly following Purple Expense Tracker Dashboard.png
         ======================================================== */}
      {isDesktopScreen ? (
        <div className="flex-1 flex overflow-hidden h-screen">
          {/* Left Windows Sidebar with 9 navigation items and Raj Shinde profile footer */}
          <div className="flex-shrink-0">
            <WindowsSidebar
              activeTab={activeTab === 'settings' ? settingsSection : activeTab}
              onTabChange={handleSidebarTabChange}
              onOpenAddExpense={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              userName={settings.user_name || 'Raj Shinde'}
              userEmail={settings.user_email || 'raaajshinde@gmail.com'}
              onLogout={logout}
            />
          </div>

          {/* Main Desktop Work Area */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
            {/* Windows Header Bar (Matching Purple Expense Tracker Dashboard.png) */}
            <div className="px-5 sm:px-7 pt-5">
              <WindowsHeader
                userName={settings.user_name || 'Raj Shinde'}
                userEmail={settings.user_email || 'raaajshinde@gmail.com'}
                selectedMonth={selectedMonth}
                availableMonths={availableMonths}
                onSelectMonth={setSelectedMonth}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                onOpenProfile={() => {
                  setActiveTab('settings');
                  setSettingsSection('profile');
                }}
                onLogout={logout}
                hasUnreadNotifications={true}
                onRefresh={handleRefreshAll}
              />
            </div>

            {/* Main Desktop Views */}
            <main className="flex-1 px-5 sm:px-7 py-4 pb-8">
              {activeTab === 'home' && (
                <Home
                  dashboardData={dashboardData}
                  reportsData={reportsData}
                  categories={categories}
                  selectedMonth={selectedMonth}
                  availableMonths={availableMonths}
                  onOpenAddExpense={() => {
                    setEditingTransaction(null);
                    setIsAddModalOpen(true);
                  }}
                  onQuickAddExpense={handleSaveTransaction}
                  onViewAllCategories={() => {
                    setActiveTab('settings');
                    setSettingsSection('categories');
                  }}
                  onViewAllTransactions={() => setActiveTab('transactions')}
                  formatCurrency={formatCurrency}
                  onSelectMonth={setSelectedMonth}
                />
              )}

              {activeTab === 'transactions' && (
                <Transactions
                  selectedMonth={selectedMonth}
                  categories={categories}
                  availableMonths={availableMonths}
                  onEditTransaction={(tx) => {
                    setEditingTransaction(tx);
                    setIsAddModalOpen(true);
                  }}
                  onDeleteTransaction={handleDeleteTransaction}
                  formatCurrency={formatCurrency}
                  onSelectMonth={setSelectedMonth}
                />
              )}

              {activeTab === 'reports' && (
                <Reports
                  reportsData={reportsData}
                  selectedMonth={selectedMonth}
                  availableMonths={availableMonths}
                  onSelectMonth={setSelectedMonth}
                  formatCurrency={formatCurrency}
                />
              )}

              {activeTab === 'settings' && (
                <Settings
                  settings={settings}
                  categories={categories}
                  initialSection={settingsSection}
                  onUpdateSettings={async (data) => {
                    const updated = await api.updateSettings(data);
                    setSettings(prev => ({ ...prev, ...updated }));
                  }}
                  onUpdateBudget={async (month, budget) => {
                    await api.updateBudget(month, budget);
                    loadMonthData(selectedMonth);
                  }}
                  onAddCategory={async (cat) => {
                    await api.createCategory(cat);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                  }}
                  onDeleteCategory={async (id) => {
                    await api.deleteCategory(id);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                  }}
                  onImportFile={api.importExcelOrCsv}
                  onRestoreBackup={api.restoreBackup}
                  onRefreshAll={handleRefreshAll}
                  formatCurrency={formatCurrency}
                  selectedMonth={selectedMonth}
                  onLogout={logout}
                />
              )}
            </main>
          </div>
        </div>
      ) : (
        /* ========================================================
           2. ANDROID MOBILE EDITION (< 1024px)
           Strictly following Modern Purple Expense Tracker UI.png
           ======================================================== */
        <div className="w-full max-w-lg mx-auto min-h-screen bg-[var(--bg-app)] flex flex-col relative transition-colors">
          {/* Android Mobile Header */}
          <Header
            userName={settings.user_name || 'Raj Shinde'}
            userEmail={settings.user_email || 'raaajshinde@gmail.com'}
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            onSelectMonth={setSelectedMonth}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenProfile={() => {
              setActiveTab('settings');
              setSettingsSection('profile');
            }}
            onLogout={logout}
            hasUnreadNotifications={true}
          />

          {/* Android Mobile Main Tabs */}
          <main className="flex-1 pb-16">
            {activeTab === 'home' && (
              <AndroidHome
                dashboardData={dashboardData}
                onOpenAddExpense={() => {
                  setEditingTransaction(null);
                  setIsAddModalOpen(true);
                }}
                onViewAllCategories={() => {
                  setActiveTab('settings');
                  setSettingsSection('categories');
                }}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === 'transactions' && (
              <div className="px-3">
                <Transactions
                  selectedMonth={selectedMonth}
                  categories={categories}
                  availableMonths={availableMonths}
                  onEditTransaction={(tx) => {
                    setEditingTransaction(tx);
                    setIsAddModalOpen(true);
                  }}
                  onDeleteTransaction={handleDeleteTransaction}
                  formatCurrency={formatCurrency}
                  onSelectMonth={setSelectedMonth}
                />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="px-3">
                <Reports
                  reportsData={reportsData}
                  selectedMonth={selectedMonth}
                  availableMonths={availableMonths}
                  onSelectMonth={setSelectedMonth}
                  formatCurrency={formatCurrency}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="px-3">
                <Settings
                  settings={settings}
                  categories={categories}
                  initialSection={settingsSection}
                  onUpdateSettings={async (data) => {
                    const updated = await api.updateSettings(data);
                    setSettings(prev => ({ ...prev, ...updated }));
                  }}
                  onUpdateBudget={async (month, budget) => {
                    await api.updateBudget(month, budget);
                    loadMonthData(selectedMonth);
                  }}
                  onAddCategory={async (cat) => {
                    await api.createCategory(cat);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                  }}
                  onDeleteCategory={async (id) => {
                    await api.deleteCategory(id);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                  }}
                  onImportFile={api.importExcelOrCsv}
                  onRestoreBackup={api.restoreBackup}
                  onRefreshAll={handleRefreshAll}
                  formatCurrency={formatCurrency}
                  selectedMonth={selectedMonth}
                  onLogout={logout}
                />
              </div>
            )}
          </main>

          {/* Android Mobile Bottom Navigation Bar */}
          <Navbar
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      )}

      {/* Global Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        editingTransaction={editingTransaction}
        initialDate={dashboardData?.today_date || '2026-11-20'}
      />

      {/* Global Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        dashboardData={dashboardData}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <MainApp />
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
