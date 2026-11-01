import { pageCount, needsPagination, clampPage } from '../../utils/pagination.js';
import { PAGE_SIZE } from '../../constants/tickers.js';
import styles from './Pagination.module.css';

/**
 * Pagination
 *
 * Previous / "Page X of Y" / Next controls. Renders nothing when everything
 * fits on a single page.
 *
 * Props:
 *   page        {number}   current 1-based page
 *   total       {number}   total number of items
 *   onPageChange{(page:number)=>void}
 *   pageSize    {number}   defaults to PAGE_SIZE
 *   label       {string}   accessible name for the nav landmark
 */
export default function Pagination({
  page,
  total,
  onPageChange,
  pageSize = PAGE_SIZE,
  label = 'Pagination',
}) {
  if (!needsPagination(total, pageSize)) return null;

  const pages   = pageCount(total, pageSize);
  const current = clampPage(page, total, pageSize);

  return (
    <nav className={styles.nav} aria-label={label}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onPageChange(current - 1)}
        disabled={current <= 1}
      >
        Previous
      </button>
      <span className={styles.status} aria-live="polite">
        Page {current} of {pages}
      </span>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onPageChange(current + 1)}
        disabled={current >= pages}
      >
        Next
      </button>
    </nav>
  );
}
