import { ProfileId } from '../models/types';

export interface PiiRedactionPattern {
  name: string;
  regex: RegExp;
  replacement: string;
}

// Comprehensive PII Redaction Regex Patterns
export const COMMON_PII_PATTERNS: PiiRedactionPattern[] = [
  // Social Security Number (SSN): 000-00-0000
  {
    name: 'SSN',
    regex: /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/gi,
    replacement: '[REDACTED SSN]',
  },
  // Credit Card Numbers: 16 digits with optional spaces/dashes
  {
    name: 'Credit Card Number',
    regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/gi,
    replacement: '[REDACTED CARD]',
  },
  // US Bank Routing Number: 9 digits with routing keyword context
  {
    name: 'Bank Routing Number',
    regex: /\b\d{9}\b(?=.*(?:routing|aba|bank))/gi,
    replacement: '[REDACTED ROUTING]',
  },
  // Medicare MBI ID format: 1EG4-TE5-MK72 (Starts with 1-9 digit + 10 alphanumeric chars)
  {
    name: 'Medicare ID',
    regex: /\b[1-9][0-9A-Z]{3}[-\s]?[0-9A-Z]{3}[-\s]?[0-9A-Z]{4}\b/gi,
    replacement: '[REDACTED MEDICARE ID]',
  },
  // USCIS Alien Registration Number (A-Number: A-123456789)
  {
    name: 'USCIS A-Number',
    regex: /\bA-?\d{8,9}\b/gi,
    replacement: '[REDACTED A-NUMBER]',
  },
  // Employer Identification Number (EIN): 00-0000000
  {
    name: 'Tax EIN',
    regex: /\b\d{2}-\d{7}\b/gi,
    replacement: '[REDACTED EIN]',
  },
];

// Profile-specific additional patterns (Evaluated FIRST for specific context)
export const PROFILE_PII_MAP: Record<ProfileId, PiiRedactionPattern[]> = {
  school: [
    {
      name: 'Student ID',
      regex: /\bStudent\s*ID:\s*#?\d+\b/gi,
      replacement: 'Student ID: [REDACTED]',
    },
  ],
  elderCare: [
    {
      name: 'Medical Record Number (MRN)',
      regex: /\bMRN:\s*[A-Z0-9-]+\b/gi,
      replacement: 'MRN: [REDACTED]',
    },
    {
      name: 'Rx Prescription Number',
      regex: /\bRx\s*#?\s*:\s*\d{6,10}\b/gi,
      replacement: 'Rx: [REDACTED]',
    },
  ],
  smallBiz: [
    {
      name: 'Bank Account Number Footer',
      regex: /\b(?:Acct|Account)\s*#?\s*:\s*\d{8,17}\b/gi,
      replacement: 'Account: [REDACTED]',
    },
  ],
  property: [
    {
      name: 'Mortgage Account',
      regex: /\bMortgage\s*#?\s*:\s*\d{8,16}\b/gi,
      replacement: 'Mortgage Acct: [REDACTED]',
    },
  ],
  legalImmigration: [
    {
      name: 'Passport Number',
      regex: /\bPassport\s*#?\s*:\s*[A-Z0-9]{8,10}\b/gi,
      replacement: 'Passport: [REDACTED]',
    },
  ],
};

/**
 * Sanitizes input text string by redacting sensitive PII patterns
 */
export function sanitizeTextForPrivacy(text: string, profileId: ProfileId = 'school'): string {
  if (!text) return '';
  let sanitized = text;

  // 1. Apply profile-specific PII patterns FIRST for specific context matching
  const profilePatterns = PROFILE_PII_MAP[profileId] || [];
  for (const pattern of profilePatterns) {
    pattern.regex.lastIndex = 0;
    sanitized = sanitized.replace(pattern.regex, pattern.replacement);
  }

  // 2. Apply common PII patterns SECOND as general fallback
  for (const pattern of COMMON_PII_PATTERNS) {
    pattern.regex.lastIndex = 0;
    sanitized = sanitized.replace(pattern.regex, pattern.replacement);
  }

  return sanitized;
}

/**
 * Validates if text contains unredacted critical PII
 */
export function containsSensitivePii(text: string): boolean {
  if (!text) return false;

  for (const pattern of COMMON_PII_PATTERNS) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(text)) return true;
  }
  return false;
}
