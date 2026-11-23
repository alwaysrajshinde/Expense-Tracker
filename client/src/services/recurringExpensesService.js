/**
 * Recurring Expenses & Subscriptions Service
 * 100% Client-Side Engine - Zero Server / Cron Cost (₹0 Budget Compliant)
 *
 * Provides:
 * - Persistent subscription registry in localStorage
 * - Deterministic billing cycle calculation (Weekly, Monthly, Yearly)
 * - Monthly burn-rate calculation for overview and budget tracking
 * - Advance renewal alerts for bills due within 7 days
 * - 1-Click reconciliation and instant ledger logging
 */

import { createTransaction } from './api';

const STORAGE_KEY = 'expense_tracker_recurring_subs';

// Initial starter templates for first-time users
const DEFAULT_SAMPLE_SUBSCRIPTIONS = [
  {
    id: 'sub_netflix_starter',
    name: 'Netflix Premium',
    amount: 499,
    category: 'Entertainment',
    frequency: 'monthly',
    billingDay: 15,
    paymentMethod: 'UPI',
    status: 'active',
    reminderDays: 7,
    notes: '4K Ultra HD streaming plan',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sub_broadband_starter',
    name: 'Airtel Xstream Fiber',
    amount: 825,
    category: 'Utilities',
    frequency: 'monthly',
    billingDay: 5,
    paymentMethod: 'Net Banking',
    status: 'active',
    reminderDays: 5,
    notes: '200 Mbps unlimited home broadband',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sub_amazon_prime_starter',
    name: 'Amazon Prime Annual',
    amount: 1499,
    category: 'Shopping',
    frequency: 'yearly',
    billingDay: 20,
    paymentMethod: 'Credit Card',
    status: 'active',
    reminderDays: 7,
    notes: 'Fast delivery & Prime Video streaming',
    createdAt: new Date().toISOString()
  }
];

/**
 * Calculates the next due date based on frequency and billing day
 * @param {string} frequency - 'weekly' | 'monthly' | 'yearly'
 * @param {number} billingDay - Day of month (1-31) or day of week (1-7)
 * @param {Date} [fromDate=new Date()]
 * @returns {string} ISO Date string YYYY-MM-DD
 */
export function calculateNextDueDate(frequency = 'monthly', billingDay = 1, fromDate = new Date()) {
  const base = new Date(fromDate);
  base.setHours(0, 0, 0, 0);

  const targetDay = Math.min(31, Math.max(1, parseInt(billingDay, 10) || 1));

  if (frequency === 'weekly') {
    // Next occurrence of specific day of week (1 = Monday, 7 = Sunday)
    const currentDay = base.getDay() || 7;
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    const next = new Date(base);
    next.setDate(base.getDate() + diff);
    return next.toISOString().slice(0, 10);
  }

  if (frequency === 'yearly') {
    let year = base.getFullYear();
    const month = base.getMonth(); // same month as base
    let candidate = new Date(year, month, targetDay);
    if (candidate <= base) {
      candidate = new Date(year + 1, month, targetDay);
    }
    return candidate.toISOString().slice(0, 10);
  }

  // Default: Monthly
  let year = base.getFullYear();
  let month = base.getMonth();

  // Clamp target day to last day of this month
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const clampedDayCurrent = Math.min(targetDay, daysInCurrentMonth);
  let candidate = new Date(year, month, clampedDayCurrent);

  if (candidate <= base) {
    // Advance to next month
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    const daysInNextMonth = new Date(year, month + 1, 0).getDate();
    const clampedDayNext = Math.min(targetDay, daysInNextMonth);
    candidate = new Date(year, month, clampedDayNext);
  }

  return candidate.toISOString().slice(0, 10);
}

/**
 * Retrieves all recurring subscriptions from localStorage
 * Initializes starter templates if completely uninitialized
 * @returns {Array<object>}
 */
export function getRecurringSubscriptions() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with sample templates
      const seeded = DEFAULT_SAMPLE_SUBSCRIPTIONS.map(sub => ({
        ...sub,
        nextDueDate: calculateNextDueDate(sub.frequency, sub.billingDay)
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load recurring subscriptions:', e);
    return [];
  }
}

/**
 * Saves or updates a subscription in localStorage
 * @param {object} subscription
 * @returns {Array<object>} Updated list
 */
export function saveRecurringSubscription(subscription) {
  const current = getRecurringSubscriptions();
  const now = new Date().toISOString();

  const nextDueDate = subscription.nextDueDate || calculateNextDueDate(
    subscription.frequency || 'monthly',
    subscription.billingDay || 1
  );

  let updated;
  if (subscription.id && current.some(s => s.id === subscription.id)) {
    updated = current.map(s => (s.id === subscription.id ? {
      ...s,
      ...subscription,
      nextDueDate,
      updatedAt: now
    } : s));
  } else {
    const newSub = {
      ...subscription,
      id: subscription.id || `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: subscription.status || 'active',
      nextDueDate,
      createdAt: now,
      updatedAt: now
    };
    updated = [newSub, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('recurring_subscriptions_updated', { detail: { subscriptions: updated } }));
  } catch (e) {
    console.error('Failed to save recurring subscriptions:', e);
  }
  return updated;
}

/**
 * Deletes a subscription by ID
 * @param {string} id
 * @returns {Array<object>} Updated list
 */
export function deleteRecurringSubscription(id) {
  const current = getRecurringSubscriptions();
  const updated = current.filter(s => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('recurring_subscriptions_updated', { detail: { subscriptions: updated } }));
  } catch (e) {
    console.error('Failed to delete subscription:', e);
  }
  return updated;
}

/**
 * Toggles subscription active/paused status
 * @param {string} id
 * @returns {Array<object>} Updated list
 */
export function toggleSubscriptionStatus(id) {
  const current = getRecurringSubscriptions();
  const updated = current.map(s => {
    if (s.id === id) {
      const nextStatus = s.status === 'paused' ? 'active' : 'paused';
      return {
        ...s,
        status: nextStatus,
        nextDueDate: nextStatus === 'active' ? calculateNextDueDate(s.frequency, s.billingDay) : s.nextDueDate,
        updatedAt: new Date().toISOString()
      };
    }
    return s;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('recurring_subscriptions_updated', { detail: { subscriptions: updated } }));
  } catch (e) {
    console.error('Failed to toggle subscription status:', e);
  }
  return updated;
}

/**
 * Calculates total monthly burn-rate and annual commitment
 * @param {Array<object>} [subscriptions]
 * @returns {{ monthlyTotal: number, yearlyTotal: number, activeCount: number, pausedCount: number }}
 */
export function calculateMonthlyBurnRate(subscriptions = null) {
  const list = subscriptions || getRecurringSubscriptions();
  let monthlyTotal = 0;
  let activeCount = 0;
  let pausedCount = 0;

  list.forEach(sub => {
    if (sub.status === 'paused') {
      pausedCount += 1;
      return;
    }
    activeCount += 1;
    const amount = Number(sub.amount) || 0;
    if (sub.frequency === 'yearly') {
      monthlyTotal += amount / 12;
    } else if (sub.frequency === 'weekly') {
      monthlyTotal += amount * 4.333; // Average weeks per month
    } else {
      // Monthly
      monthlyTotal += amount;
    }
  });

  const roundedMonthly = Math.round(monthlyTotal);
  return {
    monthlyTotal: roundedMonthly,
    yearlyTotal: Math.round(roundedMonthly * 12),
    activeCount,
    pausedCount
  };
}

/**
 * Finds all active subscriptions renewing within a threshold of days
 * @param {Array<object>} [subscriptions]
 * @param {number} [withinDays=7]
 * @returns {Array<object>}
 */
export function getUpcomingRenewals(subscriptions = null, withinDays = 7) {
  const list = subscriptions || getRecurringSubscriptions();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return list
    .filter(s => s.status === 'active' && s.nextDueDate)
    .map(sub => {
      const dueDate = new Date(sub.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffMs = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        ...sub,
        daysRemaining: diffDays,
        isOverdue: diffDays < 0,
        isDueToday: diffDays === 0
      };
    })
    .filter(item => item.daysRemaining >= 0 && item.daysRemaining <= withinDays)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Records a recurring subscription as a real expense transaction and advances its nextDueDate
 * @param {object} subscription
 * @param {string} [customDate]
 * @returns {Promise<object>} Created transaction
 */
export async function recordBillPaymentAsExpense(subscription, customDate = null) {
  const txDate = customDate || new Date().toISOString().slice(0, 10);
  const txData = {
    description: `${subscription.name} (Recurring)`,
    amount: Number(subscription.amount),
    category: subscription.category || 'Subscription',
    payment_method: subscription.paymentMethod || 'UPI',
    type: 'expense',
    date: txDate,
    notes: `Recurring ${subscription.frequency} bill logged. Next cycle auto-calculated.`
  };

  const createdTx = await createTransaction(txData);

  // Advance nextDueDate
  const advancedDate = calculateNextDueDate(
    subscription.frequency || 'monthly',
    subscription.billingDay || 1,
    new Date(Date.now() + 24 * 60 * 60 * 1000) // from tomorrow
  );

  saveRecurringSubscription({
    ...subscription,
    nextDueDate: advancedDate
  });

  return createdTx;
}
