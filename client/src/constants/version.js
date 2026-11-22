/**
 * Centralized Application Version & Release Metadata
 * Single source of truth across Mobile, Desktop, Sidebar, and Release Notes
 */

export const APP_VERSION = 'v2.4.1';
export const APP_RELEASE_DATE = 'November 22, 2026';
export const APP_RELEASE_TIME = '01:57 PM';
export const APP_SHORT_DATE = '22 Nov 2026';
export const APP_INKED_DATETIME = '22 Nov 2026, 01:57 PM';
export const APP_BUILD_TIMESTAMP = '2026-11-22T13:57:29+05:30';

// Inked version string combining version number and exact release date & time
export const APP_INKED_VERSION = `${APP_VERSION} · Updated ${APP_SHORT_DATE} at ${APP_RELEASE_TIME}`;
export const APP_INKED_SHORT = `${APP_VERSION} (${APP_SHORT_DATE}, ${APP_RELEASE_TIME})`;

export const APP_CHANGELOG_SUMMARY = 'Mobile-first optimization, touch target enhancements, timestamped versioning, and Google Sheets upcoming integration preview.';

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
