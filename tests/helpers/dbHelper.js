// @ts-check
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/expense_tracker.db');

function getDb() {
  return new Database(DB_PATH, { readonly: false });
}

function getRajRecordCount() {
  const db = getDb();
  try {
    const user = db.prepare("SELECT id FROM users WHERE email = 'raaajshinde@gmail.com'").get();
    if (!user) return 0;
    const row = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE user_id = ?").get(user.id);
    return row.count;
  } finally {
    db.close();
  }
}

function getTransactionsForUser(email) {
  const db = getDb();
  try {
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (!user) return [];
    return db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC").all(user.id);
  } finally {
    db.close();
  }
}

function cleanTestUsers() {
  const db = getDb();
  try {
    // Strictly preserve Raj Shinde (user_id = 1, email = 'raaajshinde@gmail.com')
    const testUsers = db.prepare("SELECT id FROM users WHERE id > 1 AND email != 'raaajshinde@gmail.com'").all();
    for (const u of testUsers) {
      db.prepare("DELETE FROM transactions WHERE user_id = ?").run(u.id);
      db.prepare("DELETE FROM user_spreadsheet_mappings WHERE user_id = ?").run(u.id);
      db.prepare("DELETE FROM user_monthly_budgets WHERE user_id = ?").run(u.id);
      db.prepare("DELETE FROM user_settings WHERE user_id = ?").run(u.id);
      db.prepare("DELETE FROM users WHERE id = ?").run(u.id);
    }
  } finally {
    db.close();
  }
}

module.exports = {
  getRajRecordCount,
  getTransactionsForUser,
  cleanTestUsers
};
