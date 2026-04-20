import { describe, it, expect } from 'vitest';
import { compareLeaderboardRows, type LeaderboardRow } from './leaderboards';

const row = (
  catch_count: number,
  best: number | null,
  species?: number,
): LeaderboardRow =>
  ({
    user_id: 'x',
    catch_count,
    best_size_mm: best,
    species_count: species,
  }) as LeaderboardRow;

describe('compareLeaderboardRows', () => {
  it('ranks higher catch_count first', () => {
    expect(compareLeaderboardRows(row(5, 200), row(3, 200))).toBeLessThan(0);
  });

  it('tiebreaks catch_count by species_count', () => {
    expect(compareLeaderboardRows(row(5, 200, 4), row(5, 200, 2))).toBeLessThan(0);
  });

  it('tiebreaks remaining by best_size_mm', () => {
    expect(compareLeaderboardRows(row(5, 350), row(5, 300))).toBeLessThan(0);
  });

  it('handles null best_size_mm as worst', () => {
    expect(compareLeaderboardRows(row(5, 200), row(5, null))).toBeLessThan(0);
  });

  it('sort stability across a list matches expectations', () => {
    const rows = [row(3, 100), row(5, 200), row(5, 250), row(1, 500)];
    rows.sort(compareLeaderboardRows);
    expect(rows.map((r) => r.catch_count)).toEqual([5, 5, 3, 1]);
    expect(rows[0]?.best_size_mm).toBe(250);
    expect(rows[1]?.best_size_mm).toBe(200);
  });
});
