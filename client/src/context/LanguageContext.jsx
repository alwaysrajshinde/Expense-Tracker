import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = [
  { id: 'en', code: 'en', label: 'English', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { id: 'hi', code: 'hi', label: 'Hindi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { id: 'mr', code: 'mr', label: 'Marathi', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { id: 'es', code: 'es', label: 'Spanish', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' }
];

const TRANSLATIONS = {
  en: {
    // Navigation & Tabs
    home: 'Home',
    transactions: 'Transactions',
    reports: 'Reports',
    more: 'More',
    settings: 'Settings',
    profile: 'Profile',
    notifications: 'Notifications',

    // Greetings
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    personalFinance: 'Personal Finance',
    accountSettings: 'Account Settings',

    // Dashboard & Budget
    monthlyBudget: 'Monthly Budget',
    spent: 'Spent',
    remaining: 'Remaining',
    noBudgetSet: 'No budget set',
    setMonthlyBudget: 'Set Monthly Budget',
    editBudget: 'Edit Budget',
    today: 'Today',
    thisWeek: 'This Week',
    topCategories: 'Top Categories',
    recentActivity: 'Recent Activity',
    seeAll: 'See All',
    noTransactionsYet: 'No transactions recorded yet this month.',

    // Add / Edit Expense
    addExpense: 'Add Expense',
    editExpense: 'Edit Expense',
    addIncome: 'Add Income / Refund',
    expense: 'Expense',
    incomeRefund: 'Income / Refund',
    amount: 'Amount',
    category: 'Category',
    paymentMode: 'Payment Mode',
    date: 'Date',
    description: 'Description (Optional)',
    saveExpense: 'Save Expense',
    saveIncome: 'Save Income / Refund',
    addAnother: 'Add Another',
    yesterday: 'Yesterday',
    quickCategories: 'Quick Categories',
    moreCategories: 'More Categories',
    notesPlaceholder: 'e.g. Lunch with colleagues',
    allCategoriesTitle: 'All Categories',

    // Transactions page
    expenseRecords: 'Expense Records & History',
    entriesFound: 'entries found',
    totalNetSpend: 'Total Net Spend',
    allMonths: 'All Months',
    allCategories: 'All Categories',
    allModes: 'All Modes',
    import: 'Import',
    exportExcel: 'Export Excel',
    jsonBackup: 'JSON Backup',
    noTransactions: 'No transactions found matching your filters.',
    searchPlaceholder: 'Search by description, category, date, or amount...',

    // More & Account
    manageFinances: 'Manage Finances',
    personalization: 'Personalization',
    appearanceTheme: 'Appearance & Theme',
    language: 'Language',
    selectLanguage: 'Select Language',
    dataManagement: 'Data Management',
    importTransactions: 'Import Transactions',
    exportTransactions: 'Export Transactions',
    exportGoogleSheets: 'Export to Google Sheets',
    accountSupport: 'Account & Support',
    security: 'Security',
    helpSupport: 'Help & Support',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    logOut: 'Log Out',
    verified: 'Verified',
    unverified: 'Unverified',
    tapToCheck: 'Tap to check',
    checkVerification: 'Check Verification Status',
    resendVerification: 'Resend Verification Email',
    synced: 'Synced',
    syncing: 'Syncing',
    offline: 'Offline',

    // Reports
    spendingAnalytics: 'Spending & Expense Analytics',
    monthlyReport: 'Monthly Report',
    yearlySummary: 'Yearly Summary',
    overview: 'Overview',
    categories: 'Categories',
    paymentModes: 'Payment Modes',
    previousMonth: 'Previous Month',
    nextMonth: 'Next Month',
    totalSpent: 'Total Spend',
    incomeCredits: 'Income & Credits',
    netCashflow: 'Net Cashflow',
    remainingBudget: 'Remaining Budget',
    spendingByCategory: 'Spending by Category',
    monthlySpendingTrend: 'Monthly Spending Trend',
    last6Months: 'Last 6 Months',
    noSpendingData: 'No spending data for this month.',
    annualSpend: 'Annual Spend Distribution',

    // Actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    markAllRead: 'Mark All as Read',
    comingSoon: 'Coming Soon',
    upcoming: 'Upcoming'
  },
  hi: {
    home: 'होम',
    transactions: 'लेन-देन',
    reports: 'रिपोर्ट्स',
    more: 'अधिक',
    settings: 'सेटिंग्स',
    profile: 'प्रोफ़ाइल',
    notifications: 'सूचनाएं',

    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    personalFinance: 'व्यक्तिगत वित्त',
    accountSettings: 'खाता सेटिंग्स',

    monthlyBudget: 'मासिक बजट',
    spent: 'खर्च',
    remaining: 'शेष',
    noBudgetSet: 'बजट सेट नहीं है',
    setMonthlyBudget: 'मासिक बजट सेट करें',
    editBudget: 'बजट बदलें',
    today: 'आज',
    thisWeek: 'इस सप्ताह',
    topCategories: 'प्रमुख श्रेणियां',
    recentActivity: 'हाल की गतिविधि',
    seeAll: 'सभी देखें',
    noTransactionsYet: 'इस महीने कोई लेन-देन दर्ज नहीं है।',

    addExpense: 'खर्च जोड़ें',
    editExpense: 'खर्च संपादित करें',
    addIncome: 'आय / धनवापसी जोड़ें',
    expense: 'खर्च',
    incomeRefund: 'आय / धनवापसी',
    amount: 'राशि',
    category: 'श्रेणी',
    paymentMode: 'भुगतान का तरीका',
    date: 'तारीख',
    description: 'विवरण (वैकल्पिक)',
    saveExpense: 'खर्च सहेजें',
    saveIncome: 'आय सहेजें',
    addAnother: 'एक और जोड़ें',
    yesterday: 'कल',
    quickCategories: 'त्वरित श्रेणियां',
    moreCategories: 'अधिक श्रेणियां',
    notesPlaceholder: 'उदा. दोपहर का भोजन',
    allCategoriesTitle: 'सभी श्रेणियां',

    expenseRecords: 'खर्च रिकॉर्ड और इतिहास',
    entriesFound: 'प्रविष्टियां मिलीं',
    totalNetSpend: 'कुल शुद्ध खर्च',
    allMonths: 'सभी महीने',
    allCategories: 'सभी श्रेणियां',
    allModes: 'सभी माध्यम',
    import: 'आयात करें',
    exportExcel: 'Excel निर्यात',
    jsonBackup: 'JSON बैकअप',
    noTransactions: 'कोई लेन-देन नहीं मिला।',
    searchPlaceholder: 'विवरण, श्रेणी, तारीख या राशि द्वारा खोजें...',

    manageFinances: 'वित्तीय प्रबंधन',
    personalization: 'निजीकरण',
    appearanceTheme: 'दिखावट और थीम',
    language: 'भाषा',
    selectLanguage: 'भाषा चुनें',
    dataManagement: 'डेटा प्रबंधन',
    importTransactions: 'लेन-देन आयात करें',
    exportTransactions: 'लेन-देन निर्यात करें',
    exportGoogleSheets: 'Google Sheets में निर्यात करें',
    accountSupport: 'खाता और सहायता',
    security: 'सुरक्षा',
    helpSupport: 'मदद और सहायता',
    privacyPolicy: 'गोपनीयता नीति',
    termsOfService: 'सेवा की शर्तें',
    logOut: 'लॉग आउट',
    verified: 'सत्यापित',
    unverified: 'असत्यापित',
    tapToCheck: 'जांचने के लिए टैप करें',
    checkVerification: 'सत्यापन स्थिति जांचें',
    resendVerification: 'सत्यापन ईमेल पुनः भेजें',
    synced: 'सिंक हो गया',
    syncing: 'सिंक हो रहा है',
    offline: 'ऑफ़लाइन',

    spendingAnalytics: 'खर्च विश्लेषण',
    monthlyReport: 'मासिक रिपोर्ट',
    yearlySummary: 'वार्षिक सारांश',
    overview: 'अवलोकन',
    categories: 'श्रेणियां',
    paymentModes: 'भुगतान के तरीके',
    previousMonth: 'पिछला महीना',
    nextMonth: 'अगला महीना',
    totalSpent: 'कुल खर्च',
    incomeCredits: 'आय और क्रेडिट',
    netCashflow: 'शुद्ध नकदी प्रवाह',
    remainingBudget: 'शेष बजट',
    spendingByCategory: 'श्रेणी अनुसार खर्च',
    monthlySpendingTrend: 'मासिक खर्च का रुझान',
    last6Months: 'पिछले 6 महीने',
    noSpendingData: 'इस महीने के लिए कोई खर्च डेटा नहीं है।',
    annualSpend: 'वार्षिक खर्च वितरण',

    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
    comingSoon: 'जल्द आ रहा है',
    upcoming: 'आगामी'
  },
  mr: {
    home: 'होम',
    transactions: 'व्यवहार',
    reports: 'अहवाल',
    more: 'अधिक',
    settings: 'सेटिंग्ज',
    profile: 'प्रोफाइल',
    notifications: 'सूचना',

    goodMorning: 'शुभ सकाळ',
    goodAfternoon: 'शुभ दुपार',
    goodEvening: 'शुभ संध्याकाळ',
    personalFinance: 'वैयक्तिक वित्त',
    accountSettings: 'खाते सेटिंग्ज',

    monthlyBudget: 'मासिक बजेट',
    spent: 'खर्च',
    remaining: 'शिल्लक',
    noBudgetSet: 'बजेट सेट नाही',
    setMonthlyBudget: 'मासिक बजेट सेट करा',
    editBudget: 'बजेट बदला',
    today: 'आज',
    thisWeek: 'या आठवड्यात',
    topCategories: 'प्रमुख वर्गवारी',
    recentActivity: 'अलीकडील हालचाली',
    seeAll: 'सर्व पहा',
    noTransactionsYet: 'या महिन्यात अद्याप कोणतेही व्यवहार नोंदवले नाहीत.',

    addExpense: 'खर्च जोडा',
    editExpense: 'खर्च संपादित करा',
    addIncome: 'उत्पन्न / परतावा जोडा',
    expense: 'खर्च',
    incomeRefund: 'उत्पन्न / परतावा',
    amount: 'रक्कम',
    category: 'वर्गवारी',
    paymentMode: 'पेमेंट मोड',
    date: 'तारीख',
    description: 'तपशील (पर्यायी)',
    saveExpense: 'खर्च जतन करा',
    saveIncome: 'उत्पन्न जतन करा',
    addAnother: 'आणखी जोडा',
    yesterday: 'काल',
    quickCategories: 'त्वरित वर्गवारी',
    moreCategories: 'अधिक वर्गवारी',
    notesPlaceholder: 'उदा. दुपारचे जेवण',
    allCategoriesTitle: 'सर्व वर्गवारी',

    expenseRecords: 'खर्च नोंदी व इतिहास',
    entriesFound: 'नोंदी आढळल्या',
    totalNetSpend: 'एकूण निव्वळ खर्च',
    allMonths: 'सर्व महिने',
    allCategories: 'सर्व वर्गवारी',
    allModes: 'सर्व मोड्स',
    import: 'आयात करा',
    exportExcel: 'Excel निर्यात',
    jsonBackup: 'JSON बॅकअप',
    noTransactions: 'कोणतेही व्यवहार आढळले नाहीत.',
    searchPlaceholder: 'तपशील, वर्गवारी, तारीख किंवा रकमेनुसार शोधा...',

    manageFinances: 'आर्थिक व्यवस्थापन',
    personalization: 'वैयक्तिकरण',
    appearanceTheme: 'दिसणे आणि थीम',
    language: 'भाषा',
    selectLanguage: 'भाषा निवडा',
    dataManagement: 'डेटा व्यवस्थापन',
    importTransactions: 'व्यवहार आयात करा',
    exportTransactions: 'व्यवहार निर्यात करा',
    exportGoogleSheets: 'Google Sheets मध्ये निर्यात करा',
    accountSupport: 'खाते आणि मदत',
    security: 'सुरक्षा',
    helpSupport: 'मदत आणि सहाय्य',
    privacyPolicy: 'गोपनीयता धोरण',
    termsOfService: 'सेवा अटी',
    logOut: 'बाहेर पडा',
    verified: 'प्रमाणित',
    unverified: 'अप्रमाणित',
    tapToCheck: 'तपासण्यासाठी टॅप करा',
    checkVerification: 'सत्यापन स्थिती तपासा',
    resendVerification: 'पुन्हा ईमेल पाठवा',
    synced: 'सिंक झाले',
    syncing: 'सिंक होत आहे',
    offline: 'ऑफलाइन',

    spendingAnalytics: 'खर्च विश्लेषण',
    monthlyReport: 'मासिक अहवाल',
    yearlySummary: 'वार्षिक सारांश',
    overview: 'आढावा',
    categories: 'वर्गवारी',
    paymentModes: 'पेमेंट मोड्स',
    previousMonth: 'मागील महिना',
    nextMonth: 'पुढील महिना',
    totalSpent: 'एकूण खर्च',
    incomeCredits: 'उत्पन्न आणि जमा',
    netCashflow: 'निव्वळ रोख प्रवाह',
    remainingBudget: 'उरलेले बजेट',
    spendingByCategory: 'वर्गवारीनुसार खर्च',
    monthlySpendingTrend: 'मासिक खर्चाचा कल',
    last6Months: 'मागील ६ महिने',
    noSpendingData: 'या महिन्यासाठी खर्चाचा डेटा नाही.',
    annualSpend: 'वार्षिक खर्च वितरण',

    save: 'जतन करा',
    cancel: 'रद्द करा',
    delete: 'हटवा',
    markAllRead: 'सर्व वाचलेले म्हणून चिन्हांकित करा',
    comingSoon: 'लवकरच येत आहे',
    upcoming: 'आगामी'
  },
  es: {
    home: 'Inicio',
    transactions: 'Transacciones',
    reports: 'Informes',
    more: 'Más',
    settings: 'Ajustes',
    profile: 'Perfil',
    notifications: 'Notificaciones',

    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    personalFinance: 'Finanzas Personales',
    accountSettings: 'Configuración de Cuenta',

    monthlyBudget: 'Presupuesto Mensual',
    spent: 'Gastado',
    remaining: 'Restante',
    noBudgetSet: 'Sin presupuesto',
    setMonthlyBudget: 'Establecer Presupuesto',
    editBudget: 'Editar Presupuesto',
    today: 'Hoy',
    thisWeek: 'Esta Semana',
    topCategories: 'Categorías Principales',
    recentActivity: 'Actividad Reciente',
    seeAll: 'Ver Todo',
    noTransactionsYet: 'No hay transacciones registradas este mes.',

    addExpense: 'Añadir Gasto',
    editExpense: 'Editar Gasto',
    addIncome: 'Añadir Ingreso / Reembolso',
    expense: 'Gasto',
    incomeRefund: 'Ingreso / Reembolso',
    amount: 'Importe',
    category: 'Categoría',
    paymentMode: 'Método de Pago',
    date: 'Fecha',
    description: 'Descripción (Opcional)',
    saveExpense: 'Guardar Gasto',
    saveIncome: 'Guardar Ingreso',
    addAnother: 'Añadir Otro',
    yesterday: 'Ayer',
    quickCategories: 'Categorías Rápidas',
    moreCategories: 'Más Categorías',
    notesPlaceholder: 'ej. Almuerzo de trabajo',
    allCategoriesTitle: 'Todas las Categorías',

    expenseRecords: 'Registros e Historial de Gastos',
    entriesFound: 'entradas encontradas',
    totalNetSpend: 'Gasto Neto Total',
    allMonths: 'Todos los Meses',
    allCategories: 'Todas las Categorías',
    allModes: 'Todos los Métodos',
    import: 'Importar',
    exportExcel: 'Exportar Excel',
    jsonBackup: 'Copia JSON',
    noTransactions: 'No se encontraron transacciones.',
    searchPlaceholder: 'Buscar por descripción, categoría, fecha o importe...',

    manageFinances: 'Gestión Financiera',
    personalization: 'Personalización',
    appearanceTheme: 'Apariencia y Tema',
    language: 'Idioma',
    selectLanguage: 'Seleccionar Idioma',
    dataManagement: 'Gestión de Datos',
    importTransactions: 'Importar Transacciones',
    exportTransactions: 'Exportar Transacciones',
    exportGoogleSheets: 'Exportar a Google Sheets',
    accountSupport: 'Cuenta y Soporte',
    security: 'Seguridad',
    helpSupport: 'Ayuda y Soporte',
    privacyPolicy: 'Política de Privacidad',
    termsOfService: 'Términos de Servicio',
    logOut: 'Cerrar Sesión',
    verified: 'Verificado',
    unverified: 'No verificado',
    tapToCheck: 'Toca para verificar',
    checkVerification: 'Comprobar Estado de Verificación',
    resendVerification: 'Reenviar Email de Verificación',
    synced: 'Sincronizado',
    syncing: 'Sincronizando',
    offline: 'Sin conexión',

    spendingAnalytics: 'Análisis de Gastos',
    monthlyReport: 'Informe Mensual',
    yearlySummary: 'Resumen Anual',
    overview: 'Resumen',
    categories: 'Categorías',
    paymentModes: 'Métodos de Pago',
    previousMonth: 'Mes Anterior',
    nextMonth: 'Mes Siguiente',
    totalSpent: 'Gasto Total',
    incomeCredits: 'Ingresos y Créditos',
    netCashflow: 'Flujo Neto de Caja',
    remainingBudget: 'Presupuesto Restante',
    spendingByCategory: 'Gasto por Categoría',
    monthlySpendingTrend: 'Tendencia Mensual de Gastos',
    last6Months: 'Últimos 6 Meses',
    noSpendingData: 'No hay datos de gastos para este mes.',
    annualSpend: 'Distribución Anual de Gastos',

    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    markAllRead: 'Marcar todo como leído',
    comingSoon: 'Próximamente',
    upcoming: 'En desarrollo'
  }
};

const STORAGE_KEY = 'expense_tracker_user_language';

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && TRANSLATIONS[saved]) return saved;
    } catch (_) {}
    return 'en';
  });

  const changeLanguage = (langCode) => {
    if (TRANSLATIONS[langCode]) {
      setCurrentLanguage(langCode);
      try {
        localStorage.setItem(STORAGE_KEY, langCode);
      } catch (_) {}
    }
  };

  const t = (key, fallback = '') => {
    const langDict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        language: currentLanguage,
        changeLanguage,
        setLanguage: changeLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        availableLanguages: SUPPORTED_LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      currentLanguage: 'en',
      language: 'en',
      changeLanguage: () => {},
      setLanguage: () => {},
      t: (key, fallback = '') => fallback || key,
      supportedLanguages: SUPPORTED_LANGUAGES,
      availableLanguages: SUPPORTED_LANGUAGES
    };
  }
  return context;
}
