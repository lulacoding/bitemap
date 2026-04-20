import { describe, it, expect } from 'vitest';
import { applyPrivacy } from './privacy';

describe('applyPrivacy', () => {
  it('exact: coords unchanged, not hidden', () => {
    const r = applyPrivacy('exact', { lat: -38.123456, lng: 144.987654 });
    expect(r.lat).toBe(-38.123456);
    expect(r.lng).toBe(144.987654);
    expect(r.is_hidden).toBe(false);
  });

  it('area: snapped to ~1km grid', () => {
    const r = applyPrivacy('area', { lat: -38.123456, lng: 144.987654 });
    expect(Math.abs(r.lat - -38.12)).toBeLessThan(0.015);
    expect(Math.abs(r.lng - 144.99)).toBeLessThan(0.02);
    expect(r.is_hidden).toBe(false);
  });

  it('area: deterministic snap (same input → same output)', () => {
    const a = applyPrivacy('area', { lat: -38.1234, lng: 144.9876 });
    const b = applyPrivacy('area', { lat: -38.1234, lng: 144.9876 });
    expect(a.lat).toBe(b.lat);
    expect(a.lng).toBe(b.lng);
  });

  it('area: snap resolution is ~1km (diff < 2km between input and output)', () => {
    const r = applyPrivacy('area', { lat: -38.123456, lng: 144.987654 });
    expect(Math.abs(r.lat - -38.123456)).toBeLessThan(0.02);
    expect(Math.abs(r.lng - 144.987654)).toBeLessThan(0.02);
  });

  it('hidden: sets is_hidden true', () => {
    const r = applyPrivacy('hidden', { lat: -38.1, lng: 144.85 });
    expect(r.is_hidden).toBe(true);
  });
});
