/**
 * ui.js
 * All DOM rendering and manipulation lives here.
 * Nothing in this file mutates state directly — it calls back to main.js via events or callbacks.
 */
 
import { getTransactions, getSettings, formatCurrency, getCurrencySymbol } from './state.js';
import { highlight, escapeHtml } from './search.js';
 
/* ── DASHBOARD ─────────────────────────────────────────── */
 
/**
 * Refresh all dashboard stats, chart, category breakdown, and budget bar.
 */
export function renderDashboard() {
  const txs      = getTransactions();
  const settings = getSettings();
  const now      = new Date();
 
  // ── Total count
  document.getElementById('stat-total-count').textContent = txs.length;
 
  // ── Total spent (all time)
  const totalUSD = txs.reduce((sum, t) => sum + t.amount, 0);
  document.getElementById('stat-total-spent').textContent = formatCurrency(totalUSD).replace(/^[^0-9]*/, '');
  document.getElementById('stat-currency-symbol').textContent = settings.baseCurrency;
 
  // ── Top category
  const catTotals = {};
  txs.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('stat-top-category').textContent = topCat ? topCat[0] : '—';
 
  // ── Last 7 days total
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const weekTxs = txs.filter(t => new Date(t.date) >= sevenDaysAgo);
  const weekUSD = weekTxs.reduce((sum, t) => sum + t.amount, 0);
  document.getElementById('stat-week-total').textContent = formatCurrency(weekUSD).replace(/^[^0-9]*/, '');
 
  // ── Budget bar
  renderBudgetBar(totalUSD, settings);
 
  // ── 7-day trend chart
  renderTrendChart(txs, now);
 
  // ── Category breakdown
  renderCategoryBreakdown(txs, catTotals, totalUSD);
}
 
function renderBudgetBar(totalUSD, settings) {
  const cap    = parseFloat(settings.monthlyCap);
  const capEl  = document.getElementById('budget-cap-display');
  const barEl  = document.getElementById('budget-bar');
  const wrapEl = document.getElementById('budget-bar-wrap');
  const msgEl  = document.getElementById('budget-status');
 
  // Get current month transactions only
  const now = new Date();
  const txs = getTransactions();
  const monthUSD = txs
    .filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((s, t) => s + t.amount, 0);
 
  if (!cap || isNaN(cap)) {
    capEl.textContent  = 'No budget set';
    barEl.style.width  = '0%';
    barEl.classList.remove('over');
    msgEl.textContent  = 'Set a monthly budget in Settings to track your spending.';
    msgEl.className    = 'budget-status';
    wrapEl.setAttribute('aria-valuenow', 0);
    return;
  }
 
  const pct     = Math.min((monthUSD / cap) * 100, 100);
  const over    = monthUSD > cap;
  const sym     = getCurrencySymbol(settings.baseCurrency);
  const spent   = formatCurrency(monthUSD);
  const capFmt  = `${sym}${cap.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
 
  capEl.textContent = `${spent} / ${capFmt}`;
  barEl.style.width = `${pct}%`;
  barEl.classList.toggle('over', over);
  wrapEl.setAttribute('aria-valuenow', Math.round(pct));
 
  if (over) {
    const overage = formatCurrency(monthUSD - cap);
    msgEl.textContent  = `⚠ You are ${overage} over your monthly budget!`;
    msgEl.className    = 'budget-status over';
    msgEl.setAttribute('role', 'alert');
    msgEl.setAttribute('aria-live', 'assertive');
  } else {
    const remaining = formatCurrency(cap - monthUSD);
    msgEl.textContent  = `${remaining} remaining this month.`;
    msgEl.className    = 'budget-status under';
    msgEl.setAttribute('role', 'status');
    msgEl.setAttribute('aria-live', 'polite');
  }
}
 
function renderTrendChart(txs, now) {
  const chartWrap = document.getElementById('trend-chart');
  const labelsWrap = document.getElementById('chart-labels');
 
  // Build array of last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    const dateStr = d.toISOString().slice(0, 10);
    const total = txs.filter(t => t.date === dateStr).reduce((s, t) => s + t.amount, 0);
    days.push({ label, total });
  }
 
  const maxAmt = Math.max(...days.map(d => d.total), 1);
 
  chartWrap.innerHTML = '';
  labelsWrap.innerHTML = '';
 
  days.forEach(({ label, total }) => {
    const pct = (total / maxAmt) * 100;
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = `${pct}%`;
    bar.setAttribute('data-amount', formatCurrency(total));
    bar.setAttribute('title', `${label}: ${formatCurrency(total)}`);
    chartWrap.appendChild(bar);
 
    const lbl = document.createElement('div');
    lbl.className = 'chart-label';
    lbl.textContent = label;
    labelsWrap.appendChild(lbl);
  });
}
 
function renderCategoryBreakdown(txs, catTotals, grandTotal) {
  const listEl = document.getElementById('category-breakdown');
  listEl.innerHTML = '';
 
  if (!txs.length) {
    listEl.innerHTML = '<li class="empty-state">No transactions yet. <a href="#add" data-page="add" class="inline-link">Add one now →</a></li>';
    return;
  }
 
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([cat, amt]) => {
    const pct = grandTotal > 0 ? (amt / grandTotal) * 100 : 0;
    const li = document.createElement('li');
    li.className = 'category-row';
    li.innerHTML = `
      <span class="category-row-name">${escapeHtml(cat)}</span>
      <div class="category-row-bar-wrap" role="presentation">
        <div class="category-row-bar" style="width:${pct}%"></div>
      </div>
      <span class="category-row-amt">${formatCurrency(amt)}</span>
    `;
    listEl.appendChild(li);
  });
}
 
/* ── TRANSACTIONS TABLE ────────────────────────────────── */
 
/**
 * Render the transactions table with optional filtering and search highlighting.
 * @param {{ sortKey?: string, sortDir?: string, regex?: RegExp|null, caseFlag?: string }} options
 */
export function renderTransactions({ sortKey = 'date', sortDir = 'desc', regex = null } = {}) {
  const tbody     = document.getElementById('transactions-tbody');
  const emptyMsg  = document.getElementById('empty-table-msg');
  const countEl   = document.getElementById('results-count');
  let txs         = [...getTransactions()];
 
  // ── Filter by regex (search across description and category)
  if (regex) {
    txs = txs.filter(t => regex.test(t.description) || regex.test(t.category));
  }
 
  // ── Sort
  txs.sort((a, b) => {
    let av, bv;
    switch (sortKey) {
      case 'date':   av = a.date;        bv = b.date;        break;
      case 'desc':   av = a.description; bv = b.description; break;
      case 'amount': av = a.amount;      bv = b.amount;      break;
      default:       av = a.date;        bv = b.date;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1  : -1;
    return 0;
  });
 
  // ── Results count
  const total = getTransactions().length;
  if (regex) {
    countEl.textContent = `Showing ${txs.length} of ${total} transaction${total !== 1 ? 's' : ''}`;
  } else {
    countEl.textContent = `${total} transaction${total !== 1 ? 's' : ''}`;
  }
 
  // ── Empty state
  if (!txs.length) {
    tbody.innerHTML = '';
    emptyMsg.hidden = false;
    return;
  }
  emptyMsg.hidden = true;
 
  // ── Render rows
  tbody.innerHTML = '';
  txs.forEach(tx => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', tx.id);
 
    const descHtml   = highlight(tx.description, regex);
    const catHtml    = highlight(tx.category, regex);
    const dateLabel  = tx.date;
    const amtDisplay = formatCurrency(tx.amount);
 
    tr.innerHTML = `
      <td class="td-desc">${descHtml}</td>
      <td class="td-amount">${escapeHtml(amtDisplay)}</td>
      <td class="td-category"><span class="tag">${catHtml}</span></td>
      <td class="td-date">${escapeHtml(dateLabel)}</td>
      <td class="td-actions">
        <button
          class="btn-icon edit"
          data-action="edit"
          data-id="${escapeHtml(tx.id)}"
          aria-label="Edit transaction: ${escapeHtml(tx.description)}"
        >Edit</button>
        <button
          class="btn-icon delete"
          data-action="delete"
          data-id="${escapeHtml(tx.id)}"
          aria-label="Delete transaction: ${escapeHtml(tx.description)}"
        >Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
 
/* ── SETTINGS FORM ─────────────────────────────────────── */
 
/**
 * Populate all settings form fields from state.
 */
export function populateSettingsForm() {
  const s = getSettings();
 
  document.getElementById('base-currency').value = s.baseCurrency || 'USD';
  document.getElementById('rate-eur').value       = s.rates?.EUR ?? '';
  document.getElementById('rate-gbp').value       = s.rates?.GBP ?? '';
  document.getElementById('rate-rwf').value       = s.rates?.RWF ?? '';
  document.getElementById('rate-kes').value       = s.rates?.KES ?? '';
  document.getElementById('rate-ngn').value       = s.rates?.NGN ?? '';
  document.getElementById('monthly-cap').value    = s.monthlyCap ?? '';
 
  renderCategoriesList();
}
 
/**
 * Re-render the category tags list in Settings.
 */
export function renderCategoriesList() {
  const listEl = document.getElementById('categories-list');
  const cats   = getSettings().categories || [];
  listEl.innerHTML = '';
  cats.forEach((cat, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="cat-tag">
        ${escapeHtml(cat)}
        <button
          class="cat-tag-remove"
          type="button"
          data-index="${i}"
          aria-label="Remove category ${escapeHtml(cat)}"
        >×</button>
      </span>
    `;
    listEl.appendChild(li);
  });
}
 
/**
 * Populate the category <select> in the Add/Edit form.
 */
export function populateCategorySelect() {
  const select = document.getElementById('input-category');
  const cats   = getSettings().categories || [];
  const current = select.value;
  select.innerHTML = '<option value="">-- Select a category --</option>';
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value       = cat;
    opt.textContent = cat;
    if (cat === current) opt.selected = true;
    select.appendChild(opt);
  });
}
 
/* ── ADD/EDIT FORM ─────────────────────────────────────── */
 
/**
 * Reset the form to "Add" mode.
 */
export function resetForm() {
  document.getElementById('transaction-form').reset();
  document.getElementById('edit-id').value            = '';
  document.getElementById('add-heading').textContent  = 'Add Transaction';
  document.getElementById('form-subtitle').textContent = 'Fill in the details below';
  document.getElementById('submit-btn').textContent   = 'Add Transaction';
  document.getElementById('cancel-edit-btn').hidden   = true;
  document.getElementById('form-success').hidden      = true;
  document.getElementById('form-error-banner').hidden = true;
  document.getElementById('dup-word-group').hidden    = true;
 
  // Clear all error/valid states
  ['input-description', 'input-amount', 'input-date'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('valid', 'invalid');
  });
  clearFieldError('input-description', 'desc-error');
  clearFieldError('input-amount', 'amount-error');
  clearFieldError('input-date', 'date-error');
  clearFieldError('input-category', 'cat-error');
  updateAmountPrefix();
}
 
/**
 * Populate form fields for editing an existing transaction.
 * @param {Object} tx
 */
export function populateEditForm(tx) {
  document.getElementById('edit-id').value             = tx.id;
  document.getElementById('input-description').value   = tx.description;
  document.getElementById('input-amount').value        = tx.amount.toString();
  document.getElementById('input-date').value          = tx.date;
  document.getElementById('add-heading').textContent   = 'Edit Transaction';
  document.getElementById('form-subtitle').textContent = `Editing: ${tx.description}`;
  document.getElementById('submit-btn').textContent    = 'Save Changes';
  document.getElementById('cancel-edit-btn').hidden    = false;
  document.getElementById('form-success').hidden       = true;
  document.getElementById('form-error-banner').hidden  = true;
 
  // Set category select
  const select = document.getElementById('input-category');
  select.value = tx.category;
  updateAmountPrefix();
}
 
/**
 * Show an inline field error.
 */
export function showFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const errEl = document.getElementById(errorId);
  if (input) { input.classList.add('invalid'); input.classList.remove('valid'); }
  if (errEl)  errEl.textContent = message;
}
 
/**
 * Clear an inline field error and mark as valid.
 */
export function clearFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const errEl = document.getElementById(errorId);
  if (input) { input.classList.remove('invalid'); }
  if (errEl)  errEl.textContent = '';
}
 
/**
 * Mark a field as valid (green border).
 */
export function markFieldValid(inputId) {
  const input = document.getElementById(inputId);
  if (input) { input.classList.add('valid'); input.classList.remove('invalid'); }
}
 
/**
 * Show the form-level error banner.
 */
export function showFormError(message) {
  const banner = document.getElementById('form-error-banner');
  banner.textContent = message;
  banner.hidden = false;
}
 
/**
 * Show form success message.
 */
export function showFormSuccess(message) {
  const el = document.getElementById('form-success');
  el.textContent = message;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 3000);
}
 
/**
 * Update the currency prefix shown next to the amount input.
 */
export function updateAmountPrefix() {
  const { baseCurrency } = getSettings();
  const sym = getCurrencySymbol(baseCurrency);
  const prefixEl = document.getElementById('amount-prefix');
  if (prefixEl) prefixEl.textContent = sym;
}
 
/* ── MODAL ─────────────────────────────────────────────── */
 
let _deleteCallback = null;
 
/**
 * Show the confirm-delete modal.
 * @param {string} description  - Transaction description to show in the modal body
 * @param {Function} onConfirm  - Called if user clicks "Yes, Delete"
 */
export function showDeleteModal(description, onConfirm) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-body').textContent = `Delete "${description}"? This cannot be undone.`;
  _deleteCallback = onConfirm;
  overlay.hidden = false;
  document.getElementById('modal-confirm-btn').focus();
}
 
/**
 * Hide the confirm-delete modal.
 */
export function hideDeleteModal() {
  document.getElementById('modal-overlay').hidden = true;
  _deleteCallback = null;
}
 
/**
 * Wire up modal confirm/cancel buttons. Call once during init.
 */
export function initModal() {
  document.getElementById('modal-confirm-btn').addEventListener('click', () => {
    if (_deleteCallback) _deleteCallback();
    hideDeleteModal();
  });
  document.getElementById('modal-cancel-btn').addEventListener('click', hideDeleteModal);
 
  // Close on overlay click
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideDeleteModal();
  });
 
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideDeleteModal();
  });
}
 
/* ── PAGE NAVIGATION ───────────────────────────────────── */
 
/**
 * Switch the visible page section and update nav link active states.
 * @param {string} pageId  - e.g. 'dashboard', 'transactions', 'add', 'settings', 'about'
 */
export function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.hidden = true;
  });
 
  const target = document.getElementById(`page-${pageId}`);
  if (target) {
    target.classList.add('active');
    target.hidden = false;
  }
 
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });
}