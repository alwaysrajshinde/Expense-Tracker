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
import OnboardingTourModal from './components/OnboardingTourModal';
import ReleaseNotesModal from './components/ReleaseNotesModal';
import IntelligentImportModal from './components/import/IntelligentImportModal';
import ImportHistoryModal from './components/import/ImportHistoryModal';
import AuthGate from './components/AuthGate';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ShieldCheck, X, WifiOff, RefreshCw } from 'lucide-react';
import * as api from './services/api';
import syncService from './services/syncService';

function MainApp() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, logout, resendVerificationEmail } = useAuth();
  const { showToast } = useToast();

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
  const [settingsSection, setSettingsSection] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [availableMonths, setAvailableMonths] = useState([new Date().toISOString().slice(0, 7)]);
  const [dashboardData, setDashboardData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(true);
  const [isOnboardingTourOpen, setIsOnboardingTourOpen] = useState(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);

  // Live Sync & Network State
  const [syncState, setSyncState] = useState(() => {
    return syncService.getState ? syncService.getState() : { status: 'synced', isOnline: true };
  });

  useEffect(() => {
    if (syncService.subscribe) {
      const unsub = syncService.subscribe((state) => {
        setSyncState(state);
      });
      return () => unsub();
    }
  }, []);

  useEffect(() => {
    const handleSyncRefresh = () => {
      handleRefreshAll();
    };
    window.addEventListener('expense_tracker_synced', handleSyncRefresh);
    return () => window.removeEventListener('expense_tracker_synced', handleSyncRefresh);
  }, [selectedMonth]);

  const [dismissedEmailBanner, setDismissedEmailBanner] = useState(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('et_dismiss_verify_banner') === 'true';
  });

  const handleDismissEmailBanner = () => {
    setDismissedEmailBanner(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('et_dismiss_verify_banner', 'true');
    }
  };

  const [settings, setSettings] = useState({
    monthly_budget: '12000',
    currency: '₹',
    user_name: user?.name || (user?.email ? user.email.split('@')[0] : 'User'),
    user_email: user?.email || ''
  });

  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        user_name: user.name || (user.email ? user.email.split('@')[0] : 'User'),
        user_email: user.email || ''
      }));
    }
  }, [user]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportHistoryOpen, setIsImportHistoryOpen] = useState(false);

  // Native Mobile Back Navigation handler (popstate dismisses open modals before leaving view)
  useEffect(() => {
    const handlePopState = () => {
      if (isAddModalOpen) {
        setIsAddModalOpen(false);
        setEditingTransaction(null);
      } else if (isImportModalOpen) {
        setIsImportModalOpen(false);
      } else if (isImportHistoryOpen) {
        setIsImportHistoryOpen(false);
      } else if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
      } else if (isReleaseNotesOpen) {
        setIsReleaseNotesOpen(false);
      } else if (isOnboardingTourOpen) {
        setIsOnboardingTourOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAddModalOpen, isImportModalOpen, isImportHistoryOpen, isNotificationsOpen, isReleaseNotesOpen, isOnboardingTourOpen]);

  const openAddModal = (tx = null) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({ modal: 'add' }, '');
    }
  };

  const openNotificationsModal = () => {
    setIsNotificationsOpen(true);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({ modal: 'notifications' }, '');
    }
  };

  const openReleaseNotesModal = () => {
    setIsReleaseNotesOpen(true);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({ modal: 'releaseNotes' }, '');
    }
  };

  const handleResendVerification = async () => {
    try {
      if (resendVerificationEmail) {
        await resendVerificationEmail();
      }
      showToast('Verification email sent! Please check your inbox and spam folder.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send verification email', 'error');
    }
  };

  // Load initial data
  const loadInitialData = async () => {
    try {
      const [cats, sett] = await Promise.all([
        api.getCategories(),
        api.getSettings()
      ]);
      setCategories(cats);
      const isRaj = user?.email?.toLowerCase() === 'raaajshinde@gmail.com';
      const rawBudget = sett.monthly_budget !== undefined && sett.monthly_budget !== null && sett.monthly_budget !== '' 
        ? String(sett.monthly_budget) 
        : (isRaj ? '12000' : '12000');
      const updatedSettings = {
        monthly_budget: rawBudget,
        currency: sett.currency || '₹',
        user_name: user?.name || sett.user_name || (user?.email ? user.email.split('@')[0] : 'User'),
        user_email: user?.email || sett.user_email || ''
      };
      setSettings(updatedSettings);

      // First-time onboarding tour check for new accounts
      const tourKey = 'et_tour_completed_' + (user?.uid || user?.email || 'guest');
      const alreadySeen = localStorage.getItem(tourKey) === 'true';
      const budgetZero = (parseFloat(updatedSettings.monthly_budget) || 0) === 0;

      if (!isRaj && !alreadySeen && (budgetZero || !sett.onboarding_completed)) {
        setIsOnboardingTourOpen(true);
      }
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
      if (dash && dash.budget !== undefined && Number(dash.budget) > 0) {
        setSettings(prev => ({
          ...prev,
          monthly_budget: String(dash.budget)
        }));
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
    } else if (tabId === 'import_export') {
      setIsImportModalOpen(true);
    } else if (tabId === 'backup_restore') {
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
      if (data.id) {
        await api.updateTransaction(data.id, data);
        showToast('Expense updated successfully!', 'success');
      } else {
        await api.createTransaction(data);
        showToast('Expense added successfully!', 'success');
      }
    } catch (err) {
      console.warn('Direct API save error, retained in sync queue:', err);
      showToast('Saved offline. Will synchronize when online.', 'info');
    }
    handleRefreshAll();
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await api.deleteTransaction(id);
      showToast('Expense deleted successfully', 'success');
    } catch (err) {
      console.warn('Delete transaction error:', err);
      showToast('Failed to delete expense', 'error');
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
              onOpenAddExpense={() => openAddModal(null)}
              userName={settings.user_name || user?.name || 'User'}
              userEmail={settings.user_email || user?.email || ''}
              onLogout={logout}
              onOpenReleaseNotes={() => setIsReleaseNotesOpen(true)}
            />
          </div>

          {/* Main Desktop Work Area */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
            {/* Real-time Offline / Syncing Banner (Desktop) */}
            {(!syncState.isOnline || syncState.status === 'syncing') && (
              <div className={`px-6 py-2 text-xs font-semibold flex items-center justify-center gap-2 border-b transition-colors ${
                syncState.status === 'syncing'
                  ? 'bg-purple-500/15 border-purple-500/25 text-purple-700 dark:text-purple-300'
                  : 'bg-amber-500/15 border-amber-500/25 text-amber-800 dark:text-amber-300'
              }`}>
                {syncState.status === 'syncing' ? (
                  <>
                    <RefreshCw size={13} className="animate-spin flex-shrink-0" />
                    <span>Syncing offline changes with cloud...</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={13} className="flex-shrink-0" />
                    <span>You're offline · Changes are saved locally and will sync when reconnected</span>
                  </>
                )}
              </div>
            )}

            {/* Unverified Email Warning Banner (Desktop) */}
            {user && !user.emailVerified && !user.isGoogleUser && !dismissedEmailBanner && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-4 transition-colors">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="font-medium truncate">
                    Please verify your email ({user.email}). Email verification helps confirm you own this address, protects your account, and enables password recovery.
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="font-bold text-[#6C47FF] dark:text-[#A78BFA] hover:underline cursor-pointer"
                  >
                    Resend Email
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissEmailBanner}
                    aria-label="Dismiss verification notification"
                    title="Dismiss for this session"
                    className="p-1 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Windows Header Bar (Matching Purple Expense Tracker Dashboard.png) */}
            <div className="px-5 sm:px-7 pt-5">
              <WindowsHeader
                userName={settings.user_name || user?.name || 'User'}
                userEmail={settings.user_email || user?.email || ''}
                selectedMonth={selectedMonth}
                availableMonths={availableMonths}
                onSelectMonth={setSelectedMonth}
                onOpenNotifications={openNotificationsModal}
                onOpenProfile={() => {
                  setActiveTab('settings');
                  setSettingsSection('profile');
                }}
                onLogout={logout}
                hasUnreadNotifications={hasUnreadNotifs}
                onRefresh={handleRefreshAll}
                activeTab={activeTab}
                authProvider={user?.providerId || 'password'}
                emailVerified={user?.emailVerified ?? true}
                onResendVerification={handleResendVerification}
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
                  onOpenAddExpense={() => openAddModal(null)}
                  onQuickAddExpense={handleSaveTransaction}
                  onViewAllCategories={() => {
                    setActiveTab('settings');
                    setSettingsSection('categories');
                  }}
                  onViewAllTransactions={() => setActiveTab('transactions')}
                  onSetBudget={() => {
                    setActiveTab('settings');
                    setSettingsSection('budget');
                  }}
                  formatCurrency={formatCurrency}
                  onSelectMonth={setSelectedMonth}
                />
              )}

              {activeTab === 'transactions' && (
                <Transactions
                  selectedMonth={selectedMonth}
                  categories={categories}
                  availableMonths={availableMonths}
                  onEditTransaction={(tx) => openAddModal(tx)}
                  onDeleteTransaction={handleDeleteTransaction}
                  formatCurrency={formatCurrency}
                  onSelectMonth={setSelectedMonth}
                  onOpenImport={() => setIsImportModalOpen(true)}
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
                  isDesktopScreen={true}
                  selectedMonth={selectedMonth}
                  availableMonths={availableMonths}
                  onLogout={logout}
                  onOpenTour={() => setIsOnboardingTourOpen(true)}
                  onOpenReleaseNotes={openReleaseNotesModal}
                  onUpdateSettings={async (data) => {
                    const updated = await api.updateSettings(data);
                    setSettings(prev => ({ ...prev, ...updated }));
                    showToast('Settings saved successfully', 'success');
                  }}
                  onUpdateBudget={async (month, budget) => {
                    await api.updateBudget(month, budget);
                    loadMonthData(selectedMonth);
                    showToast(`Monthly budget set to ${formatCurrency(budget)}`, 'success');
                  }}
                  onAddCategory={async (cat) => {
                    await api.createCategory(cat);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    showToast(`Category "${cat.name}" added successfully`, 'success');
                  }}
                  onUpdateCategory={async (id, data) => {
                    await api.updateCategory(id, data);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    showToast(`Category updated successfully`, 'success');
                  }}
                  onArchiveCategory={async (id) => {
                    await api.archiveCategory(id);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    showToast('Category archived', 'info');
                  }}
                  onRestoreCategory={async (id) => {
                    await api.restoreCategory(id);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    showToast('Category restored', 'success');
                  }}
                  onReassignCategory={async (oldCatName, newCatName, categoryIdToDelete) => {
                    const reassigned = await api.reassignCategoryTransactions(oldCatName, newCatName);
                    if (categoryIdToDelete) {
                      await api.deleteCategory(categoryIdToDelete);
                    }
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    handleRefreshAll();
                    showToast(`Reassigned ${reassigned} transactions to "${newCatName}" and removed category`, 'success');
                  }}
                  onDeleteCategory={async (id) => {
                    await api.deleteCategory(id);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    showToast('Category deleted', 'info');
                  }}
                  onImportFile={api.importExcelOrCsv}
                  onRestoreBackup={api.restoreBackup}
                  onRefreshAll={handleRefreshAll}
                  onOpenImport={() => setIsImportModalOpen(true)}
                  onOpenImportHistory={() => setIsImportHistoryOpen(true)}
                  onOpenNotifications={() => setIsNotificationsOpen(true)}
                  hasUnreadNotifs={hasUnreadNotifs}
                  formatCurrency={formatCurrency}
                  selectedMonth={selectedMonth}
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
          {/* Real-time Offline / Syncing Banner (Mobile) */}
          {(!syncState.isOnline || syncState.status === 'syncing') && (
            <div className={`px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 border-b transition-colors ${
              syncState.status === 'syncing'
                ? 'bg-purple-500/15 border-purple-500/25 text-purple-700 dark:text-purple-300'
                : 'bg-amber-500/15 border-amber-500/25 text-amber-800 dark:text-amber-300'
            }`}>
              {syncState.status === 'syncing' ? (
                <>
                  <RefreshCw size={12} className="animate-spin flex-shrink-0" />
                  <span>Syncing offline changes with cloud...</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} className="flex-shrink-0" />
                  <span>You're offline · Changes saved locally</span>
                </>
              )}
            </div>
          )}

          {/* Unverified Email Warning Banner (Mobile) */}
          {user && !user.emailVerified && !user.isGoogleUser && !dismissedEmailBanner && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2 transition-colors">
              <div className="flex-1 min-w-0 pr-1">
                <span className="font-semibold block truncate">Please verify your email ({user.email})</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400/90 line-clamp-1">Protects your account &amp; enables password recovery</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="font-bold text-[#6C47FF] dark:text-[#A78BFA] hover:underline cursor-pointer text-[11px]"
                >
                  Resend
                </button>
                <button
                  type="button"
                  onClick={handleDismissEmailBanner}
                  aria-label="Dismiss verification notification"
                  title="Dismiss for this session"
                  className="p-1 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Android Mobile Header */}
          <Header
            userName={settings.user_name || user?.name || 'User'}
            userEmail={settings.user_email || user?.email || ''}
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            onSelectMonth={setSelectedMonth}
            onOpenNotifications={openNotificationsModal}
            onOpenProfile={() => {
              setActiveTab('settings');
              setSettingsSection('profile');
            }}
            onLogout={logout}
            hasUnreadNotifications={hasUnreadNotifs}
            activeTab={activeTab}
            authProvider={user?.providerId || 'password'}
            emailVerified={user?.emailVerified ?? true}
            onResendVerification={handleResendVerification}
          />

          {/* Android Mobile Main Tabs */}
          <main className="flex-1 pb-20">
            {activeTab === 'home' && (
              <AndroidHome
                dashboardData={dashboardData}
                onOpenAddExpense={() => openAddModal(null)}
                onViewAllCategories={() => {
                  setActiveTab('settings');
                  setSettingsSection('categories');
                }}
                onViewAllTransactions={() => setActiveTab('transactions')}
                onSetBudget={() => {
                  setActiveTab('settings');
                  setSettingsSection('budget');
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
                  onEditTransaction={(tx) => openAddModal(tx)}
                  onDeleteTransaction={handleDeleteTransaction}
                  formatCurrency={formatCurrency}
                  onSelectMonth={setSelectedMonth}
                  onOpenImport={() => setIsImportModalOpen(true)}
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
                  isDesktopScreen={false}
                  selectedMonth={selectedMonth}
                  availableMonths={availableMonths}
                  onLogout={logout}
                  onOpenTour={() => setIsOnboardingTourOpen(true)}
                  onOpenReleaseNotes={openReleaseNotesModal}
                  onUpdateSettings={async (data) => {
                    const updated = await api.updateSettings(data);
                    setSettings(prev => ({ ...prev, ...updated }));
                    showToast('Settings saved successfully', 'success');
                  }}
                  onUpdateBudget={async (month, budget) => {
                    await api.updateBudget(month, budget);
                    loadMonthData(selectedMonth);
                    showToast(`Monthly budget set to ${formatCurrency(budget)}`, 'success');
                  }}
                  onAddCategory={async (cat) => {
                    await api.createCategory(cat);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    showToast(`Category "${cat.name}" added successfully`, 'success');
                  }}
                  onUpdateCategory={async (id, data) => {
                    await api.updateCategory(id, data);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    showToast(`Category updated successfully`, 'success');
                  }}
                  onArchiveCategory={async (id) => {
                    await api.archiveCategory(id);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    showToast('Category archived', 'info');
                  }}
                  onRestoreCategory={async (id) => {
                    await api.restoreCategory(id);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    showToast('Category restored', 'success');
                  }}
                  onReassignCategory={async (oldCatName, newCatName, categoryIdToDelete) => {
                    const reassigned = await api.reassignCategoryTransactions(oldCatName, newCatName);
                    if (categoryIdToDelete) {
                      await api.deleteCategory(categoryIdToDelete);
                    }
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    handleRefreshAll();
                    showToast(`Reassigned ${reassigned} transactions to "${newCatName}" and removed category`, 'success');
                  }}
                  onDeleteCategory={async (id) => {
                    await api.deleteCategory(id);
                    const updatedCats = await api.getCategories();
                    setCategories(updatedCats);
                    showToast('Category deleted', 'info');
                  }}
                  onImportFile={api.importExcelOrCsv}
                  onRestoreBackup={api.restoreBackup}
                  onRefreshAll={handleRefreshAll}
                  onOpenImport={() => setIsImportModalOpen(true)}
                  onOpenImportHistory={() => setIsImportHistoryOpen(true)}
                  onOpenNotifications={() => setIsNotificationsOpen(true)}
                  hasUnreadNotifs={hasUnreadNotifs}
                  formatCurrency={formatCurrency}
                  selectedMonth={selectedMonth}
                />
              </div>
            )}
          </main>

          {/* Android Mobile Bottom Navigation Bar with Center FAB */}
          <Navbar
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (tab === 'settings') {
                // Clear any deep-linked initial section so general More page opens without forcing budget modal
                setSettingsSection(null);
              }
              setActiveTab(tab);
            }}
            onOpenAddExpense={() => openAddModal(null)}
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
        initialDate={dashboardData?.today_date || new Date().toISOString().slice(0, 10)}
        onSaveAnotherSuccess={() => showToast('Expense saved! Ready for next.', 'success')}
      />

      {/* Global Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        dashboardData={dashboardData}
        formatCurrency={formatCurrency}
        onClearUnread={() => setHasUnreadNotifs(false)}
      />

      {/* Release Notes Modal (v1.1.0) */}
      <ReleaseNotesModal
        isOpen={isReleaseNotesOpen}
        onClose={() => setIsReleaseNotesOpen(false)}
      />

      {/* First-Time User Guided Tour & Onboarding Modal */}
      <OnboardingTourModal
        isOpen={isOnboardingTourOpen}
        onClose={() => {
          setIsOnboardingTourOpen(false);
          const tourKey = 'et_tour_completed_' + (user?.uid || user?.email || 'guest');
          localStorage.setItem(tourKey, 'true');
        }}
        onSaveBudget={async (numericBudget) => {
          await api.updateBudget(selectedMonth, numericBudget);
          setSettings(prev => ({ ...prev, monthly_budget: String(numericBudget) }));
          const tourKey = 'et_tour_completed_' + (user?.uid || user?.email || 'guest');
          localStorage.setItem(tourKey, 'true');
          loadMonthData(selectedMonth);
          showToast(`Monthly budget set to ${formatCurrency(numericBudget)}!`, 'success');
        }}
        currency={settings.currency || '₹'}
        userName={settings.user_name || 'User'}
      />

      {/* Intelligent Expense Import Modal (Excel, CSV, Bank Statements) */}
      <IntelligentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        userCategories={categories}
        formatCurrency={formatCurrency}
        onImportComplete={(result) => {
          if (result && result.affectedMonths && result.affectedMonths.length > 0) {
            setAvailableMonths(prev => {
              const combined = Array.from(new Set([...prev, ...result.affectedMonths]));
              return combined.sort().reverse();
            });
            if (result.latestMonth) {
              setSelectedMonth(result.latestMonth);
            }
          }
          handleRefreshAll();
          showToast(`Imported ${result?.importedCount || 'transactions'} successfully!`, 'success');
        }}
      />

      {/* Import History & 1-Click Safe Undo Modal */}
      <ImportHistoryModal
        isOpen={isImportHistoryOpen}
        onClose={() => setIsImportHistoryOpen(false)}
        onUndoComplete={() => {
          handleRefreshAll();
          showToast('Import batch reverted successfully!', 'info');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <ToastProvider>
            <MainApp />
          </ToastProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
