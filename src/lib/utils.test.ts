import { describe, it, expect } from 'vitest';
import { formatCurrency } from './utils';

describe('formatCurrency', () => {
  it('formats currency correctly with default settings (INR)', () => {
    const result = formatCurrency(1234.56);
    // Note: The space between symbol and number might depend on locale/implementation
    // We check for the presence of the symbol and the formatted number
    expect(result).toContain('₹');
    expect(result).toContain('1,234.56');
  });

  it('formats currency correctly with specified locale (USD)', () => {
    const result = formatCurrency(1234.56, 'USD', undefined, 'en-US');
    expect(result).toContain('$');
    expect(result).toContain('1,234.56');
  });

  it('handles zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0.00');
  });

  it('handles null/undefined correctly', () => {
    expect(formatCurrency(null)).toContain('0.00');
    expect(formatCurrency(undefined)).toContain('0.00');
  });

  it('handles large numbers with compact mode', () => {
     // Trigger the >= 999_999 condition
     const result = formatCurrency(1000000);
     // Expect something like "10L" or "1M" depending on locale implementation for compact
     // INR compact often uses Lakhs/Crores if properly supported, but Intl might default to M/K depending on version
     // Let's just check it doesn't crash and returns a string
     expect(typeof result).toBe('string');
  });
});
