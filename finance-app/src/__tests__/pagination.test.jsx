import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  pageCount, needsPagination, clampPage, paginate, startRank,
} from '../utils/pagination.js';
import Pagination from '../components/common/Pagination.jsx';

const items = (n) => Array.from({ length: n }, (_, i) => i + 1);

describe('pagination helpers', () => {
  it.each([[0, 1], [1, 1], [8, 1], [9, 2], [16, 2], [17, 3]])(
    'pageCount(%i) = %i', (total, expected) => {
      expect(pageCount(total)).toBe(expected);
    }
  );

  it('needsPagination only above 8 items', () => {
    expect(needsPagination(8)).toBe(false);
    expect(needsPagination(9)).toBe(true);
  });

  it('clampPage keeps the page within range', () => {
    expect(clampPage(0, 17)).toBe(1);
    expect(clampPage(-3, 17)).toBe(1);
    expect(clampPage(9, 17)).toBe(3);
    expect(clampPage(NaN, 17)).toBe(1);
    expect(clampPage(3, 8)).toBe(1); // list shrank to one page
  });

  it('paginate slices 8 per page', () => {
    expect(paginate(items(17), 1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(paginate(items(17), 2)).toEqual([9, 10, 11, 12, 13, 14, 15, 16]);
    expect(paginate(items(17), 3)).toEqual([17]);
  });

  it('paginate clamps an out-of-range page', () => {
    expect(paginate(items(9), 5)).toEqual([9]);
    expect(paginate(items(3), 2)).toEqual([1, 2, 3]);
  });

  it('startRank continues across pages', () => {
    expect(startRank(1, 17)).toBe(1);
    expect(startRank(2, 17)).toBe(9);
    expect(startRank(3, 17)).toBe(17);
    expect(startRank(9, 17)).toBe(17);
  });
});

describe('Pagination component', () => {
  it('renders nothing for 8 or fewer items', () => {
    const { container } = render(<Pagination page={1} total={8} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows Previous / Page X of Y / Next above 8 items', () => {
    render(<Pagination page={1} total={9} onPageChange={() => {}} label="Ranking pages" />);
    expect(screen.getByRole('navigation', { name: 'Ranking pages' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('disables Next on the last page', () => {
    render(<Pagination page={2} total={9} onPageChange={() => {}} />);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('reports the requested page on click', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} total={17} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('clamps a stale page to the last page', () => {
    render(<Pagination page={5} total={9} onPageChange={() => {}} />);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });
});
