/**
 * search.js
 * Safe regex compiler and match highlighting for the transactions table.
 */
 
/**
 * Safely compile a regex from user input.
 * Returns null if input is empty or pattern is invalid.
 *
 * @param {string} input  - Raw string from search box (can be a pattern like /(coffee|tea)/i)
 * @param {string} flags  - Default flags to apply when no inline flags are given
 * @returns {{ re: RegExp|null, error: string|null }}
 */
export function compileRegex(input, flags = 'i') {
  if (!input || input.trim() === '') return { re: null, error: null };
 
  const raw = input.trim();
 
  // Detect if user typed a /pattern/flags literal
  const literalMatch = raw.match(/^\/(.+)\/([gimsuy]*)$/);
  if (literalMatch) {
    try {
      return { re: new RegExp(literalMatch[1], literalMatch[2] || flags), error: null };
    } catch (e) {
      return { re: null, error: `Invalid regex: ${e.message}` };
    }
  }
 
  // Otherwise treat the raw string as a plain pattern (auto-escape special chars is NOT done here,
  // so power users can still type raw patterns like \b(\w+)\s+\1\b directly)
  try {
    return { re: new RegExp(raw, flags), error: null };
  } catch (e) {
    return { re: null, error: `Invalid regex: ${e.message}` };
  }
}
 
/**
 * Wrap all regex matches in <mark> tags for accessible highlighting.
 * Does NOT escape HTML in the base text (caller must ensure text is safe text content).
 *
 * @param {string} text  - Plain text to search within
 * @param {RegExp|null} re
 * @returns {string}  - HTML string with <mark> tags around matches
 */
export function highlight(text, re) {
  if (!re || !text) return escapeHtml(text || '');
  // We work on the plain text, escaping it first, then apply marks
  const escaped = escapeHtml(text);
  // Build a version of the regex that works on the escaped text.
  // Since escapeHtml only changes & < > " ', and user patterns typically won't
  // target those chars in transaction text, this approach is safe for our domain.
  try {
    return escaped.replace(re, (m) => `<mark>${m}</mark>`);
  } catch {
    return escaped;
  }
}
 
/**
 * Minimal HTML escaper to prevent XSS when injecting text into innerHTML.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}