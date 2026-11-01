/**
 * symbols.js
 *
 * Client-side helpers for user-entered ticker symbols.
 * This is a UX/safety check only; the backend proxy must still treat the
 * symbol as untrusted input.
 */

/** Allowlist: optional leading "^", then 1–10 of A-Z, 0-9, "." or "-" (e.g. BRK-B, ^GSPC). */
const SYMBOL_PATTERN = /^\^?[A-Z0-9][A-Z0-9.-]{0,9}$/;

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
