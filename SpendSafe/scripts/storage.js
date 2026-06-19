/**
 * storage.js
 * Handles all localStorage operations.
 * Keys: 'ss_transactions', 'ss_settings'
 */
 
const KEYS = {
  transactions: 'ss_transactions',
  settings:     'ss_settings',
};
 
/**
 * Load transactions from localStorage.
 * Returns an array (empty if nothing stored or data is corrupt).
 */
export function loadTransactions() {
  try {
    const raw = localStorage.getItem(KEYS.transactions);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
 
/**
 * Save transactions array to localStorage.
 * @param {Array} data
 */
export function saveTransactions(data) {
  localStorage.setItem(KEYS.transactions, JSON.stringify(data));
}
 
/**
 * Load settings object from localStorage.
 * Returns defaults if nothing stored.
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw);
    // Merge with defaults so new keys always exist
    return { ...defaultSettings(), ...parsed };
  } catch {
    return defaultSettings();
  }
}
 
/**
 * Save settings object to localStorage.
 * @param {Object} settings
 */
export function saveSettings(settings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}
 
/**
 * Wipe all app data from localStorage.
 */
export function clearAll() {
  localStorage.removeItem(KEYS.transactions);
  localStorage.removeItem(KEYS.settings);
}
 
/**
 * Default settings shape.
 */
function defaultSettings() {
  return {
    baseCurrency: 'USD',
    rates: {
      EUR: 0.92,
      GBP: 0.79,
      RWF: 1340,
      KES: 129,
      NGN: 1600,
    },
    monthlyCap: null,
    categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'],
  };
}