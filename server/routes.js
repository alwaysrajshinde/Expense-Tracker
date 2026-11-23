const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const db = require('./db');
const sheetTemplate = require('./sheetTemplate');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware: Resolve authenticated user context with complete data isolation
function resolveUser(req, res, next) {
  try {
    const rawUserEmail = req.headers['x-user-email'] || req.query.user_email;
    if (!rawUserEmail) {
      return res.status(401).json({ success: false, error: 'Unauthorized: user identity header missing' });
    }
    const userEmail = String(rawUserEmail).trim().toLowerCase();
    // Strict email syntax validation to prevent header injection and spoofing
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(userEmail) || userEmail.length > 254) {
      return res.status(400).json({ success: false, error: 'Bad Request: invalid user identity format' });
    }

    const googleSub = req.headers['x-google-sub'] ? String(req.headers['x-google-sub']).slice(0, 128) : null;
    const userName = req.headers['x-user-name'] ? String(req.headers['x-user-name']).slice(0, 100) : null;
    const { user, spreadsheetMapping, isNew } = db.getOrCreateUser(googleSub, userEmail, userName);
    req.user = user;
    req.spreadsheetMapping = spreadsheetMapping;
    req.isNewUser = isNew;
    next();
  } catch (err) {
    console.error('Error resolving user context:', err);
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

// ========================================================
// 1. AUTHENTICATION & MULTI-USER IDENTITY
// ========================================================

router.post('/auth/google', (req, res) => {
  try {
    const { email, name, sub, picture } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Google account email is required' });
    }
    const { user, spreadsheetMapping, isNew } = db.getOrCreateUser(sub, email, name, picture);
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        google_user_id: user.google_user_id
      },
      spreadsheet: spreadsheetMapping,
      is_new_user: isNew
    });
  } catch (err) {
    console.error('Google Auth error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get currently authenticated user profile & spreadsheet association
router.get('/user/profile', resolveUser, (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
      spreadsheet: req.spreadsheetMapping
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Associate or update user's Google Spreadsheet ID
router.post('/user/spreadsheet', resolveUser, (req, res) => {
  try {
    const { spreadsheet_id, spreadsheet_url, status } = req.body;
    if (!spreadsheet_id) {
      return res.status(400).json({ success: false, error: 'spreadsheet_id is required' });
    }
    const mapping = db.setUserSpreadsheetMapping(req.user.id, spreadsheet_id, spreadsheet_url, status || 'active');
    res.json({ success: true, spreadsheet: mapping });
  } catch (err) {
    console.error('Error linking spreadsheet:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================================
// 2. STANDARD SPREADSHEET TEMPLATE ENDPOINTS
// ========================================================

// Download blank standard template workbook for user
router.get('/template/download', resolveUser, (req, res) => {
  try {
    const buffer = sheetTemplate.createStandardWorkbookBuffer(req.user.email);
    res.setHeader('Content-Disposition', 'attachment; filename="Expense_Tracker_Template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Google Sheets API v4 payload structure for client-side Drive creation
router.get('/template/sheets-payload', resolveUser, (req, res) => {
  try {
    const payload = sheetTemplate.getGoogleSheetsApiTemplatePayload(`PocketNook - ${req.user.email}`);
    res.json({ success: true, payload });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================================
// 3. USER-SCOPED DASHBOARD & EXPENSES
// ========================================================

router.get('/dashboard', resolveUser, (req, res) => {
  try {
    const { month } = req.query;
    const data = db.getDashboardData(month, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching dashboard:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/transactions', resolveUser, (req, res) => {
  try {
    const filters = {
      month_key: req.query.month,
      category: req.query.category,
      payment_mode: req.query.payment_mode,
      date: req.query.date,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };
    const data = db.getTransactions(filters, req.user.id);

    // Group transactions by date for UI presentation
    const groupedMap = {};
    (data.transactions || []).forEach(tx => {
      const d = tx.date || 'Unknown';
      if (!groupedMap[d]) {
        groupedMap[d] = { date: d, total: 0, transactions: [] };
      }
      groupedMap[d].transactions.push(tx);
      groupedMap[d].total += (parseFloat(tx.amount) || 0);
    });

    const formattedData = {
      ...data,
      total_count: data.pagination ? data.pagination.total : (data.transactions || []).length,
      total_amount: data.pagination ? data.pagination.total_amount : 0,
      grouped: Object.values(groupedMap)
    };

    res.json({ success: true, data: formattedData });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/transactions', resolveUser, (req, res) => {
  try {
    const { amount, category, payment_mode, date, description, is_refund } = req.body;
    if (amount === undefined || amount === null || isNaN(parseFloat(amount))) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }
    const newTx = db.addTransaction({
      amount: parseFloat(amount),
      category,
      payment_mode,
      date,
      description,
      is_refund: Boolean(is_refund)
    }, req.user.id);
    res.status(201).json({ success: true, data: newTx });
  } catch (err) {
    console.error('Error adding transaction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/transactions/:id', resolveUser, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { amount, category, payment_mode, date, description, is_refund } = req.body;
    const updated = db.updateTransaction(id, {
      amount,
      category,
      payment_mode,
      date,
      description,
      is_refund: Boolean(is_refund)
    }, req.user.id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Transaction not found or access denied' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/transactions/:id', resolveUser, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = db.deleteTransaction(id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Transaction not found or access denied' });
    }
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================================
// 4. CATEGORIES & REPORTS
// ========================================================

router.get('/categories', resolveUser, (req, res) => {
  try {
    const data = db.getCategories(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/categories', resolveUser, (req, res) => {
  try {
    const { name, icon, color, is_quick } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }
    const cat = db.addCategory({ name, icon, color, is_quick });
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/categories/:id', resolveUser, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = db.deleteCategory(id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/categories/:id', resolveUser, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = db.updateCategory(id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/categories/count', resolveUser, (req, res) => {
  try {
    const { name } = req.query;
    const count = db.countCategoryTransactions(name, req.user.id);
    res.json({ success: true, count });
  } catch (err) {
    console.error('Error counting category transactions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/categories/reassign', resolveUser, (req, res) => {
  try {
    const { oldName, newName } = req.body;
    const changed = db.reassignCategoryTransactions(oldName, newName, req.user.id);
    res.json({ success: true, changed });
  } catch (err) {
    console.error('Error reassigning category transactions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/reports', resolveUser, (req, res) => {
  try {
    const { month } = req.query;
    const data = db.getReports(month, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================================
// 5. SETTINGS & BUDGET
// ========================================================

router.get('/settings', resolveUser, (req, res) => {
  try {
    const data = db.getSettings(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/settings', resolveUser, (req, res) => {
  try {
    const updated = db.updateSettings(req.body, req.user.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/budget', resolveUser, (req, res) => {
  try {
    const { month, budget } = req.body;
    if (!budget || isNaN(parseFloat(budget))) {
      return res.status(400).json({ success: false, error: 'Valid budget amount is required' });
    }
    const val = parseFloat(budget);
    if (month && month !== 'default') {
      db.setMonthlyBudget(month, val, req.user.id);
    } else {
      db.updateSettings({ monthly_budget: val.toString() }, req.user.id);
    }
    res.json({ success: true, budget: val, month });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================================
// 6. EXPORT & IMPORT (ISOLATED PER USER)
// ========================================================

router.get('/export/excel', resolveUser, (req, res) => {
  try {
    const rows = db.exportAllTransactions(req.user.id);
    const excelRows = rows.map(r => ({
      'Date': r.date,
      'Description': r.description,
      'Category': r.category,
      'Payment Mode': r.payment_mode,
      'Amount': r.amount,
      'Month_Key': r.month_key
    }));

    const worksheet = xlsx.utils.json_to_sheet(excelRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Expenses');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="Expense_Tracker_${req.user.email.split('@')[0]}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/export/json', resolveUser, (req, res) => {
  try {
    const transactions = db.exportAllTransactions(req.user.id);
    const categories = db.getCategories(req.user.id);
    const settings = db.getSettings(req.user.id);
    const backup = {
      export_date: new Date().toISOString(),
      user: {
        email: req.user.email,
        name: req.user.name
      },
      spreadsheet_id: req.spreadsheetMapping ? req.spreadsheetMapping.spreadsheet_id : null,
      version: '2.0',
      settings,
      categories,
      transactions
    };
    res.setHeader('Content-Disposition', `attachment; filename="expense_tracker_${req.user.email.split('@')[0]}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/import', resolveUser, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames.includes('Expenses') ? 'Expenses' : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    let imported = 0;
    let skipped = 0;
    const errors = [];

    const importTx = db.db.transaction(() => {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r.Date || r.Amount === undefined || r.Amount === null || r.Amount === '') {
          skipped++;
          continue;
        }

        const dateStr = db.parseExcelDate(r.Date);
        if (!dateStr) {
          skipped++;
          errors.push(`Row ${i + 2}: Invalid date "${r.Date}"`);
          continue;
        }

        const amt = parseFloat(r.Amount);
        if (isNaN(amt)) {
          skipped++;
          errors.push(`Row ${i + 2}: Invalid amount "${r.Amount}"`);
          continue;
        }

        const cat = r.Category ? String(r.Category).trim() : 'Other';
        const pm = db.normalizePaymentMode(r['Payment Mode'] || r.PaymentMode);
        const desc = r.Description ? String(r.Description).trim() : '';
        const mk = r.Month_Key ? String(r.Month_Key).trim() : dateStr.slice(0, 7);

        db.db.prepare(`
          INSERT INTO transactions (user_id, date, description, category, payment_mode, amount, month_key, is_refund)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(req.user.id, dateStr, desc, cat, pm, amt, mk, amt < 0 ? 1 : 0);

        imported++;
      }
    });

    importTx();

    res.json({
      success: true,
      message: `Imported ${imported} transactions (${skipped} skipped)`,
      imported,
      skipped,
      errors: errors.slice(0, 10)
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/backup/restore', resolveUser, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No backup file provided' });
    }
    const backupData = JSON.parse(req.file.buffer.toString('utf-8'));
    const result = db.restoreDatabase(backupData, req.user.id);
    res.json({ success: true, message: 'Database restored successfully', ...result });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
