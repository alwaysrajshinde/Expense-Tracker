const Database = require('better-sqlite3');
const db = new Database('data/expense_tracker.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);
for (const t of tables) {
  const count = db.prepare(`SELECT count(*) as c FROM ${t.name}`).get();
  const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
  console.log(`Table: ${t.name} (${count.c} rows), columns: ${cols.map(c => c.name).join(', ')}`);
}
