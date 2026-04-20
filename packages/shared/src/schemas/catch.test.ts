import { describe, it, expect } from 'vitest';
import { catchInputSchema } from './catch';

const VALID_BASE = {
  species_id: '11111111-1111-4111-8111-111111111111',
  quantity: 1,
  lat: -38.1,
  lng: 144.85,
  privacy_level: 'exact' as const,
};

describe('catchInputSchema', () => {
  it('minimal valid catch passes', () => {
    expect(() => catchInputSchema.parse(VALID_BASE)).not.toThrow();
  });

  it('size_mm < 0 rejected', () => {
    expect(() =>
      catchInputSchema.parse({ ...VALID_BASE, size_mm: -10 }),
    ).toThrow();
  });

  it('quantity < 1 rejected', () => {
    expect(() =>
      catchInputSchema.parse({ ...VALID_BASE, quantity: 0 }),
    ).toThrow();
  });

  it('lat out of range rejected', () => {
    expect(() =>
      catchInputSchema.parse({ ...VALID_BASE, lat: 200 }),
    ).toThrow();
  });

  it('invalid privacy_level rejected', () => {
    expect(() =>
      catchInputSchema.parse({ ...VALID_BASE, privacy_level: 'public' }),
    ).toThrow();
  });

  it('invalid species_id UUID rejected', () => {
    expect(() =>
      catchInputSchema.parse({ ...VALID_BASE, species_id: 'not-a-uuid' }),
    ).toThrow();
  });

  it('accepts optional photo_url as valid URL', () => {
    expect(() =>
      catchInputSchema.parse({
        ...VALID_BASE,
        photo_url: 'https://example.com/photo.jpg',
      }),
    ).not.toThrow();
  });

  it('rejects malformed photo_url', () => {
    expect(() =>
      catchInputSchema.parse({ ...VALID_BASE, photo_url: 'not a url' }),
    ).toThrow();
  });
});
