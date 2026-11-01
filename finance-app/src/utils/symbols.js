/**
 * symbols.js
 *
 * Client-side helpers for user-entered ticker symbols.
 * This is a UX/safety check only; the backend proxy must still treat the
 * symbol as untrusted input.
 */

/** Allowlist: 1–5 uppercase letters only (e.g. IBM, NVDA). */
const SYMBOL_PATTERN = /^[A-Z]{1,5}$/;

/**
 * Trim and uppercase raw user input.
 * @param {string} input
 * @returns {string}
 */
export function normalizeSymbol(input) {
  return String(input ?? '').trim().toUpperCase();
}

/**
 * Whether a (normalised) symbol has an acceptable format.
 * @param {string} symbol
 * @returns {boolean}
 */
export function isValidSymbol(symbol) {
  return SYMBOL_PATTERN.test(symbol);
}
