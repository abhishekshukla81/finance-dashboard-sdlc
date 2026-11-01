import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  pageCount, needsPagination, clampPage, paginate, startRank,
} from '../utils/pagination.js';
import Pagination from '../components/common/Pagination.jsx';

const items = (n) => Array.from({ length: n }, (_, i) => i + 1);

describe('pagination helpers', () => {
  it.each([[0, 1], [1, 1], [6, 1], [7, 2], [12, 2], [13, 3]])(
    'pageCount(%i) = %i', (total, expected) => {
      expect(pageCount(total)).toBe(expected);
    }
  );

  it('needsPagination only above 6 items', () => {
    expect(needsPagination(6)).toBe(false);
    expect(needsPagination(7)).toBe(true);
  });

  it('clampPage keeps the page within range', () => {
    expect(clampPage(0, 13)).toBe(1);
    expect(clampPage(-3, 13)).toBe(1);
    expect(clampPage(9, 13)).toBe(3);
    expect(clampPage(NaN, 13)).toBe(1);
    expect(clampPage(3, 6)).toBe(1); // list shrank to one page
  });

  it('paginate slices 6 per page', () => {
    expect(paginate(items(13), 1)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(paginate(items(13), 2)).toEqual([7, 8, 9, 10, 11, 12]);
    expect(paginate(items(13), 3)).toEqual([13]);
  });

  it('paginate clamps an out-of-range page', () => {
    expect(paginate(items(7), 5)).toEqual([7]);
    expect(paginate(items(3), 2)).toEqual([1, 2, 3]);
  });

  it('startRank continues across pages', () => {
    expect(startRank(1, 13)).toBe(1);
    expect(startRank(2, 13)).toBe(7);
    expect(startRank(3, 13)).toBe(13);
    expect(startRank(9, 13)).toBe(13);
  });
});

describe('Pagination component', () => {
  it('renders nothing for 6 or fewer items', () => {
    const { container } = render(<Pagination page={1} total={6} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows Previous / Page X of Y / Next above 6 items', () => {
    render(<Pagination page={1} total={7} onPageChange={() => {}} label="Ranking pages" />);
    expect(screen.getByRole('navigation', { name: 'Ranking pages' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('disables Next on the last page', () => {
    render(<Pagination page={2} total={7} onPageChange={() => {}} />);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('reports the requested page on click', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} total={13} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('clamps a stale page to the last page', () => {
    render(<Pagination page={5} total={7} onPageChange={() => {}} />);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });
});
