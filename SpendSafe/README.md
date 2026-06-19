# SafeSpend — Responsive Student Finance Tracker

SafeSpend is an accessible, client-side personal finance manager built using clean vanilla web technologies. It is engineered from a strict mobile-first paradigm and designed specifically for students to organize personal budgets, analyze educational overhead, and perform advanced data matching using regular expressions.

## 🚀 Live Links
- **GitHub Repository URL:** https://github.com/gineza1-hash/SpendSafe
- **Demo Video:** https://youtu.be/zedv_9LuTuc

## ✨ Features Checklist
- **Modular Client Architecture:** Clean separation of concerns with isolated runtime files (`storage.js`, `state.js`, `validators.js`, `search.js`, `ui.js`, `main.js`).
- **Live Search & Highlighting Engine:** Real-time query evaluation wrapped in a safe compiler (`try...catch`) that parses literal regular expressions and highlights matches using accessible `<mark>` tags.
- **Dynamic Multi-Currency System:** Supports instant calculations across RWF, KES, NGN, GBP, and EUR based on manual rates managed in Settings.
- **Data Portability Hub:** Implements asynchronous local file handling for JSON data importing/validation, alongside a custom spreadsheet CSV export tool.
- **Accessible Design Integration:** Completely navigable via keyboard loops, distinct focus styling, and explicit ARIA live tracking regions for remaining budget caps.

---

## 🧩 Regular Expression Catalog

| Rule / Context | Target Purpose / Mechanics | Compiled Pattern Syntax | Matching Instance | Non-Matching Instance |
| :--- | :--- | :--- | :--- | :--- |
| **Description** | Forbids leading/trailing spaces; collapses double space chunks. | `/^\S(?:.*\S)?$/` | `"Chemistry Textbook"` | `" Space Prefix "` |
| **Monetary Field**| Validates raw currency values, preventing leading zeroes while supporting up to 2 decimal places. | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | `"1250.75"` | `"0145.2"` |
| **ISO Date Format**| Validates structured standard YYYY-MM-DD syntax inputs. | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | `"2026-06-19"` | `"2026-13-01"` |
| **Category/Tag** | Groups letters cleanly, separated only by a unified space or hyphen. | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | `"Academic-Fees"` | `"Food_2"` |
| **Duplicate Check**| Advanced lookahead/back-reference finding adjacent identical words. | `/\b(\w+)\s+\1\b/i` | `"Lunch lunch at cafe"` | `"Lunch at campus cafe"` |

---

## ⌨️ Accessibility & Interactive Keyboard Map

SafeSpend is built with native semantic landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`) to maximize cross-screen readability.

- `Tab` / `Shift + Tab`: Moves focus sequentially through form inputs and top-navigation link items.
- `Enter` / `Spacebar`: Submits validated entry forms and switches application screen views.
- `Escape`: Instantly cancels an in-progress row modification or closes modal prompts.
- **Screen Reader Focus Nodes:** Field errors use explicit `role="alert"` containers. The dynamic budget progress tracker utilizes an `aria-live="polite"` or `aria-live="assertive"` property node based on whether the monthly spend limit has been exceeded.

---

## 🧪 Testing Execution Guidelines
To run programmatic validation scripts against edge cases, open the `tests.html` file in your preferred web browser environment. The console panel and on-screen summary track validation rules, error boundaries, and state changes.