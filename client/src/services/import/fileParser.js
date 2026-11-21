import * as XLSX from 'xlsx';

/**
 * Intelligent File & Clipboard Parser for Excel, CSV and Pasted Tables
 */

/**
 * Automatically detects the delimiter of a text string (comma, semicolon, tab, pipe)
 */
export function detectDelimiter(text) {
  const sampleLines = text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0).slice(0, 10);
  if (sampleLines.length === 0) return ',';

  const delimiters = [',', ';', '\t', '|'];
  const scores = {};

  delimiters.forEach(delim => {
    // Count occurrences per line; a true delimiter has consistent counts across rows
    const counts = sampleLines.map(line => (line.match(new RegExp('\\' + delim, 'g')) || []).length);
    const nonZeroCounts = counts.filter(c => c > 0);
    if (nonZeroCounts.length === 0) {
      scores[delim] = 0;
      return;
    }
    const avg = nonZeroCounts.reduce((a, b) => a + b, 0) / nonZeroCounts.length;
    // Lower standard deviation = higher score
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
    scores[delim] = avg * (1 / (1 + variance));
  });

  let bestDelim = ',';
  let maxScore = -1;
  Object.keys(scores).forEach(d => {
    if (scores[d] > maxScore) {
      maxScore = scores[d];
      bestDelim = d;
    }
  });

  return maxScore > 0 ? bestDelim : ',';
}

/**
 * Parses raw clipboard or pasted table text into rows
 */
export function parsePastedText(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('Pasted text is empty.');
  }

  const delimiter = detectDelimiter(rawText);
  const lines = rawText.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('No valid transaction rows found in pasted text.');
  }

  // Parse lines respecting quotes
  const matrix = lines.map(line => {
    if (delimiter === '\t') {
      return line.split('\t').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
    }
    // Simple CSV parser supporting quotes
    const cells = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        cells.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    cells.push(cur.trim().replace(/^["']|["']$/g, ''));
    return cells;
  });

  return analyzeTableMatrix(matrix, 'Pasted Clipboard Data');
}

/**
 * Parses an Excel or CSV file via SheetJS in the browser
 */
export async function parseFile(file, sheetName = null) {
  if (!file) throw new Error('No file provided for parsing.');

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isCsv = ext === 'csv' || ext === 'txt';

  const buffer = await file.arrayBuffer();
  let workbook;

  if (isCsv) {
    // Read text to handle unusual encodings/delimiters
    const decoder = new TextDecoder('utf-8');
    const textContent = decoder.decode(buffer);
    const delimiter = detectDelimiter(textContent);
    workbook = XLSX.read(textContent, { type: 'string', FS: delimiter, raw: false });
  } else {
    workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
  }

  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error('The uploaded workbook contains no sheets.');
  }

  const targetSheetName = (sheetName && sheetNames.includes(sheetName)) ? sheetName : sheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];

  // Convert worksheet to raw 2D array matrix (header: 1)
  const rawMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });

  const analyzed = analyzeTableMatrix(rawMatrix, file.name);
  analyzed.sheets = sheetNames;
  analyzed.selectedSheet = targetSheetName;
  analyzed.fileSize = file.size;
  analyzed.fileType = ext.toUpperCase();

  return analyzed;
}

/**
 * Analyzes a 2D matrix of cells to intelligently locate the true header row,
 * skipping introductory metadata rows (common in bank statements).
 */
export function analyzeTableMatrix(matrix, sourceName = '') {
  if (!matrix || matrix.length === 0) {
    throw new Error('No data found in the document.');
  }

  // Filter out completely blank rows
  const cleanRows = matrix.filter(row => Array.isArray(row) && row.some(cell => String(cell || '').trim().length > 0));

  if (cleanRows.length === 0) {
    throw new Error('All rows in the document are blank.');
  }

  // Common header keywords to score candidate header rows
  const headerKeywords = [
    'date', 'txn', 'transaction', 'narration', 'particulars', 'description',
    'debit', 'credit', 'amount', 'withdrawal', 'deposit', 'balance', 'category',
    'mode', 'ref', 'utr', 'cheque', 'chq', 'value', 'closing'
  ];

  let bestHeaderIndex = 0;
  let highestScore = -1;

  // Search within first 15 rows for header row
  const scanLimit = Math.min(cleanRows.length, 15);
  for (let i = 0; i < scanLimit; i++) {
    const row = cleanRows[i];
    let score = 0;
    const cellStrings = row.map(c => String(c || '').toLowerCase().trim());

    cellStrings.forEach(cell => {
      if (headerKeywords.some(kw => cell.includes(kw))) {
        score += 2;
      }
      // Non-empty string header
      if (cell.length > 1 && isNaN(Number(cell))) {
        score += 0.5;
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestHeaderIndex = i;
    }
  }

  // If even best score is low, treat row 0 as header or generate generic Col 1, Col 2
  const rawHeaders = cleanRows[bestHeaderIndex].map((h, idx) => {
    const str = String(h || '').trim();
    return str.length > 0 ? str : `Column_${idx + 1}`;
  });

  // Data rows are all rows strictly AFTER the detected header row
  const dataRows = cleanRows.slice(bestHeaderIndex + 1).filter(row => {
    // Exclude potential trailing footer / summary rows (e.g. "Total", "Grand Total", "Generated by...")
    const firstCell = String(row[0] || '').toLowerCase().trim();
    if (firstCell.startsWith('total') || firstCell.startsWith('grand total') || firstCell.startsWith('page ')) {
      return false;
    }
    // Must have at least 1 non-empty cell
    return row.some(c => String(c || '').trim().length > 0);
  });

  return {
    sourceName,
    headerRowIndex: bestHeaderIndex,
    headers: rawHeaders,
    rawRows: dataRows,
    totalRows: dataRows.length,
    sampleRows: dataRows.slice(0, 5)
  };
}
