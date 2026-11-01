/**
 * ranking.js
 *
 * Shared ordering for "best daily performer first" lists.
 */

/** Sort comparator: best daily change first; quotes without a change go last. */
export function byDailyChange(a, b) {
  const pa = a.changePercent ?? -Infinity;
  const pb = b.changePercent ?? -Infinity;
  return pa === pb ? 0 : pb - pa;
}

/** Quotes ranked by daily change, best first (does not mutate the input). */
export function rankByDailyChange(quotes) {
  return [...quotes].sort(byDailyChange);
}
