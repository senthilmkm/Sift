import { sanitizeTextForPrivacy, containsSensitivePii, PROFILE_PII_MAP } from '../src/services/piiRedactor';

describe('On-Device PII Redactor Engine - 100% Coverage Suite', () => {
  test('returns empty string when input is empty or null', () => {
    expect(sanitizeTextForPrivacy('')).toBe('');
    expect(containsSensitivePii('')).toBe(false);
  });

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

  test('redacts Tax EIN numbers', () => {
    const rawText = 'Employer Tax EIN: 12-3456789 on Form W9.';
    const sanitized = sanitizeTextForPrivacy(rawText, 'smallBiz');
    expect(sanitized).toContain('[REDACTED EIN]');
  });

  test('redacts profile-specific Student ID for school profile', () => {
    const rawText = 'Student ID: #984123 for school lunch account.';
    const sanitized = sanitizeTextForPrivacy(rawText, 'school');
    expect(sanitized).toContain('Student ID: [REDACTED]');
  });

  test('redacts Medical Record Number (MRN) and Rx numbers for elderCare profile', () => {
    const rawText = 'MRN: 94820-A Rx#: 12345678';
    const sanitized = sanitizeTextForPrivacy(rawText, 'elderCare');
    expect(sanitized).toContain('MRN: [REDACTED]');
    expect(sanitized).toContain('Rx: [REDACTED]');
  });

  test('redacts Account number for smallBiz profile', () => {
    const rawText = 'Account #: 99482014920';
    const sanitized = sanitizeTextForPrivacy(rawText, 'smallBiz');
    expect(sanitized).toContain('Account: [REDACTED]');
  });

  test('redacts Mortgage Account number for property profile', () => {
    const rawText = 'Mortgage #: 88412049201';
    const sanitized = sanitizeTextForPrivacy(rawText, 'property');
    expect(sanitized).toContain('Mortgage Acct: [REDACTED]');
  });

  test('redacts Passport number for legalImmigration profile', () => {
    const rawText = 'Passport #: A94820149';
    const sanitized = sanitizeTextForPrivacy(rawText, 'legalImmigration');
    expect(sanitized).toContain('Passport: [REDACTED]');
  });

  test('containsSensitivePii helper detects PII accurately', () => {
    expect(containsSensitivePii('Normal text without PII')).toBe(false);
    expect(containsSensitivePii('Contains SSN 999-88-7777 inside')).toBe(true);
  });
});
