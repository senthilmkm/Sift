import { sanitizeTextForPrivacy, containsSensitivePii } from '../src/services/piiRedactor';

describe('On-Device PII Redactor Engine', () => {
  test('redacts Social Security Numbers (SSN)', () => {
    const rawText = 'Patient SSN is 123-45-6789 for registration.';
    const sanitized = sanitizeTextForPrivacy(rawText, 'elderCare');
    expect(sanitized).toContain('[REDACTED SSN]');
    expect(sanitized).not.toContain('123-45-6789');
  });

  test('redacts Credit Card Numbers', () => {
    const rawText = 'Pay using credit card 4111111111111111 at checkout.';
    const sanitized = sanitizeTextForPrivacy(rawText, 'smallBiz');
    expect(sanitized).toContain('[REDACTED CARD]');
    expect(sanitized).not.toContain('4111111111111111');
  });

  test('redacts US Bank Routing Numbers', () => {
    const rawText = 'Routing number 123456789 aba bank routing.';
    const sanitized = sanitizeTextForPrivacy(rawText, 'smallBiz');
    expect(sanitized).toContain('[REDACTED ROUTING]');
  });

  test('redacts Medicare Member ID', () => {
    const rawText = 'Medicare ID 1EG4-TE5-MK72 on coverage card.';
    const sanitized = sanitizeTextForPrivacy(rawText, 'elderCare');
    expect(sanitized).toContain('[REDACTED MEDICARE ID]');
    expect(sanitized).not.toContain('1EG4-TE5-MK72');
  });

  test('redacts USCIS Alien Registration Number (A-Number)', () => {
    const rawText = 'USCIS Receipt Notice for Alien A-948210492.';
    const sanitized = sanitizeTextForPrivacy(rawText, 'legalImmigration');
    expect(sanitized).toContain('[REDACTED A-NUMBER]');
    expect(sanitized).not.toContain('A-948210492');
  });

  test('redacts profile-specific Student ID for school profile', () => {
    const rawText = 'Student ID: #984123 for school lunch account.';
    const sanitized = sanitizeTextForPrivacy(rawText, 'school');
    expect(sanitized).toContain('Student ID: [REDACTED]');
  });

  test('containsSensitivePii helper detects PII accurately', () => {
    expect(containsSensitivePii('Normal text without PII')).toBe(false);
    expect(containsSensitivePii('Contains SSN 999-88-7777 inside')).toBe(true);
  });
});
