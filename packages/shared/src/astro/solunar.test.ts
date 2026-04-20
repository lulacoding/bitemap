import { describe, it, expect } from 'vitest';
import { feedTimesFor, activeFeedTime } from './solunar';

describe('feedTimesFor', () => {
  it('returns 4 feed times (2 major + 2 minor)', () => {
    const times = feedTimesFor(new Date('2026-04-20T00:00:00Z'), -38.1, 144.85);
    expect(times).toHaveLength(4);
    expect(times.filter((t) => t.type === 'major')).toHaveLength(2);
    expect(times.filter((t) => t.type === 'minor')).toHaveLength(2);
  });

  it('each feed-time has start < end', () => {
    const times = feedTimesFor(new Date(), -38.1, 144.85);
    times.forEach((t) => {
      expect(t.end).toBeGreaterThan(t.start);
    });
  });

  it('provides labels for each period', () => {
    const times = feedTimesFor(new Date(), -38.1, 144.85);
    const labels = times.map((t) => t.label);
    expect(labels).toContain('Dawn major');
    expect(labels).toContain('Dusk major');
    expect(labels).toContain('Midday minor');
    expect(labels).toContain('Midnight minor');
  });
});

describe('activeFeedTime', () => {
  it('returns null when outside any window', () => {
    const times = [
      { type: 'major' as const, label: 'x', start: 1000, end: 2000 },
    ];
    expect(activeFeedTime(times, new Date(5000 * 1000))).toBe(null);
  });

  it('returns the active window', () => {
    const times = [
      { type: 'major' as const, label: 'morning', start: 1000, end: 2000 },
      { type: 'minor' as const, label: 'noon', start: 3000, end: 4000 },
    ];
    const active = activeFeedTime(times, new Date(1500 * 1000));
    expect(active?.label).toBe('morning');
  });
});
