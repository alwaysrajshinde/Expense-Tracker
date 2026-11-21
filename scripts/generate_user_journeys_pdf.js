const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function buildUnifiedPdf() {
  const dir = path.resolve(__dirname, '../docs/user-journeys');
  const files = [
    '01_First_Time_User_Journey.md',
    '02_Registration_And_Login_Scenarios.md',
    '03_Dashboard_And_Expense_Scenarios.md',
    '04_Account_And_Settings_Scenarios.md',
    '05_Data_Synchronization_Scenarios.md',
    '06_Reports_And_Backup_Scenarios.md',
    '07_Error_And_Exception_Scenarios.md',
    '08_Mobile_And_Desktop_Experience.md',
    '09_Complete_User_Scenario_Matrix.md'
  ];

  let combinedMd = '# Expense Tracker – Complete User Journey & Application Scenario Master Guide\n\n' +
    '**Reference:** `ET-UJ-2026-V1.0` | **Version:** 1.0.0 | **Date:** November 2026\n\n---\n\n';

  for (const f of files) {
    const filePath = path.join(dir, f);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      combinedMd += content + '\n\n<div style="page-break-after: always;"></div>\n\n';
    }
  }

  const markedRes = await fetch('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
  const markedJs = await markedRes.text();

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script>${markedJs}</script>
  <style>
    @page { size: A4; margin: 22mm 16mm 22mm 16mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 8.5pt; line-height: 1.5; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; page-break-after: avoid; }
    h1 { font-size: 18pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 20pt; }
    h2 { font-size: 13pt; color: #1e3a8a; border-bottom: 1px solid #f1f5f9; padding-bottom: 3px; }
    h3 { font-size: 10.5pt; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 7.5pt; page-break-inside: avoid; }
    th, td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) td { background: #f8fafc; }
    code { font-family: Consolas, Monaco, monospace; font-size: 7.5pt; background: #f1f5f9; padding: 1px 3px; border-radius: 3px; }
    pre { background: #0f172a; color: #f8fafc; padding: 8pt; border-radius: 4px; font-size: 7.5pt; page-break-inside: avoid; }
    pre code { background: none; color: inherit; }
    blockquote { border-left: 3px solid #3b82f6; margin: 6pt 0; padding: 4pt 8pt; background: #eff6ff; color: #1e3a8a; }
  </style>
</head>
<body>
  <div id="content"></div>
  <script>
    document.getElementById("content").innerHTML = marked.parse(${JSON.stringify(combinedMd)});
  </script>
</body>
</html>`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  const outPdf = path.join(dir, 'Expense_Tracker_Complete_User_Journeys.pdf');
  await page.pdf({
    path: outPdf,
    format: 'A4',
    printBackground: true,
    margin: { top: '22mm', bottom: '20mm', left: '15mm', right: '15mm' },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 7.5pt; color: #64748b; font-family: sans-serif; width: 100%; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin: 0 15mm; display: flex; justify-content: space-between;">
        <span><strong>EXPENSE TRACKER</strong> | User Journey &amp; Scenario Specification</span>
        <span>Version 1.0 (Nov 2026)</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 7.5pt; color: #64748b; font-family: sans-serif; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 3px; margin: 0 15mm; display: flex; justify-content: space-between;">
        <span>CONFIDENTIAL &amp; PROPRIETARY — INTERNAL SPECIFICATION</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `
  });
  await browser.close();
  const stat = fs.statSync(outPdf);
  console.log('Generated unified PDF:', outPdf, `(${(stat.size / 1024).toFixed(1)} KB)`);
}

buildUnifiedPdf().catch(err => {
  console.error('PDF error:', err);
  process.exit(1);
});
