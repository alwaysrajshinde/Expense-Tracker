/**
 * Google Drive & Sheets Integration Service
 * Automatically creates and manages the user's personal Expense Spreadsheet in their own Google Drive
 */

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Creates the standard Expense Tracker spreadsheet in the user's own Google Drive
 */
export async function createPersonalGoogleSheet(accessToken, userName = 'Personal') {
  if (!accessToken) throw new Error('Google OAuth access token is required');

  const title = `My Expense Tracker - ${userName}`;

  const requestBody = {
    properties: {
      title,
      locale: 'en_IN',
      autoRecalc: 'ON_CHANGE',
      defaultFormat: {
        textFormat: { fontFamily: 'Roboto' }
      }
    },
    sheets: [
      {
        properties: {
          title: 'Daily Expenses',
          gridProperties: { rowCount: 1500, columnCount: 10, frozenRowCount: 1 }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Date' } },
                  { userEnteredValue: { stringValue: 'Month' } },
                  { userEnteredValue: { stringValue: 'Category' } },
                  { userEnteredValue: { stringValue: 'Payment Mode' } },
                  { userEnteredValue: { stringValue: 'Description' } },
                  { userEnteredValue: { stringValue: 'Amount (₹)' } },
                  { userEnteredValue: { stringValue: 'Type' } }
                ]
              }
            ]
          }
        ]
      },
      {
        properties: {
          title: 'Summary',
          gridProperties: { rowCount: 100, columnCount: 8, frozenRowCount: 1 }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Month' } },
                  { userEnteredValue: { stringValue: 'Monthly Budget (₹)' } },
                  { userEnteredValue: { stringValue: 'Total Spent (₹)' } },
                  { userEnteredValue: { stringValue: 'Remaining (₹)' } },
                  { userEnteredValue: { stringValue: 'Status' } }
                ]
              },
              {
                values: [
                  { userEnteredValue: { stringValue: '2026-11' } },
                  { userEnteredValue: { numberValue: 12000 } },
                  { userEnteredValue: { formulaValue: '=SUMIFS(\'Daily Expenses\'!F:F, \'Daily Expenses\'!B:B, "2026-11")' } },
                  { userEnteredValue: { formulaValue: '=B2-C2' } },
                  { userEnteredValue: { formulaValue: '=IF(D2<0, "Over Budget", "Within Budget")' } }
                ]
              }
            ]
          }
        ]
      },
      {
        properties: {
          title: 'Categories',
          gridProperties: { rowCount: 100, columnCount: 4, frozenRowCount: 1 }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Category Name' } },
                  { userEnteredValue: { stringValue: 'Icon' } },
                  { userEnteredValue: { stringValue: 'Color' } }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const response = await fetch(SHEETS_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Sheet: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    spreadsheetId: result.spreadsheetId,
    spreadsheetUrl: result.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}/edit`,
    title: result.properties?.title
  };
}

/**
 * Append an expense record to the user's Google Sheet in Google Drive
 */
export async function appendExpenseToGoogleSheet(accessToken, spreadsheetId, expense) {
  if (!accessToken || !spreadsheetId) return null;

  try {
    const range = "'Daily Expenses'!A:G";
    const url = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const row = [
      expense.date || new Date().toISOString().slice(0, 10),
      expense.month_key || (expense.date ? expense.date.slice(0, 7) : '2026-11'),
      expense.category || 'General',
      expense.payment_mode || 'UPI',
      expense.description || '',
      parseFloat(expense.amount) || 0,
      expense.is_refund ? 'Refund' : 'Expense'
    ];

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [row] })
    });

    if (res.ok) {
      return await res.json();
    } else {
      console.warn('Google Sheet append returned status:', res.status);
    }
  } catch (err) {
    console.warn('Non-blocking: Failed to mirror expense to Google Sheet:', err.message);
  }
  return null;
}

/**
 * Batch populate initial historical records into user's Google Sheet
 */
export async function batchPopulateGoogleSheet(accessToken, spreadsheetId, transactions = []) {
  if (!accessToken || !spreadsheetId || !transactions.length) return null;

  try {
    const range = "'Daily Expenses'!A2:G";
    const url = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

    const rows = transactions.map(t => [
      t.date || '',
      t.month_key || (t.date ? t.date.slice(0, 7) : ''),
      t.category || 'Other',
      t.payment_mode || 'UPI',
      t.description || '',
      parseFloat(t.amount) || 0,
      t.is_refund ? 'Refund' : 'Expense'
    ]);

    // Send in chunks of 500 rows to respect Sheets API payload limits
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: slice })
      });
    }
    return { success: true, count: rows.length };
  } catch (err) {
    console.warn('Batch populate Google Sheet notice:', err.message);
    return null;
  }
}
