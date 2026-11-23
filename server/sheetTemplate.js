/**
 * Standard Expense Tracker Spreadsheet Template Generator
 * Defines the 4 standard sheets for every newly created user:
 * 1. Expenses: Primary transaction records
 * 2. Dashboard: Monthly budget, spent summary, and KPI formulas
 * 3. Categories: Standard 67 expense categories with icons and colors
 * 4. Payment_Modes: Standard payment methods
 */

const xlsx = require('xlsx');

// Standard 67 categories with icons and colors
const STANDARD_CATEGORIES = [
  // Quick categories
  { name: 'Food', icon: 'Utensils', color: '#6C47FF', is_quick: 1 },
  { name: 'Auto', icon: 'Car', color: '#F59E0B', is_quick: 1 },
  { name: 'Metro', icon: 'Train', color: '#0EA5E9', is_quick: 1 },
  { name: 'Fruits', icon: 'Apple', color: '#EF4444', is_quick: 1 },
  { name: 'Cloths', icon: 'Shirt', color: '#3B82F6', is_quick: 1 },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#A855F7', is_quick: 1 },

  // Food & Dining
  { name: 'Biryani', icon: 'Utensils', color: '#F97316', is_quick: 0 },
  { name: 'Non Veg', icon: 'Drumstick', color: '#EF4444', is_quick: 0 },
  { name: 'Chicken', icon: 'Drumstick', color: '#EA580C', is_quick: 0 },
  { name: 'Mutton', icon: 'Drumstick', color: '#DC2626', is_quick: 0 },
  { name: 'Fish', icon: 'Fish', color: '#0284C7', is_quick: 0 },
  { name: 'Eggs', icon: 'Egg', color: '#F59E0B', is_quick: 0 },
  { name: 'Fast Food', icon: 'Pizza', color: '#F97316', is_quick: 0 },
  { name: 'Office Lunch', icon: 'UtensilsCrossed', color: '#6366F1', is_quick: 0 },
  { name: 'Office Nashta', icon: 'Coffee', color: '#D97706', is_quick: 0 },
  { name: 'Office Tifin', icon: 'Package', color: '#059669', is_quick: 0 },
  { name: 'Office Bottle', icon: 'Droplet', color: '#06B6D4', is_quick: 0 },
  { name: 'Tea', icon: 'Coffee', color: '#B45309', is_quick: 0 },
  { name: 'Coffee Powder', icon: 'Coffee', color: '#78350F', is_quick: 0 },
  { name: 'Cold Drink', icon: 'CupSoda', color: '#06B6D4', is_quick: 0 },
  { name: 'Juice', icon: 'Wine', color: '#EC4899', is_quick: 0 },
  { name: 'Vegitables', icon: 'Carrot', color: '#10B981', is_quick: 0 },
  { name: 'Salad', icon: 'Salad', color: '#22C55E', is_quick: 0 },
  { name: 'Milk', icon: 'Milk', color: '#3B82F6', is_quick: 0 },
  { name: 'Bread', icon: 'Wheat', color: '#D97706', is_quick: 0 },
  { name: 'Paneer', icon: 'Box', color: '#EAB308', is_quick: 0 },
  { name: 'Sweet', icon: 'Candy', color: '#EC4899', is_quick: 0 },
  { name: 'Cadbury', icon: 'Candy', color: '#9333EA', is_quick: 0 },
  { name: 'Icecream', icon: 'IceCream', color: '#F43F5E', is_quick: 0 },
  { name: 'Biscuit', icon: 'Cookie', color: '#D97706', is_quick: 0 },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#10B981', is_quick: 0 },
  { name: 'Curd', icon: 'Milk', color: '#0EA5E9', is_quick: 0 },
  { name: 'Coconut Water', icon: 'Droplet', color: '#10B981', is_quick: 0 },

  // Transport
  { name: 'Rapido', icon: 'Bike', color: '#F59E0B', is_quick: 0 },
  { name: 'Travel', icon: 'Navigation', color: '#6366F1', is_quick: 0 },
  { name: 'Railway Ticket', icon: 'Ticket', color: '#3B82F6', is_quick: 0 },

  // Personal / Shopping
  { name: 'Shoes', icon: 'Footprints', color: '#64748B', is_quick: 0 },
  { name: 'Footwear', icon: 'Footprints', color: '#64748B', is_quick: 0 },
  { name: 'Bag', icon: 'Briefcase', color: '#8B5CF6', is_quick: 0 },
  { name: 'Belt', icon: 'Watch', color: '#78350F', is_quick: 0 },
  { name: 'Watch', icon: 'Watch', color: '#6366F1', is_quick: 0 },
  { name: 'Wallet', icon: 'Wallet', color: '#64748B', is_quick: 0 },
  { name: 'Umbrella', icon: 'Umbrella', color: '#0284C7', is_quick: 0 },
  { name: 'Saloon', icon: 'Scissors', color: '#8B5CF6', is_quick: 0 },
  { name: 'Beard', icon: 'Scissors', color: '#64748B', is_quick: 0 },
  { name: 'Shaving Blade', icon: 'Sparkles', color: '#94A3B8', is_quick: 0 },

  // Tech & Utilities
  { name: 'AI', icon: 'Bot', color: '#6C47FF', is_quick: 0 },
  { name: 'Laptop', icon: 'Laptop', color: '#3B82F6', is_quick: 0 },
  { name: 'Mobile Recharge', icon: 'Smartphone', color: '#10B981', is_quick: 0 },
  { name: 'For Mobile', icon: 'Smartphone', color: '#6366F1', is_quick: 0 },
  { name: 'Mobile Accessories', icon: 'Headphones', color: '#8B5CF6', is_quick: 0 },
  { name: 'Earbud', icon: 'Headphones', color: '#A855F7', is_quick: 0 },
  { name: 'Mobile', icon: 'Smartphone', color: '#3B82F6', is_quick: 0 },
  { name: 'Light Bill', icon: 'Zap', color: '#F59E0B', is_quick: 0 },

  // Health & Education
  { name: 'Medical', icon: 'Stethoscope', color: '#EF4444', is_quick: 0 },
  { name: 'Doctor', icon: 'HeartPulse', color: '#DC2626', is_quick: 0 },
  { name: 'Hospital', icon: 'Building2', color: '#B91C1C', is_quick: 0 },
  { name: 'College', icon: 'GraduationCap', color: '#3B82F6', is_quick: 0 },
  { name: 'Courses', icon: 'BookOpen', color: '#8B5CF6', is_quick: 0 },
  { name: 'Stationary', icon: 'PenTool', color: '#64748B', is_quick: 0 },

  // Finance & Others
  { name: 'Mutual Fund', icon: 'TrendingUp', color: '#10B981', is_quick: 0 },
  { name: 'Stocks', icon: 'BarChart3', color: '#059669', is_quick: 0 },
  { name: 'Savings', icon: 'PiggyBank', color: '#10B981', is_quick: 0 },
  { name: 'Round Figure', icon: 'CircleDollarSign', color: '#6366F1', is_quick: 0 },
  { name: 'Gov Documents', icon: 'FileText', color: '#64748B', is_quick: 0 },
  { name: 'Gifts', icon: 'Gift', color: '#EC4899', is_quick: 0 },
  { name: 'Birthday', icon: 'Cake', color: '#F43F5E', is_quick: 0 },
  { name: 'Home Buy', icon: 'Home', color: '#6366F1', is_quick: 0 },
  { name: 'Movie Ticket', icon: 'Film', color: '#8B5CF6', is_quick: 0 },
  { name: 'In Between Office', icon: 'Building', color: '#64748B', is_quick: 0 },
  { name: 'Other', icon: 'MoreHorizontal', color: '#94A3B8', is_quick: 0 }
];

const STANDARD_PAYMENT_MODES = [
  { mode: 'UPI', description: 'Google Pay, PhonePe, Paytm, BHIM' },
  { mode: 'Cash', description: 'Physical cash notes & coins' },
  { mode: 'Credit Card', description: 'Credit Card swipe & online payments' },
  { mode: 'Debit Card', description: 'Debit card POS & ATM payments' },
  { mode: 'Net Banking', description: 'Direct bank IMPS/NEFT transfer' }
];

const EXPENSES_HEADERS = [
  'Transaction_ID',
  'Date',
  'Description',
  'Category',
  'Payment Mode',
  'Amount',
  'Month_Key',
  'Updated_At'
];

/**
 * Generate in-memory Excel workbook (.xlsx) matching the standard template
 * Returns Buffer
 */
function createStandardWorkbookBuffer(userEmail, defaultBudget = 12000) {
  const wb = xlsx.utils.book_new();

  // 1. Expenses Sheet (Empty transactions, headers only)
  const expensesData = [EXPENSES_HEADERS];
  const wsExpenses = xlsx.utils.aoa_to_sheet(expensesData);
  xlsx.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

  // 2. Dashboard Sheet
  const dashboardData = [
    ['Metric', 'Value', 'Formula / Note'],
    ['User Account', userEmail, 'Verified Google Account'],
    ['Monthly Budget', defaultBudget, 'Target monthly threshold (₹)'],
    ['Total Spent', 0, '=SUM(Expenses!F2:F)'],
    ['Remaining Budget', defaultBudget, '=B3-B4'],
    ['Created Date', new Date().toISOString().slice(0, 10), 'Template initialization date']
  ];
  const wsDashboard = xlsx.utils.aoa_to_sheet(dashboardData);
  xlsx.utils.book_append_sheet(wb, wsDashboard, 'Dashboard');

  // 3. Categories Sheet
  const categoriesData = [
    ['Category Name', 'Icon', 'Color', 'Quick Category'],
    ...STANDARD_CATEGORIES.map(c => [c.name, c.icon, c.color, c.is_quick ? 'Yes' : 'No'])
  ];
  const wsCategories = xlsx.utils.aoa_to_sheet(categoriesData);
  xlsx.utils.book_append_sheet(wb, wsCategories, 'Categories');

  // 4. Payment Modes Sheet
  const paymentModesData = [
    ['Payment Mode', 'Description'],
    ...STANDARD_PAYMENT_MODES.map(p => [p.mode, p.description])
  ];
  const wsPaymentModes = xlsx.utils.aoa_to_sheet(paymentModesData);
  xlsx.utils.book_append_sheet(wb, wsPaymentModes, 'Payment_Modes');

  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generate Google Sheets API v4 Resource JSON for direct Google Drive / Sheets creation
 */
function getGoogleSheetsApiTemplatePayload(title = 'PocketNook - Personal Vault', defaultBudget = 12000) {
  return {
    properties: {
      title: title,
      locale: 'en_IN',
      autoRecalc: 'ON_CHANGE',
      defaultFormat: {
        textFormat: {
          fontFamily: 'Inter',
          fontSize: 10
        }
      }
    },
    sheets: [
      // 1. Expenses Sheet
      {
        properties: {
          title: 'Expenses',
          gridProperties: {
            frozenRowCount: 1,
            rowCount: 1000,
            columnCount: 8
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: EXPENSES_HEADERS.map(header => ({
                  userEnteredValue: { stringValue: header },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.22, green: 0.08, blue: 0.52 }, // #371485 Purple
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                    horizontalAlignment: 'CENTER'
                  }
                }))
              }
            ]
          }
        ]
      },
      // 2. Dashboard Sheet
      {
        properties: {
          title: 'Dashboard',
          gridProperties: {
            frozenRowCount: 1,
            rowCount: 20,
            columnCount: 3
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: ['Metric', 'Value', 'Formula / Note'].map(h => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.42, green: 0.28, blue: 1.0 }, // #6C47FF
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                  }
                }))
              },
              {
                values: [
                  { userEnteredValue: { stringValue: 'Monthly Budget' } },
                  { userEnteredValue: { numberValue: defaultBudget } },
                  { userEnteredValue: { stringValue: 'Monthly spending target in INR' } }
                ]
              },
              {
                values: [
                  { userEnteredValue: { stringValue: 'Total Spent' } },
                  { userEnteredValue: { formulaValue: '=SUM(Expenses!F2:F)' } },
                  { userEnteredValue: { stringValue: 'Sum of expenses (refunds subtracted)' } }
                ]
              },
              {
                values: [
                  { userEnteredValue: { stringValue: 'Remaining Budget' } },
                  { userEnteredValue: { formulaValue: '=B2-B3' } },
                  { userEnteredValue: { stringValue: 'Remaining balance for month' } }
                ]
              }
            ]
          }
        ]
      },
      // 3. Categories Sheet
      {
        properties: {
          title: 'Categories',
          gridProperties: {
            frozenRowCount: 1,
            rowCount: STANDARD_CATEGORIES.length + 5,
            columnCount: 4
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: ['Category Name', 'Icon', 'Color', 'Quick Category'].map(h => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.42, green: 0.28, blue: 1.0 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                  }
                }))
              },
              ...STANDARD_CATEGORIES.map(c => ({
                values: [
                  { userEnteredValue: { stringValue: c.name } },
                  { userEnteredValue: { stringValue: c.icon } },
                  { userEnteredValue: { stringValue: c.color } },
                  { userEnteredValue: { stringValue: c.is_quick ? 'Yes' : 'No' } }
                ]
              }))
            ]
          }
        ]
      },
      // 4. Payment_Modes Sheet
      {
        properties: {
          title: 'Payment_Modes',
          gridProperties: {
            frozenRowCount: 1,
            rowCount: STANDARD_PAYMENT_MODES.length + 5,
            columnCount: 2
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: ['Payment Mode', 'Description'].map(h => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.42, green: 0.28, blue: 1.0 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                  }
                }))
              },
              ...STANDARD_PAYMENT_MODES.map(p => ({
                values: [
                  { userEnteredValue: { stringValue: p.mode } },
                  { userEnteredValue: { stringValue: p.description } }
                ]
              }))
            ]
          }
        ]
      }
    ]
  };
}

module.exports = {
  STANDARD_CATEGORIES,
  STANDARD_PAYMENT_MODES,
  EXPENSES_HEADERS,
  createStandardWorkbookBuffer,
  getGoogleSheetsApiTemplatePayload
};
