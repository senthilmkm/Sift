import { SIFT_PAYWALL_CONFIG } from '../src/config/pricing';

describe('Pricing Configuration & Paywall Schema Tests', () => {
  it('validates SIFT_PAYWALL_CONFIG structure and free tier disclaimer', () => {
    expect(SIFT_PAYWALL_CONFIG.freeScanLimitPerMonth).toBe(5);
    expect(SIFT_PAYWALL_CONFIG.freeTierDisclaimer).toContain('5 document scans per month total across all 5 Smart Profiles combined');
    expect(SIFT_PAYWALL_CONFIG.allProfilesUnlocked).toBe(true);
    expect(SIFT_PAYWALL_CONFIG.unlockedProfiles.length).toBe(5);

    const annualPlan = SIFT_PAYWALL_CONFIG.tiers.find((p) => p.billingPeriod === 'annual');
    expect(annualPlan).toBeDefined();
    expect(annualPlan?.priceDisplay).toBe('$39.99 / year');

    const monthlyPlan = SIFT_PAYWALL_CONFIG.tiers.find((p) => p.billingPeriod === 'monthly');
    expect(monthlyPlan).toBeDefined();
    expect(monthlyPlan?.priceDisplay).toBe('$4.99 / month');
  });
});
