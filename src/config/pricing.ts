import { ProfileId } from '../models/types';

export interface PaywallTier {
  id: string;
  name: string;
  priceDisplay: string;
  billingPeriod: string;
  savingsBadge?: string;
  isPopular?: boolean;
}

export interface PaywallConfig {
  freeScanLimitPerMonth: number;
  freeTierDisclaimer: string;
  allProfilesUnlocked: boolean;
  unlockedProfiles: ProfileId[];
  tiers: PaywallTier[];
  features: string[];
  profitabilityMetrics: {
    avgCostPerScanUSD: number;
    monthlySubscriptionUSD: number;
    grossProfitMarginPercent: number;
  };
}

export const SIFT_PAYWALL_CONFIG: PaywallConfig = {
  freeScanLimitPerMonth: 5,
  freeTierDisclaimer: 'Free tier includes 5 document scans per month total across all 5 Smart Profiles combined.',
  allProfilesUnlocked: true,
  unlockedProfiles: ['school', 'elderCare', 'smallBiz', 'property', 'legalImmigration'],
  tiers: [
    {
      id: 'sift_pro_monthly',
      name: 'Sift Pro Monthly',
      priceDisplay: '$4.99 / month',
      billingPeriod: 'monthly'
    },
    {
      id: 'sift_pro_annual',
      name: 'Sift Pro Annual',
      priceDisplay: '$39.99 / year',
      billingPeriod: 'annual',
      savingsBadge: 'SAVE 33%',
      isPopular: true
    }
  ],
  features: [
    'Unlock All 5 Smart Profiles (School, Elder Care, Small Business, Property, Legal)',
    'Unlimited Gemini AI Document Scans',
    'On-Device PII Redaction Engine',
    'Apple Critical Alerts for Urgent Deadlines',
    'Multi-Page Document Camera Carousel',
    'Excel (.CSV) & ICS Calendar Export'
  ],
  profitabilityMetrics: {
    avgCostPerScanUSD: 0.00015,
    monthlySubscriptionUSD: 4.99,
    grossProfitMarginPercent: 99.8
  }
};
