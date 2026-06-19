/**
 * main.js
 * Entry point. Wires up all modules, handles all user events.
 */
 
import { init as initState, getTransactions, getSettings, updateSettings,
         addTransaction, updateTransaction, deleteTransaction, replaceTransactions,
         generateId } from './state.js';
 
import { renderDashboard, renderTransactions, populateSettingsForm,
         renderCategoriesList, populateCategorySelect, resetForm,
         populateEditForm, showFieldError, clearFieldError, markFieldValid,
         showFormError, showFormSuccess, updateAmountPrefix,
         showDeleteModal, hideDeleteModal, initModal, showPage } from './ui.js';
 
import { compileRegex, escapeHtml } from './search.js';
 
import { validateDescription, validateAmount, validateDate, validateCategory,
         validateCategoryName, validateRate, validateCap,
         detectDuplicateWord, isValidImportRecord } from './validators.js';
 
/* ── BOOT ─────────────────────────────────────────────── */
 
document.addEventListener('DOMContentLoaded', () => {
  initState();
  initModal();
  initNav();
  initHamburger();
  initForm();
  initSearch();
  initSort();
  initImportExport();
  initSettings();
  navigateTo(getCurrentPage());
});
 
/* ── NAVIGATION ───────────────────────────────────────── */
 
function getCurrentPage() {
  const hash = window.location.hash.replace('#', '');
  const valid = ['dashboard', 'transactions', 'add', 'settings', 'about'];
  return valid.includes(hash) ? hash : 'dashboard';
}
 
function navigateTo(pageId) {
  showPage(pageId);
  window.location.hash = pageId;
 
  switch (pageId) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'transactions':
      renderTransactions(getSortOptions());
      break;
    case 'add':
      populateCategorySelect();
      updateAmountPrefix();
      break;
    case 'settings':
      populateSettingsForm();
      break;
  }
  // Close mobile nav if open
  closeMobileNav();
}
 
function initNav() {
  // All links with data-page attribute
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (!link) return;
    e.preventDefault();
    navigateTo(link.dataset.page);
  });
 
  // Handle back/forward
  window.addEventListener('hashchange', () => {
    navigateTo(getCurrentPage());
  });
}
 
/* ── HAMBURGER ────────────────────────────────────────── */
 
function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const nav = document.getElementById('mobile-nav');
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    nav.hidden = open;
  });
}
 
function closeMobileNav() {
  const btn = document.getElementById('hamburger-btn');
  const nav = document.getElementById('mobile-nav');
  btn.setAttribute('aria-expanded', 'false');
  nav.hidden = true;
}
 
/* ── ADD / EDIT FORM ──────────────────────────────────── */
 
function initForm() {
  const form = document.getElementById('transaction-form');
  form.addEventListener('submit', handleFormSubmit);
 
  document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    resetForm();
    populateCategorySelect();
  });
 
  // Real-time validation on blur
  document.getElementById('input-description').addEventListener('blur', () => {
    liveValidateDesc();
  });
  document.getElementById('input-amount').addEventListener('blur', () => {
    liveValidateAmount();
  });
  document.getElementById('input-date').addEventListener('blur', () => {
    liveValidateDate();
  });
 
  // Duplicate word check on input (advanced regex)
  document.getElementById('input-description').addEventListener('input', () => {
    const val = document.getElementById('input-description').value;
    const dup = detectDuplicateWord(val);
    const group = document.getElementById('dup-word-group');
    const msg   = document.getElementById('dup-word-msg');
    if (dup) {
      msg.textContent = `⚠ Possible duplicate word detected: "${dup}" — did you mean to type that?`;
      group.hidden = false;
    } else {
      group.hidden = true;
    }
  });
}
 
function liveValidateDesc() {
  const val = document.getElementById('input-description').value;
  const res = validateDescription(val);
  if (!res.valid) showFieldError('input-description', 'desc-error', res.message);
  else { clearFieldError('input-description', 'desc-error'); markFieldValid('input-description'); }
  return res.valid;
}
 
function liveValidateAmount() {
  const val = document.getElementById('input-amount').value;
  const res = validateAmount(val);
  if (!res.valid) showFieldError('input-amount', 'amount-error', res.message);
  else { clearFieldError('input-amount', 'amount-error'); markFieldValid('input-amount'); }
  return res.valid;
}
 
function liveValidateDate() {
  const val = document.getElementById('input-date').value;
  const res = validateDate(val);
  if (!res.valid) showFieldError('input-date', 'date-error', res.message);
  else { clearFieldError('input-date', 'date-error'); markFieldValid('input-date'); }
  return res.valid;
}
 
function handleFormSubmit(e) {
  e.preventDefault();
 
  const descVal = document.getElementById('input-description').value;
  const amtVal  = document.getElementById('input-amount').value;
  const catVal  = document.getElementById('input-category').value;
  const dateVal = document.getElementById('input-date').value;
  const editId  = document.getElementById('edit-id').value;
 
  // Validate all fields
  const dv = validateDescription(descVal);
  const av = validateAmount(amtVal);
  const cv = validateCategory(catVal);
  const dtv = validateDate(dateVal);
 
  let allValid = true;
 
  if (!dv.valid)  { showFieldError('input-description', 'desc-error', dv.message);   allValid = false; }
  else            { clearFieldError('input-description', 'desc-error'); markFieldValid('input-description'); }
 
  if (!av.valid)  { showFieldError('input-amount', 'amount-error', av.message);       allValid = false; }
  else            { clearFieldError('input-amount', 'amount-error'); markFieldValid('input-amount'); }
 
  if (!cv.valid)  { showFieldError('input-category', 'cat-error', cv.message);        allValid = false; }
  else            { clearFieldError('input-category', 'cat-error'); }
 
  if (!dtv.valid) { showFieldError('input-date', 'date-error', dtv.message);          allValid = false; }
  else            { clearFieldError('input-date', 'date-error'); markFieldValid('input-date'); }
 
  if (!allValid) {
    showFormError('Please fix the errors above before submitting.');
    return;
  }
 
  document.getElementById('form-error-banner').hidden = true;
 
  const now = new Date().toISOString();
 
  if (editId) {
    // Update existing
    updateTransaction(editId, {
      description: descVal.trim(),
      amount:      parseFloat(amtVal),
      category:    catVal,
      date:        dateVal.trim(),
    });
    showFormSuccess(`Transaction updated successfully.`);
    resetForm();
    populateCategorySelect();
  } else {
    // Add new
    const tx = {
      id:          generateId(),
      description: descVal.trim(),
      amount:      parseFloat(amtVal),
      category:    catVal,
      date:        dateVal.trim(),
      createdAt:   now,
      updatedAt:   now,
    };
    addTransaction(tx);
    showFormSuccess(`"${tx.description}" added successfully!`);
    resetForm();
    populateCategorySelect();
  }
}
 
/* ── EDIT / DELETE FROM TABLE ─────────────────────────── */
 
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
 
  const { action, id } = btn.dataset;
  const txs = getTransactions();
  const tx  = txs.find(t => t.id === id);
  if (!tx) return;
 
  if (action === 'edit') {
    navigateTo('add');
    populateCategorySelect();
    populateEditForm(tx);
  }
 
  if (action === 'delete') {
    showDeleteModal(tx.description, () => {
      deleteTransaction(id);
      renderTransactions(getSortOptions());
      renderDashboard();
    });
  }
});
 
/* ── SEARCH ───────────────────────────────────────────── */
 
let currentRegex  = null;
let caseSensitive = false;
 
function initSearch() {
  const searchInput   = document.getElementById('search-input');
  const caseBtn       = document.getElementById('search-case-btn');
  const searchErrEl   = document.getElementById('search-error');
 
  searchInput.addEventListener('input', handleSearch);
  caseBtn.addEventListener('click', () => {
    caseSensitive = !caseSensitive;
    caseBtn.setAttribute('aria-pressed', String(caseSensitive));
    handleSearch();
  });
 
  function handleSearch() {
    const raw   = searchInput.value;
    const flags = caseSensitive ? '' : 'i';
    const { re, error } = compileRegex(raw, flags);
 
    if (error) {
      searchInput.classList.add('error');
      searchErrEl.textContent = error;
      currentRegex = null;
    } else {
      searchInput.classList.remove('error');
      searchErrEl.textContent = '';
      currentRegex = re;
    }
 
    renderTransactions({ ...getSortOptions(), regex: currentRegex });
  }
}
 
/* ── SORT ─────────────────────────────────────────────── */
 
function getSortOptions() {
  const select = document.getElementById('sort-select');
  const val    = select ? select.value : 'date-desc';
  const [key, dir] = val.split('-');
  // map "desc" key part to "desc" field key
  const keyMap = { date: 'date', desc: 'desc', amount: 'amount' };
  return { sortKey: keyMap[key] || 'date', sortDir: dir || 'desc', regex: currentRegex };
}
 
function initSort() {
  document.getElementById('sort-select').addEventListener('change', () => {
    renderTransactions(getSortOptions());
  });
}
 
/* ── IMPORT / EXPORT ──────────────────────────────────── */
 
function initImportExport() {
  document.getElementById('export-btn').addEventListener('click', handleExport);
  document.getElementById('import-input').addEventListener('change', handleImport);
}
 
function handleExport() {
  const data = getTransactions();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `spendsmart-export-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
 
function handleImport(e) {
  const file      = e.target.files[0];
  const statusEl  = document.getElementById('import-status');
  if (!file) return;
 
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of transactions.');
 
      const valid   = [];
      const invalid = [];
 
      parsed.forEach((record, i) => {
        if (isValidImportRecord(record)) valid.push(record);
        else invalid.push(i + 1);
      });
 
      if (valid.length === 0) throw new Error('No valid records found in the file.');
 
      // Merge: skip records whose id already exists
      const existing = getTransactions();
      const existingIds = new Set(existing.map(t => t.id));
      const newRecords  = valid.filter(t => !existingIds.has(t.id));
 
      replaceTransactions([...existing, ...newRecords]);
      renderTransactions(getSortOptions());
      renderDashboard();
 
      let msg = `✓ Imported ${newRecords.length} new record(s).`;
      if (valid.length - newRecords.length > 0)
        msg += ` ${valid.length - newRecords.length} duplicate(s) skipped.`;
      if (invalid.length > 0)
        msg += ` ${invalid.length} invalid row(s) skipped (rows: ${invalid.join(', ')}).`;
 
      statusEl.textContent = msg;
      statusEl.className   = 'import-status success';
    } catch (err) {
      statusEl.textContent = `✗ Import failed: ${err.message}`;
      statusEl.className   = 'import-status error';
    }
 
    // Reset input so same file can be re-imported
    e.target.value = '';
    setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'import-status'; }, 6000);
  };
  reader.readAsText(file);
}
 
/* ── SETTINGS ─────────────────────────────────────────── */
 
function initSettings() {
  document.getElementById('settings-form').addEventListener('submit', handleSettingsSave);
  document.getElementById('add-category-btn').addEventListener('click', handleAddCategory);
  document.getElementById('export-csv-btn').addEventListener('click', handleCSVExport);
  document.getElementById('new-category-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
  });
  document.getElementById('categories-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-tag-remove');
    if (!btn) return;
    handleRemoveCategory(parseInt(btn.dataset.index, 10));
  });
  document.getElementById('clear-data-btn').addEventListener('click', handleClearData);
}
 
function handleSettingsSave(e) {
  e.preventDefault();
 
  const baseCurrency = document.getElementById('base-currency').value;
  const rateEUR      = document.getElementById('rate-eur').value.trim();
  const rateGBP      = document.getElementById('rate-gbp').value.trim();
  const rateRWF      = document.getElementById('rate-rwf').value.trim();
  const rateKES      = document.getElementById('rate-kes').value.trim();
  const rateNGN      = document.getElementById('rate-ngn').value.trim();
  const monthlyCap   = document.getElementById('monthly-cap').value.trim();
 
  let allOk = true;
 
  // Validate rates
  const rateFields = [
    { val: rateEUR, inputId: 'rate-eur', errId: 'rate-eur-error' },
    { val: rateGBP, inputId: 'rate-gbp', errId: 'rate-gbp-error' },
    { val: rateRWF, inputId: 'rate-rwf', errId: 'rate-rwf-error' },
    { val: rateKES, inputId: 'rate-kes', errId: 'rate-kes-error' },
    { val: rateNGN, inputId: 'rate-ngn', errId: 'rate-ngn-error' },
  ];
  rateFields.forEach(({ val, inputId, errId }) => {
    const res = validateRate(val);
    if (!res.valid) { showFieldError(inputId, errId, res.message); allOk = false; }
    else clearFieldError(inputId, errId);
  });
 
  // Validate cap
  const capRes = validateCap(monthlyCap);
  if (!capRes.valid) { showFieldError('monthly-cap', 'cap-error', capRes.message); allOk = false; }
  else clearFieldError('monthly-cap', 'cap-error');
 
  if (!allOk) return;
 
  const existing = getSettings();
  updateSettings({
    baseCurrency,
    rates: {
      EUR: rateEUR ? parseFloat(rateEUR) : (existing.rates?.EUR || 0.92),
      GBP: rateGBP ? parseFloat(rateGBP) : (existing.rates?.GBP || 0.79),
      RWF: rateRWF ? parseFloat(rateRWF) : (existing.rates?.RWF || 1340),
      KES: rateKES ? parseFloat(rateKES) : (existing.rates?.KES || 129),
      NGN: rateNGN ? parseFloat(rateNGN) : (existing.rates?.NGN || 1600),
    },
    monthlyCap: monthlyCap ? parseFloat(monthlyCap) : null,
  });
 
  const msg = document.getElementById('settings-saved-msg');
  msg.textContent = '✓ Settings saved.';
  msg.hidden = false;
  setTimeout(() => { msg.hidden = true; }, 3000);
 
  // Refresh currency prefix in add form and dashboard
  updateAmountPrefix();
}
 
function handleAddCategory() {
  const input  = document.getElementById('new-category-input');
  const errEl  = document.getElementById('new-cat-error');
  const val    = input.value.trim();
 
  const res = validateCategoryName(val);
  if (!res.valid) { errEl.textContent = res.message; return; }
  errEl.textContent = '';
 
  const current = getSettings().categories || [];
  if (current.map(c => c.toLowerCase()).includes(val.toLowerCase())) {
    errEl.textContent = 'That category already exists.';
    return;
  }
 
  updateSettings({ categories: [...current, val] });
  renderCategoriesList();
  populateCategorySelect();
  input.value = '';
  input.focus();
}
 
function handleRemoveCategory(index) {
  const cats = [...(getSettings().categories || [])];
  if (cats.length <= 1) {
    document.getElementById('new-cat-error').textContent = 'You must keep at least one category.';
    return;
  }
  cats.splice(index, 1);
  updateSettings({ categories: cats });
  renderCategoriesList();
  populateCategorySelect();
}
 
function handleClearData() {
  if (!confirm('Are you sure? This will permanently delete ALL transactions and reset all settings. This cannot be undone.')) return;
  import('./storage.js').then(({ clearAll }) => {
    clearAll();
    import('./state.js').then(({ init }) => {
      init();
      populateSettingsForm();
      renderDashboard();
      renderTransactions();
    });
  });
}

// ── SPREADSHEET CSV EXPORT PIPELINE ──
function handleCSVExport() {
  // Grab current state records array
  const transactions = getTransactions();
  
  if (transactions.length === 0) {
    alert("Your transaction ledger is currently empty. Add records before exporting!");
    return;
  }

  // 1. Establish structural table header row tokens
  const headers = ["Transaction ID", "Date", "Category", "Description", "Amount"];
  
  // 2. Map and properly escape inner record sequences
  const csvRows = transactions.map(t => {
    // Escape double quotes inside text to prevent column splitting bugs
    const cleanDesc = `"${t.description.replace(/"/g, '""')}"`;
    const cleanCat  = `"${t.category.replace(/"/g, '""')}"`;
    
    return [
      t.id,
      t.date,
      cleanCat,
      cleanDesc,
      t.amount.toFixed(2)
    ].join(",");
  });

  // 3. Combine header array with formatted rows using newline separators
  const csvContent = [headers.join(","), ...csvRows].join("\n");
  
  // 4. Compile raw text bytes into a localized file blob object
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // 5. Generate virtual anchor element and click it to fire download
  const link = document.createElement("a");
  const formattedDate = new Date().toISOString().slice(0, 10);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `safespend-ledger-${formattedDate}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Free up browser memory resources
  URL.revokeObjectURL(url);
}