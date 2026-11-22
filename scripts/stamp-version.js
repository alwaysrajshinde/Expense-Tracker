/**
 * Automatic Version & Release Timestamp Stamper
 * Runs before build, before git commit, and before git push to guarantee
 * that release date, time, and version metadata are always 100% current.
 */

const fs = require('fs');
const path = require('path');

function stamp() {
  const rootDir = path.resolve(__dirname, '..');
  const clientPkgPath = path.join(rootDir, 'client', 'package.json');
  const rootPkgPath = path.join(rootDir, 'package.json');
  const versionFilePath = path.join(rootDir, 'client', 'src', 'constants', 'version.js');

  // Read current version
  let version = 'v2.4.2';
  try {
    const clientPkg = JSON.parse(fs.readFileSync(clientPkgPath, 'utf8'));
    version = `v${clientPkg.version || '2.4.2'}`;
  } catch (e) {}

  // Format current local timestamp (IST / System Local)
  const now = new Date();
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = now.getDate();
  const monthName = months[now.getMonth()];
  const shortMonth = shortMonths[now.getMonth()];
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' becomes '12'
  const formattedHours = String(hours).padStart(2, '0');

  const releaseDate = `${monthName} ${day}, ${year}`;
  const shortDate = `${day} ${shortMonth} ${year}`;
  const releaseTime = `${formattedHours}:${minutes} ${ampm}`;
  const inkedDateTime = `${shortDate}, ${releaseTime}`;
  const isoTimestamp = now.toISOString();

  const changelogSummary = 'Mobile-first optimization, single-page expense modal, custom fintech dropdowns, unified reports analytics, and luxury welcome greeting.';

  const fileContent = `/**
 * Centralized Application Version & Release Metadata
 * Automatically updated on every build, commit, and push
 */

export const APP_VERSION = '${version}';
export const APP_RELEASE_DATE = '${releaseDate}';
export const APP_RELEASE_TIME = '${releaseTime}';
export const APP_SHORT_DATE = '${shortDate}';
export const APP_INKED_DATETIME = '${inkedDateTime}';
export const APP_BUILD_TIMESTAMP = '${isoTimestamp}';

// Inked version string combining version number and exact release date & time
export const APP_INKED_VERSION = \`\${APP_VERSION} · Updated \${APP_SHORT_DATE} at \${APP_RELEASE_TIME}\`;
export const APP_INKED_SHORT = \`\${APP_VERSION} (\${APP_SHORT_DATE}, \${APP_RELEASE_TIME})\`;

export const APP_CHANGELOG_SUMMARY = '${changelogSummary}';

export const APP_EDITION = 'Windows & Android Edition · Offline-First';

export default {
  version: APP_VERSION,
  releaseDate: APP_RELEASE_DATE,
  releaseTime: APP_RELEASE_TIME,
  shortDate: APP_SHORT_DATE,
  releaseTimeShort: APP_RELEASE_TIME,
  inkedDateTime: APP_INKED_DATETIME,
  timestamp: APP_BUILD_TIMESTAMP,
  inkedVersion: APP_INKED_VERSION,
  inkedShort: APP_INKED_SHORT,
  changelogSummary: APP_CHANGELOG_SUMMARY,
  edition: APP_EDITION
};
`;

  fs.writeFileSync(versionFilePath, fileContent, 'utf8');
  console.log(`[stamp-version] Successfully inked version: ${version} · ${inkedDateTime}`);
}

stamp();
