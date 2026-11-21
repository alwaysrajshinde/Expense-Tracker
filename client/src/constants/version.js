/**
 * Centralized Application Version & Release Metadata
 * Single source of truth across Mobile, Desktop, Sidebar, and Release Notes
 */

export const APP_VERSION = 'v2.4.0';
export const APP_RELEASE_DATE = 'November 21, 2026';
export const APP_SHORT_DATE = '21 Nov 2026';
export const APP_BUILD_TIMESTAMP = '2026-11-21T22:15:00+05:30';

// Inked version string combining version number and exact release date
export const APP_INKED_VERSION = `${APP_VERSION} · Updated ${APP_RELEASE_DATE}`;
export const APP_INKED_SHORT = `${APP_VERSION} (${APP_SHORT_DATE})`;

export const APP_EDITION = 'Windows & Android Edition · Offline-First';

export default {
  version: APP_VERSION,
  releaseDate: APP_RELEASE_DATE,
  shortDate: APP_SHORT_DATE,
  timestamp: APP_BUILD_TIMESTAMP,
  inkedVersion: APP_INKED_VERSION,
  inkedShort: APP_INKED_SHORT,
  edition: APP_EDITION
};
