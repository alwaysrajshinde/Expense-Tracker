/**
 * Welcome Session Service
 * Session-Aware Lifecycle Manager for the Welcome Back Motivational Greeting
 *
 * Requirements & Invariants:
 * 1. Shows the greeting strictly ONCE per application session.
 * 2. Suppressed across all page refreshes (F5, location.reload(), pull-to-refresh).
 * 3. Suppressed across internal navigation (Overview, Transactions, Reports, More).
 * 4. Suppressed across modal opens/closes, sub-tab switches, and component re-renders.
 * 5. Suppressed during Firebase auth state restoration and token refresh cycles.
 * 6. Automatically triggers when the user genuinely reopens the application in a new session
 *    (e.g., new browser window/tab, PWA cold launch after app close, or returning after extended inactivity).
 */

export const SESSION_GREETING_KEY = 'et_welcome_greeting_session_shown';
export const SESSION_ID_KEY = 'et_app_session_id';
export const LAST_ACTIVE_KEY = 'et_session_last_active_time';
export const INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes inactivity qualifies as return visit

// Process-level memory guard against React 18 StrictMode double-mounting or multiple rapid renders
let hasTriggeredInCurrentProcess = false;

/**
 * Generates a unique session ID
 * @returns {string}
 */
export function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Determines whether the Welcome Back greeting should be displayed.
 *
 * Evaluates:
 * 1. Memory guard for current JavaScript process.
 * 2. sessionStorage flag (persists across page reloads within the same session,
 *    but resets when the tab/window/PWA is closed).
 * 3. Extended inactivity threshold (> 30 min) in localStorage.
 *
 * @param {string} [userId]
 * @returns {boolean}
 */
export function shouldShowWelcomeGreeting(userId = null) {
  if (typeof window === 'undefined') return false;

  // 1. Memory guard: If already displayed in this runtime process, never duplicate
  if (hasTriggeredInCurrentProcess) {
    return false;
  }

  try {
    // 2. Check if already displayed in the current browser session
    // Note: sessionStorage survives page reloads (F5), but clears when the session ends
    const alreadyShown = sessionStorage.getItem(SESSION_GREETING_KEY);
    if (alreadyShown === 'true') {
      return false;
    }

    // 3. Extended inactivity check: If user returns after being inactive for > 30 minutes,
    // treat this as a returning session even if the browser kept the tab suspended.
    const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
    const now = Date.now();
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      if (!isNaN(lastActive) && (now - lastActive > INACTIVITY_THRESHOLD_MS)) {
        // Clear old session flag to allow a fresh welcome on return
        sessionStorage.removeItem(SESSION_GREETING_KEY);
        sessionStorage.removeItem(SESSION_ID_KEY);
      }
    }

    // Re-verify session storage
    if (sessionStorage.getItem(SESSION_GREETING_KEY) === 'true') {
      return false;
    }

    return true;
  } catch (err) {
    console.warn('WelcomeSessionService check fallback:', err);
    return false;
  }
}

/**
 * Marks the Welcome Back greeting as displayed for the active session.
 * Records the session flag in sessionStorage and timestamp in localStorage.
 */
export function markWelcomeGreetingShown() {
  hasTriggeredInCurrentProcess = true;
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(SESSION_GREETING_KEY, 'true');
    if (!sessionStorage.getItem(SESSION_ID_KEY)) {
      sessionStorage.setItem(SESSION_ID_KEY, generateSessionId());
    }
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch (err) {
    console.warn('WelcomeSessionService markShown error:', err);
  }
}

/**
 * Updates the session activity heartbeat in localStorage.
 * Call this during normal user interaction to maintain accurate active time.
 */
export function recordSessionActivity() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch (e) {}
}

/**
 * Resets the session greeting state.
 * Used on user logout or when an explicit fresh session is created.
 */
export function resetSessionGreeting() {
  hasTriggeredInCurrentProcess = false;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_GREETING_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
  } catch (e) {}
}

/**
 * Test helper: Simulates opening a brand-new application session (clears sessionStorage)
 */
export function simulateNewApplicationSession() {
  hasTriggeredInCurrentProcess = false;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_GREETING_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
  } catch (e) {}
}
