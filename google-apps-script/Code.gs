/**
 * Personal Expense Tracker - Google Apps Script Backend (Multi-User Edition)
 * 
 * Provides secure API endpoints, two-way synchronization, and individual
 * Google Sheet provisioning for multiple users.
 * 
 * Key Features:
 * 1. Multi-User Authentication: Validates Google OAuth ID Tokens or shared secret.
 * 2. Individual Spreadsheets: Operates on any user's spreadsheet via `spreadsheet_id`.
 * 3. Master Template Provisioning: `createSpreadsheet` creates a brand new 4-sheet
 *    spreadsheet (Expenses, Dashboard, Categories, Payment_Modes) initialized with
 *    zero transactions, standard 67 categories, and default ₹12,000 monthly budget.
 * 4. Backward Compatibility: Preserves Raj Shinde's active sheet (1,198 historical records).
 */

// CONFIGURATION
var DEFAULT_OWNER_EMAIL = "raaajshinde@gmail.com"; 
var AUTH_SECRET = "ET_SECURE_SYNC_KEY_2026"; // Shared secret passphrase
var SHEET_NAME = "Expenses";

// Standard 67 Categories
var STANDARD_CATEGORIES = [
  ["Food", "Utensils", "#6C47FF", "Yes"],
  ["Auto", "Car", "#F59E0B", "Yes"],
  ["Metro", "Train", "#0EA5E9", "Yes"],
  ["Fruits", "Apple", "#EF4444", "Yes"],
  ["Cloths", "Shirt", "#3B82F6", "Yes"],
  ["Shopping", "ShoppingBag", "#A855F7", "Yes"],
  ["Biryani", "Utensils", "#F97316", "No"],
  ["Non Veg", "Drumstick", "#EF4444", "No"],
  ["Chicken", "Drumstick", "#EA580C", "No"],
  ["Mutton", "Drumstick", "#DC2626", "No"],
  ["Fish", "Fish", "#0284C7", "No"],
  ["Eggs", "Egg", "#F59E0B", "No"],
  ["Fast Food", "Pizza", "#F97316", "No"],
  ["Office Lunch", "UtensilsCrossed", "#6366F1", "No"],
  ["Office Nashta", "Coffee", "#D97706", "No"],
  ["Office Tifin", "Package", "#059669", "No"],
  ["Office Bottle", "Droplet", "#06B6D4", "No"],
  ["Tea", "Coffee", "#B45309", "No"],
  ["Coffee Powder", "Coffee", "#78350F", "No"],
  ["Cold Drink", "CupSoda", "#06B6D4", "No"],
  ["Juice", "Wine", "#EC4899", "No"],
  ["Vegitables", "Carrot", "#10B981", "No"],
  ["Salad", "Salad", "#22C55E", "No"],
  ["Milk", "Milk", "#3B82F6", "No"],
  ["Bread", "Wheat", "#D97706", "No"],
  ["Paneer", "Box", "#EAB308", "No"],
  ["Sweet", "Candy", "#EC4899", "No"],
  ["Cadbury", "Candy", "#9333EA", "No"],
  ["Icecream", "IceCream", "#F43F5E", "No"],
  ["Biscuit", "Cookie", "#D97706", "No"],
  ["Groceries", "ShoppingCart", "#10B981", "No"],
  ["Curd", "Milk", "#0EA5E9", "No"],
  ["Coconut Water", "Droplet", "#10B981", "No"],
  ["Rapido", "Bike", "#F59E0B", "No"],
  ["Travel", "Navigation", "#6366F1", "No"],
  ["Railway Ticket", "Ticket", "#3B82F6", "No"],
  ["Shoes", "Footprints", "#64748B", "No"],
  ["Footwear", "Footprints", "#64748B", "No"],
  ["Bag", "Briefcase", "#8B5CF6", "No"],
  ["Belt", "Watch", "#78350F", "No"],
  ["Watch", "Watch", "#6366F1", "No"],
  ["Wallet", "Wallet", "#64748B", "No"],
  ["Umbrella", "Umbrella", "#0284C7", "No"],
  ["Saloon", "Scissors", "#8B5CF6", "No"],
  ["Beard", "Scissors", "#64748B", "No"],
  ["Shaving Blade", "Sparkles", "#94A3B8", "No"],
  ["AI", "Bot", "#6C47FF", "No"],
  ["Laptop", "Laptop", "#3B82F6", "No"],
  ["Mobile Recharge", "Smartphone", "#10B981", "No"],
  ["For Mobile", "Smartphone", "#6366F1", "No"],
  ["Mobile Accessories", "Headphones", "#8B5CF6", "No"],
  ["Earbud", "Headphones", "#A855F7", "No"],
  ["Mobile", "Smartphone", "#3B82F6", "No"],
  ["Light Bill", "Zap", "#F59E0B", "No"],
  ["Medical", "Stethoscope", "#EF4444", "No"],
  ["Doctor", "HeartPulse", "#DC2626", "No"],
  ["Hospital", "Building2", "#B91C1C", "No"],
  ["College", "GraduationCap", "#3B82F6", "No"],
  ["Courses", "BookOpen", "#8B5CF6", "No"],
  ["Stationary", "PenTool", "#64748B", "No"],
  ["Mutual Fund", "TrendingUp", "#10B981", "No"],
  ["Stocks", "BarChart3", "#059669", "No"],
  ["Savings", "PiggyBank", "#10B981", "No"],
  ["Round Figure", "CircleDollarSign", "#6366F1", "No"],
  ["Gov Documents", "FileText", "#64748B", "No"],
  ["Gifts", "Gift", "#EC4899", "No"],
  ["Birthday", "Cake", "#F43F5E", "No"],
  ["Home Buy", "Home", "#6366F1", "No"],
  ["Movie Ticket", "Film", "#8B5CF6", "No"],
  ["In Between Office", "Building", "#64748B", "No"],
  ["Other", "MoreHorizontal", "#94A3B8", "No"]
];

// Standard Payment Modes
var STANDARD_PAYMENT_MODES = [
  ["UPI", "Google Pay, PhonePe, Paytm, BHIM"],
  ["Cash", "Physical cash notes & coins"],
  ["Credit Card", "Credit Card swipe & online payments"],
  ["Debit Card", "Debit card POS & ATM payments"],
  ["Net Banking", "Direct bank IMPS/NEFT transfer"]
];

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  return handleRequest(e, "GET");
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  return handleRequest(e, "POST");
}

/**
 * Core Request Dispatcher with Multi-User Support
 */
function handleRequest(e, method) {
  var output = { success: false };
  
  try {
    var params = {};
    if (method === "GET") {
      params = e.parameter || {};
    } else {
      if (e.postData && e.postData.contents) {
        try {
          params = JSON.parse(e.postData.contents);
        } catch (parseErr) {
          params = e.parameter || {};
        }
      } else {
        params = e.parameter || {};
      }
    }

    // 1. Authenticate Request
    var authResult = verifyAuth(params);
    if (!authResult.authorized) {
      output = {
        success: false,
        error: "Unauthorized: " + (authResult.reason || "Invalid authentication credentials")
      };
      return ContentService.createTextOutput(JSON.stringify(output))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var userEmail = authResult.user;
    var action = params.action || "getExpenses";

    // Action: Create Brand New Spreadsheet Template for New User
    if (action === "createSpreadsheet") {
      var defaultBudget = parseFloat(params.default_budget) || 12000;
      var title = params.title || ("My Expense Tracker - " + userEmail);
      var newSheetInfo = createSpreadsheetTemplate(userEmail, title, defaultBudget);
      output = {
        success: true,
        data: newSheetInfo
      };
      return ContentService.createTextOutput(JSON.stringify(output))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Resolve Target Spreadsheet (Individual user sheet or default active sheet)
    var ss = getTargetSpreadsheet(params);
    var sheet = getExpensesSheet(ss);

    // 2. Action Router
    switch (action) {
      case "ping":
        output = {
          success: true,
          message: "Google Apps Script Backend Active & Connected",
          spreadsheet_id: ss.getId(),
          spreadsheet_name: ss.getName(),
          sheet_name: SHEET_NAME,
          user: userEmail,
          timestamp: new Date().toISOString()
        };
        break;

      case "getExpenses":
        output = {
          success: true,
          spreadsheet_id: ss.getId(),
          data: getAllExpenses(sheet)
        };
        break;

      case "addExpense":
        output = {
          success: true,
          spreadsheet_id: ss.getId(),
          data: addExpense(sheet, params.expense)
        };
        break;

      case "updateExpense":
        output = {
          success: true,
          spreadsheet_id: ss.getId(),
          data: updateExpense(sheet, params.id, params.expense)
        };
        break;

      case "deleteExpense":
        output = {
          success: true,
          spreadsheet_id: ss.getId(),
          data: deleteExpense(sheet, params.id)
        };
        break;

      case "twoWaySync":
        output = {
          success: true,
          spreadsheet_id: ss.getId(),
          data: performTwoWaySync(sheet, params.client_changes, params.last_sync_time)
        };
        break;

      case "getMetadata":
        output = {
          success: true,
          spreadsheet_id: ss.getId(),
          data: getSheetMetadata(ss, sheet)
        };
        break;

      default:
        output = { success: false, error: "Unknown action: " + action };
        break;
    }
  } catch (err) {
    output = {
      success: false,
      error: err.toString(),
      stack: err.stack
    };
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Multi-User Security Verification
 */
function verifyAuth(params) {
  var providedSecret = params.auth_secret || params.secret || "";
  var idToken = params.id_token || params.google_token || "";

  // Check 1: Shared secret passphrase
  if (providedSecret && providedSecret === AUTH_SECRET) {
    var email = (params.user_email || params.email || DEFAULT_OWNER_EMAIL).toLowerCase();
    return { authorized: true, user: email };
  }

  // Check 2: Google OAuth 2.0 ID Token verification via Google TokenInfo API
  if (idToken) {
    try {
      var tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken);
      var response = UrlFetchApp.fetch(tokenInfoUrl, { muteHttpExceptions: true });
      if (response.getResponseCode() === 200) {
        var tokenData = JSON.parse(response.getContentText());
        var userEmail = (tokenData.email || "").toLowerCase();
        if (userEmail) {
          return { authorized: true, user: userEmail };
        }
      }
    } catch (tokenErr) {}
  }

  // Fallback: Active Google Session
  try {
    var activeUser = Session.getActiveUser().getEmail();
    if (activeUser) {
      return { authorized: true, user: activeUser.toLowerCase() };
    }
  } catch (sessErr) {}

  return { authorized: false, reason: "Missing or invalid authorization credentials" };
}

/**
 * Resolve Target Spreadsheet:
 * Accepts `spreadsheet_id` parameter or falls back to active bound spreadsheet.
 */
function getTargetSpreadsheet(params) {
  if (params && params.spreadsheet_id) {
    return SpreadsheetApp.openById(params.spreadsheet_id);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Provision Standard 4-Sheet Template for a New User
 */
function createSpreadsheetTemplate(userEmail, title, defaultBudget) {
  var ss = SpreadsheetApp.create(title || ("My Expense Tracker - " + userEmail));
  
  // 1. Setup Expenses Sheet
  var expSheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  expSheet.clear();
  expSheet.appendRow(["Transaction_ID", "Date", "Description", "Category", "Payment Mode", "Amount", "Month_Key", "Updated_At"]);
  var expHeader = expSheet.getRange(1, 1, 1, 8);
  expHeader.setFontWeight("bold").setBackground("#371485").setFontColor("#FFFFFF");
  expSheet.setFrozenRows(1);

  // 2. Setup Dashboard Sheet
  var dashSheet = ss.getSheetByName("Dashboard") || ss.insertSheet("Dashboard");
  dashSheet.clear();
  dashSheet.appendRow(["Metric", "Value", "Formula / Note"]);
  dashSheet.appendRow(["User Account", userEmail, "Verified Google Account"]);
  dashSheet.appendRow(["Monthly Budget", defaultBudget, "Target monthly threshold (₹)"]);
  dashSheet.appendRow(["Total Spent", 0, "=SUM(Expenses!F2:F)"]);
  dashSheet.appendRow(["Remaining Budget", defaultBudget, "=B3-B4"]);
  dashSheet.appendRow(["Template Version", "4.0.0", "Multi-User Standard Architecture"]);
  dashSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#6C47FF").setFontColor("#FFFFFF");
  dashSheet.setFrozenRows(1);

  // 3. Setup Categories Sheet
  var catSheet = ss.getSheetByName("Categories") || ss.insertSheet("Categories");
  catSheet.clear();
  catSheet.appendRow(["Category Name", "Icon", "Color", "Quick Category"]);
  catSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#EDE9FE").setFontColor("#371485");
  if (STANDARD_CATEGORIES.length > 0) {
    catSheet.getRange(2, 1, STANDARD_CATEGORIES.length, 4).setValues(STANDARD_CATEGORIES);
  }
  catSheet.setFrozenRows(1);

  // 4. Setup Payment Modes Sheet
  var paySheet = ss.getSheetByName("Payment_Modes") || ss.insertSheet("Payment_Modes");
  paySheet.clear();
  paySheet.appendRow(["Payment Mode", "Description"]);
  paySheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#EDE9FE").setFontColor("#371485");
  if (STANDARD_PAYMENT_MODES.length > 0) {
    paySheet.getRange(2, 1, STANDARD_PAYMENT_MODES.length, 2).setValues(STANDARD_PAYMENT_MODES);
  }
  paySheet.setFrozenRows(1);

  // Remove default 'Sheet1' if present
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  // Set Expenses as active
  ss.setActiveSheet(expSheet);

  return {
    spreadsheet_id: ss.getId(),
    spreadsheet_url: ss.getUrl(),
    title: ss.getName(),
    sheets: ["Expenses", "Dashboard", "Categories", "Payment_Modes"],
    categories_count: STANDARD_CATEGORIES.length,
    initial_transactions: 0,
    monthly_budget: defaultBudget
  };
}

/**
 * Get or initialize the Expenses sheet
 */
function getExpensesSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Transaction_ID", "Date", "Description", "Category", "Payment Mode", "Amount", "Month_Key", "Updated_At"]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#371485").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  } else {
    // Ensure Transaction_ID column exists
    var lastCol = sheet.getLastColumn();
    if (lastCol > 0) {
      var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      if (header[0] !== "Transaction_ID") {
        sheet.insertColumnBefore(1);
        sheet.getRange(1, 1).setValue("Transaction_ID").setFontWeight("bold");
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          var idCol = [];
          for (var i = 2; i <= lastRow; i++) {
            idCol.push(["TX-" + i + "-" + Math.floor(Math.random() * 100000)]);
          }
          sheet.getRange(2, 1, lastRow - 1, 1).setValues(idCol);
        }
      }
    }
  }
  return sheet;
}

/**
 * Fetch all expenses from sheet
 */
function getAllExpenses(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var results = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var txId = String(row[0] || ("TX-" + (i + 2)));
    var dateVal = formatDate(row[1]);
    var desc = String(row[2] || "");
    var category = String(row[3] || "Other");
    var paymentMode = String(row[4] || "UPI");
    var amount = parseFloat(row[5]) || 0;
    var monthKey = String(row[6] || (dateVal ? dateVal.slice(0, 7) : ""));
    var updatedAt = row[7] ? new Date(row[7]).toISOString() : new Date().toISOString();

    results.push({
      id: txId,
      date: dateVal,
      description: desc,
      category: category,
      payment_mode: paymentMode,
      amount: amount,
      is_refund: amount < 0,
      month_key: monthKey,
      updated_at: updatedAt,
      row_index: i + 2
    });
  }

  return results;
}

/**
 * Add a new expense row
 */
function addExpense(sheet, expense) {
  if (!expense) throw new Error("No expense data provided");

  var txId = expense.id || ("TX-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000));
  var dateStr = expense.date || Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
  var amount = parseFloat(expense.amount) || 0;
  if (expense.is_refund && amount > 0) amount = -amount;

  var monthKey = expense.month_key || dateStr.slice(0, 7);
  var updatedAt = new Date().toISOString();

  sheet.appendRow([
    txId,
    dateStr,
    expense.description || "",
    expense.category || "Food",
    expense.payment_mode || "UPI",
    amount,
    monthKey,
    updatedAt
  ]);

  return {
    id: txId,
    date: dateStr,
    description: expense.description || "",
    category: expense.category || "Food",
    payment_mode: expense.payment_mode || "UPI",
    amount: amount,
    month_key: monthKey,
    updated_at: updatedAt
  };
}

/**
 * Update an existing expense row by Transaction_ID
 */
function updateExpense(sheet, id, expense) {
  if (!id) throw new Error("Transaction ID is required");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("No rows in sheet");

  var idColValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var targetRow = -1;

  for (var i = 0; i < idColValues.length; i++) {
    if (String(idColValues[i][0]) === String(id)) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow === -1) {
    expense.id = id;
    return addExpense(sheet, expense);
  }

  var dateStr = expense.date;
  var amount = parseFloat(expense.amount) || 0;
  if (expense.is_refund && amount > 0) amount = -amount;
  var monthKey = expense.month_key || (dateStr ? dateStr.slice(0, 7) : "");
  var updatedAt = new Date().toISOString();

  var updateValues = [
    [
      id,
      dateStr,
      expense.description || "",
      expense.category || "Food",
      expense.payment_mode || "UPI",
      amount,
      monthKey,
      updatedAt
    ]
  ];

  sheet.getRange(targetRow, 1, 1, 8).setValues(updateValues);

  return {
    id: id,
    date: dateStr,
    description: expense.description,
    category: expense.category,
    payment_mode: expense.payment_mode,
    amount: amount,
    month_key: monthKey,
    updated_at: updatedAt
  };
}

/**
 * Delete expense by Transaction_ID
 */
function deleteExpense(sheet, id) {
  if (!id) throw new Error("Transaction ID is required");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { deleted: false, reason: "Empty sheet" };

  var idColValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idColValues.length; i++) {
    if (String(idColValues[i][0]) === String(id)) {
      sheet.deleteRow(i + 2);
      return { deleted: true, id: id };
    }
  }

  return { deleted: false, reason: "ID not found" };
}

/**
 * Two-Way Automatic Synchronization
 */
function performTwoWaySync(sheet, clientChanges, lastSyncTime) {
  var appliedChanges = [];
  var errors = [];

  if (clientChanges && clientChanges.length > 0) {
    for (var i = 0; i < clientChanges.length; i++) {
      var change = clientChanges[i];
      try {
        if (change.action === "create") {
          addExpense(sheet, change.data);
          appliedChanges.push(change.data.id);
        } else if (change.action === "update") {
          updateExpense(sheet, change.id, change.data);
          appliedChanges.push(change.id);
        } else if (change.action === "delete") {
          deleteExpense(sheet, change.id);
          appliedChanges.push(change.id);
        }
      } catch (err) {
        errors.push({ id: change.id, action: change.action, error: err.toString() });
      }
    }
  }

  var allExpenses = getAllExpenses(sheet);

  return {
    applied_count: appliedChanges.length,
    applied_ids: appliedChanges,
    errors: errors,
    server_expenses: allExpenses,
    sync_timestamp: new Date().toISOString()
  };
}

/**
 * Format Date helper
 */
function formatDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Kolkata", "yyyy-MM-dd");
  }
  var s = String(val).trim();
  if (s.length >= 10 && s.match(/^\d{4}-\d{2}-\d{2}/)) {
    return s.slice(0, 10);
  }
  return s;
}

/**
 * Sheet metadata
 */
function getSheetMetadata(ss, sheet) {
  var lastRow = sheet.getLastRow();
  var count = Math.max(0, lastRow - 1);
  return {
    spreadsheet_id: ss.getId(),
    spreadsheet_name: ss.getName(),
    total_records: count,
    sheet_name: sheet.getName(),
    sheets: ss.getSheets().map(function(s) { return s.getName(); }),
    last_updated: new Date().toISOString()
  };
}
