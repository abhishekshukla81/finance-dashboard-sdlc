/**
 * pagination.js
 *
 * Pure helpers for client-side pagination. Pages are 1-based.
 */
import { PAGE_SIZE } from '../constants/tickers.js';

/** Number of pages needed for `total` items (always at least 1). */
export function pageCount(total, pageSize = PAGE_SIZE) {
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}

/** Whether pagination controls are needed (more items than fit on one page). */
export function needsPagination(total, pageSize = PAGE_SIZE) {
  return total > pageSize;
}

/** Clamp a page number into [1, pageCount]. Non-numeric input becomes page 1. */
export function clampPage(page, total, pageSize = PAGE_SIZE) {
  const n = Number.isFinite(page) ? Math.trunc(page) : 1;
  return Math.min(Math.max(1, n), pageCount(total, pageSize));
}

/** Items for one page, after clamping the page to the valid range. */
export function paginate(items, page, pageSize = PAGE_SIZE) {
  const p = clampPage(page, items.length, pageSize);
  return items.slice((p - 1) * pageSize, p * pageSize);
}

/** 1-based rank of the first item on a page (page 2 with size 8 starts at 9). */
export function startRank(page, total, pageSize = PAGE_SIZE) {
  return (clampPage(page, total, pageSize) - 1) * pageSize + 1;
}
