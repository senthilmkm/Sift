import { blurImagePii } from '../src/services/imagePiiBlur';

describe('Image PII Blurring Engine', () => {
  it('handles empty image input gracefully', async () => {
    const result = await blurImagePii('', 'school');
    expect(result.isBlurred).toBe(false);
    expect(result.blurCount).toBe(0);
    expect(result.sanitizedBase64).toBe('');
  });

  it('detects and blurs SSN on Elder Care & Health profile image', async () => {
    const textWithSsn = 'Patient SSN: 123-45-6789 Medicare ID: 1EG4-TE5-MK72';
    const result = await blurImagePii('base64_data_health', 'elderCare', textWithSsn);
    expect(result.isBlurred).toBe(true);
    expect(result.blurCount).toBeGreaterThanOrEqual(2);
    expect(result.detectedBoxes.length).toBeGreaterThanOrEqual(2);
    expect(result.sanitizedBase64).toContain('blurred');
  });

  it('detects credit card number on Trades profile image', async () => {
    const textWithCc = 'Payment Credit Card: 4532-1234-5678-9012 Exp 12/28';
    const result = await blurImagePii('base64_data_trades', 'smallBiz', textWithCc);
    expect(result.isBlurred).toBe(true);
    expect(result.blurCount).toBeGreaterThanOrEqual(1);
    expect(result.detectedBoxes[0].label).toBe('Credit Card Number');
  });

  it('returns unblurred image when no PII is present', async () => {
    const cleanText = 'Field trip to Science Center on Friday October 15. Fee $10.';
    const result = await blurImagePii('clean_base64', 'school', cleanText);
    expect(result.isBlurred).toBe(false);
    expect(result.blurCount).toBe(0);
    expect(result.sanitizedBase64).toBe('clean_base64');
  });
});
