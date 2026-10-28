import { describe, expect, it } from 'vitest';
import { formatCompact, formatMoney, initials, plural } from './format';

describe('format helpers', () => {
  it('shortens big numbers', () => {
    expect(formatCompact(1_250_000)).toBe('1.3M');
    expect(formatCompact(86_000)).toBe('86K');
    expect(formatCompact(950)).toBe('950');
  });

  it('formats money without cents', () => {
    expect(formatMoney(24_000)).toBe('$24,000');
  });

  it('pluralises', () => {
    expect(plural(1, 'creator')).toBe('1 creator');
    expect(plural(3, 'creator')).toBe('3 creators');
    expect(plural(0, 'creator')).toBe('0 creators');
  });

  it('makes initials from up to two words', () => {
    expect(initials('Emma Stone-Hill')).toBe('ES');
    expect(initials('Madonna')).toBe('M');
    expect(initials('Anna Maria Lopez')).toBe('AM');
  });
});
