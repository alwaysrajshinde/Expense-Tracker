const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function generatePdf() {
  const mdPath = path.resolve(__dirname, '../docs/Expense_Tracker_Business_Requirements_Document.md');
  const pdfPath = path.resolve(__dirname, '../docs/Expense_Tracker_Business_Requirements_Document.pdf');

  if (!fs.existsSync(mdPath)) {
    console.error('Markdown file not found:', mdPath);
    process.exit(1);
  }

  const mdContent = fs.readFileSync(mdPath, 'utf8');

  // Fetch marked from CDN or embed basic marked script
  const markedRes = await fetch('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
  const markedJs = await markedRes.text();

  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Expense Tracker - Business Requirements Document</title>
  <script>${markedJs}</script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    @page {
      size: A4;
      margin: 22mm 16mm 22mm 16mm;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 10pt;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      font-weight: 700;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 20pt;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24pt;
      margin-bottom: 12pt;
      color: #0f172a;
    }

    /* Page breaks for major sections */
    h1:not(:first-of-type) {
      page-break-before: always;
      break-before: page;
    }

    h2 {
      font-size: 14pt;
      margin-top: 18pt;
      margin-bottom: 8pt;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
      color: #1e3a8a;
    }

    h3 {
      font-size: 11.5pt;
      margin-top: 14pt;
      margin-bottom: 6pt;
      color: #1e293b;
    }

    h4 {
      font-size: 10.5pt;
      margin-top: 10pt;
      margin-bottom: 4pt;
    }

    p {
      margin-top: 0;
      margin-bottom: 8pt;
      text-align: justify;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 8pt;
      padding-left: 20px;
    }

    li {
      margin-bottom: 3pt;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8pt;
      margin-bottom: 12pt;
      font-size: 8.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    blockquote {
      border-left: 4px solid #3b82f6;
      margin: 8pt 0;
      padding: 6pt 12pt;
      background-color: #eff6ff;
      color: #1e3a8a;
      border-radius: 0 4px 4px 0;
      page-break-inside: avoid;
    }

    blockquote p {
      margin: 0;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 8.5pt;
      background-color: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
      color: #0f172a;
    }

    pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 10pt;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 8pt;
      page-break-inside: avoid;
    }

    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 16pt 0;
    }

    /* Requirement Badges / Styling */
    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 600;
      text-transform: uppercase;
    }

    /* Title Block */
    .doc-header {
      text-align: center;
      padding: 30pt 0 20pt 0;
      border-bottom: 3px double #cbd5e1;
      margin-bottom: 24pt;
    }

    .doc-title {
      font-size: 24pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8pt;
      letter-spacing: -0.5px;
    }

    .doc-subtitle {
      font-size: 13pt;
      color: #475569;
      margin-bottom: 16pt;
    }
  </style>
</head>
<body>
  <div id="content"></div>
  <script>
    const markdown = ${JSON.stringify(mdContent)};
    document.getElementById('content').innerHTML = marked.parse(markdown);
  </script>
</body>
</html>`;

  console.log('Launching headless Chromium via Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Setting page content...');
  await page.setContent(htmlTemplate, { waitUntil: 'networkidle' });

  console.log('Generating PDF to:', pdfPath);
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '24mm',
      bottom: '22mm',
      left: '16mm',
      right: '16mm'
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 7.5pt; color: #64748b; font-family: 'Inter', -apple-system, sans-serif; width: 100%; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin: 0 16mm; display: flex; justify-content: space-between;">
        <span><strong>EXPENSE TRACKER</strong> | Business Requirements Document (BRD)</span>
        <span>Version 1.0 (Nov 2026)</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 7.5pt; color: #64748b; font-family: 'Inter', -apple-system, sans-serif; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 3px; margin: 0 16mm; display: flex; justify-content: space-between;">
        <span>CONFIDENTIAL &amp; PROPRIETARY — STRICTLY FOR INTERNAL GOVERNANCE</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `
  });

  await browser.close();
  const stats = fs.statSync(pdfPath);
  console.log(`PDF successfully generated! File size: ${(stats.size / 1024).toFixed(1)} KB`);
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
