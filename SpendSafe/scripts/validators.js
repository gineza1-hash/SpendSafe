/**
 * validators.js
 * All regex-based validation rules for form fields.
 *
 * REGEX CATALOG
 * ─────────────────────────────────────────────────────────
 * 1. DESCRIPTION
 *    Pattern : /^\S(?:.*\S)?$/
 *    Purpose : No leading/trailing whitespace; allows single non-space chars.
 *    Example : "Lunch at cafeteria" ✓  "  Lunch " ✗
 *
 * 2. AMOUNT
 *    Pattern : /^(0|[1-9]\d*)(\.\d{1,2})?$/
 *    Purpose : Non-negative decimal, max 2 decimal places, no leading zeros (except "0.xx").
 *    Example : "12.50" ✓  "012.5" ✗  "12.500" ✗
 *
 * 3. DATE
 *    Pattern : /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
 *    Purpose : YYYY-MM-DD with valid month and day ranges.
 *    Example : "2025-09-29" ✓  "2025-13-01" ✗  "25-09-29" ✗
 *
 * 4. CATEGORY / TAG
 *    Pattern : /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/
 *    Purpose : Letters only; words separated by a space or hyphen.
 *    Example : "Food" ✓  "Coffee-Shop" ✓  "café" ✗  "Food2" ✗
 *
 * 5. DUPLICATE WORD (ADVANCED – back-reference)
 *    Pattern : /\b(\w+)\s+\1\b/i
 *    Purpose : Detects accidentally repeated words ("the the", "lunch lunch").
 *    Example : "lunch lunch at cafe" → match found → warn user
 *
 * 6. RATE (numeric, positive)
 *    Pattern : /^(0|[1-9]\d*)(\.\d+)?$/
 *    Purpose : Any positive number for exchange rates (more decimal freedom than amount).
 *    Example : "0.92" ✓  "-1" ✗
 */
 
/* ── PATTERNS (exported so tests.html can import them) ── */
export const PATTERNS = {
  description: /^\S(?:.*\S)?$/,
  amount:      /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date:        /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  category:    /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  dupWord:     /\b(\w+)\s+\1\b/i,  // back-reference (advanced)
  rate:        /^(0|[1-9]\d*)(\.\d+)?$/,
};
 
/* ── FIELD VALIDATORS ─────────────────────────────────── */
 
/**
 * Validate a transaction description.
 * @param {string} value
 * @returns {{ valid: boolean, message: string }}
 */
export function validateDescription(value) {
  if (!value || value.trim() === '') {
    return { valid: false, message: 'Description is required.' };
  }
  if (value.length > 100) {
    return { valid: false, message: 'Description must be 100 characters or fewer.' };
  }
  if (!PATTERNS.description.test(value)) {
    return { valid: false, message: 'No leading or trailing spaces allowed.' };
  }
  return { valid: true, message: '' };
}
 
/**
 * Validate an amount string.
 * @param {string} value
 * @returns {{ valid: boolean, message: string }}
 */
export function validateAmount(value) {
  if (!value || value.trim() === '') {
    return { valid: false, message: 'Amount is required.' };
  }
  if (!PATTERNS.amount.test(value.trim())) {
    return { valid: false, message: 'Enter a valid positive number (e.g. 12.50). Max 2 decimal places.' };
  }
  if (parseFloat(value) <= 0) {
    return { valid: false, message: 'Amount must be greater than 0.' };
  }
  return { valid: true, message: '' };
}
 
/**
 * Validate a YYYY-MM-DD date string.
 * @param {string} value
 * @returns {{ valid: boolean, message: string }}
 */
export function validateDate(value) {
  if (!value || value.trim() === '') {
    return { valid: false, message: 'Date is required.' };
  }
  if (!PATTERNS.date.test(value.trim())) {
    return { valid: false, message: 'Date must be in YYYY-MM-DD format (e.g. 2025-09-29).' };
  }
  // Check it's actually a real date (catches Feb 30 etc.)
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() + 1 !== m || dt.getDate() !== d) {
    return { valid: false, message: 'That date does not exist (e.g. Feb 30 is not valid).' };
  }
  return { valid: true, message: '' };
}
 
/**
 * Validate a category/tag string.
 * @param {string} value
 * @returns {{ valid: boolean, message: string }}
 */
export function validateCategory(value) {
  if (!value || value.trim() === '') {
    return { valid: false, message: 'Please select or enter a category.' };
  }
  return { valid: true, message: '' };
}
 
/**
 * Validate a new category name (used in Settings).
 * @param {string} value
 * @returns {{ valid: boolean, message: string }}
 */
export function validateCategoryName(value) {
  if (!value || value.trim() === '') {
    return { valid: false, message: 'Category name cannot be empty.' };
  }
  if (!PATTERNS.category.test(value.trim())) {
    return { valid: false, message: 'Letters, spaces, and hyphens only (e.g. Coffee-Shop).' };
  }
  return { valid: true, message: '' };
}
 
/**
 * Validate an exchange rate string.
 * @param {string} value
 * @returns {{ valid: boolean, message: string }}
 */
export function validateRate(value) {
  if (value === '' || value === null || value === undefined) return { valid: true, message: '' }; // optional
  if (!PATTERNS.rate.test(String(value).trim())) {
    return { valid: false, message: 'Enter a positive number (e.g. 0.92).' };
  }
  if (parseFloat(value) <= 0) {
    return { valid: false, message: 'Rate must be greater than 0.' };
  }
  return { valid: true, message: '' };
}
 
/**
 * Validate a budget cap string. Must be a positive number or empty.
 * @param {string} value
 * @returns {{ valid: boolean, message: string }}
 */
export function validateCap(value) {
  if (value === '' || value === null) return { valid: true, message: '' }; // blank = disabled
  if (!PATTERNS.amount.test(String(value).trim())) {
    return { valid: false, message: 'Enter a valid positive number or leave blank to disable.' };
  }
  if (parseFloat(value) <= 0) {
    return { valid: false, message: 'Budget cap must be greater than 0.' };
  }
  return { valid: true, message: '' };
}
 
/**
 * Check for duplicate words in a description (advanced regex – back-reference).
 * @param {string} value
 * @returns {string|null} The matched duplicate word pair, or null.
 */
export function detectDuplicateWord(value) {
  const match = value.match(PATTERNS.dupWord);
  return match ? match[0] : null;
}
 
/**
 * Validate a full transaction object (used during JSON import).
 * @param {*} record
 * @returns {boolean}
 */
export function isValidImportRecord(record) {
  if (!record || typeof record !== 'object') return false;
  if (typeof record.id          !== 'string') return false;
  if (typeof record.description !== 'string') return false;
  if (typeof record.amount      !== 'number') return false;
  if (typeof record.category    !== 'string') return false;
  if (typeof record.date        !== 'string') return false;
  if (typeof record.createdAt   !== 'string') return false;
  if (typeof record.updatedAt   !== 'string') return false;
  return true;
}