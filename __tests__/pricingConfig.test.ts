import pricingData from '../src/config/pricing.json';

describe('Pricing Configuration & Paywall Schema Tests', () => {
  it('validates pricing.json structure and active plans', () => {
    expect(pricingData.paywallTitle).toBeDefined();
    expect(pricingData.plans).toBeInstanceOf(Array);
    expect(pricingData.plans.length).toBeGreaterThan(0);

    const annualPlan = pricingData.plans.find((p) => p.billingPeriod === 'annual');
    expect(annualPlan).toBeDefined();
    expect(annualPlan?.price).toBe('$29.99');
    expect(annualPlan?.enabled).toBe(true);

    const monthlyPlan = pricingData.plans.find((p) => p.billingPeriod === 'monthly');
    expect(monthlyPlan).toBeDefined();
    expect(monthlyPlan?.price).toBe('$4.99');
  });
});
