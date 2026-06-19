/**
 * state.js
 * Central in-memory state. All modules import from here.
 * Mutations go through the exported setters so storage stays in sync.
 */
 
import { loadTransactions, saveTransactions, loadSettings, saveSettings } from './storage.js';
 
let transactions = [];
let settings     = {};
 
/**
 * Boot: pull everything from localStorage into memory.
 */
export function init() {
  transactions = loadTransactions();
  settings     = loadSettings();
}
 
/* ── TRANSACTIONS ──────────────────────────────────────── */
 
export function getTransactions() {
  return transactions;
}
 
export function addTransaction(tx) {
  transactions.push(tx);
  saveTransactions(transactions);
}
 
export function updateTransaction(id, fields) {
  const idx = transactions.findIndex(t => t.id === id);
  if (idx === -1) return false;
  transactions[idx] = { ...transactions[idx], ...fields, updatedAt: new Date().toISOString() };
  saveTransactions(transactions);
  return true;
}
 
export function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions(transactions);
}
 
/**
 * Replace all transactions (used after import).
 */
export function replaceTransactions(newData) {
  transactions = newData;
  saveTransactions(transactions);
}
 
/* ── SETTINGS ──────────────────────────────────────────── */
 
export function getSettings() {
  return settings;
}
 
export function updateSettings(partial) {
  settings = { ...settings, ...partial };
  saveSettings(settings);
}
 
/* ── HELPERS ───────────────────────────────────────────── */
 
/**
 * Generate a unique id like "rec_0012".
 */
export function generateId() {
  const max = transactions.length
    ? Math.max(...transactions.map(t => parseInt(t.id.replace('rec_', ''), 10) || 0))
    : 0;
  return `rec_${String(max + 1).padStart(4, '0')}`;
}
 
/**
 * Get the currency symbol for display.
 */
export function getCurrencySymbol(code) {
  const map = { USD: '$', EUR: '€', GBP: '£', RWF: 'RWF ', KES: 'KSh ', NGN: '₦' };
  return map[code] || code + ' ';
}
 
/**
 * Convert an amount from USD to the current base currency.
 * All amounts are stored in USD internally.
 */
export function convertAmount(amountUSD) {
  const { baseCurrency, rates } = settings;
  if (baseCurrency === 'USD') return amountUSD;
  const rate = rates[baseCurrency];
  if (!rate || isNaN(rate)) return amountUSD;
  return amountUSD * rate;
}
 
/**
 * Format a number with the current currency symbol.
 */
export function formatCurrency(amountUSD) {
  const converted  = convertAmount(amountUSD);
  const symbol     = getCurrencySymbol(settings.baseCurrency);
  return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}