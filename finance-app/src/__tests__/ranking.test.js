import { describe, it, expect } from 'vitest';
import { byDailyChange, rankByDailyChange } from '../utils/ranking.js';

const q = (symbol, changePercent) => ({ symbol, changePercent });

describe('ranking', () => {
  it('ranks best daily change first', () => {
    expect(rankByDailyChange([q('A', -1), q('B', 2), q('C', 0.5)]).map((x) => x.symbol))
      .toEqual(['B', 'C', 'A']);
  });

  it('puts quotes without a change last', () => {
    expect(rankByDailyChange([q('A', null), q('B', -3), q('C', undefined)]).map((x) => x.symbol))
      .toEqual(['B', 'A', 'C']);
  });

  it('does not mutate its input', () => {
    const input = [q('A', 1), q('B', 2)];
    rankByDailyChange(input);
    expect(input.map((x) => x.symbol)).toEqual(['A', 'B']);
  });

  it('comparator treats equal changes as equal', () => {
    expect(byDailyChange(q('A', 1), q('B', 1))).toBe(0);
  });
});
