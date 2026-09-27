import { PROFILE_CONFIGS, ALL_PROFILES } from '../src/config/profiles';

describe('Profile Themes & Configurations Registry', () => {
  test('contains all 5 smart profiles', () => {
    expect(ALL_PROFILES).toHaveLength(5);
    expect(ALL_PROFILES).toContain('school');
    expect(ALL_PROFILES).toContain('elderCare');
    expect(ALL_PROFILES).toContain('smallBiz');
    expect(ALL_PROFILES).toContain('property');
    expect(ALL_PROFILES).toContain('legalImmigration');
  });

  test('each profile has complete theme tokens and colors', () => {
    for (const profileId of ALL_PROFILES) {
      const config = PROFILE_CONFIGS[profileId];
      expect(config.id).toBe(profileId);
      expect(config.name).toBeTruthy();
      expect(config.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(config.icon).toBeTruthy();
      expect(config.emptyStateText).toBeTruthy();
    }
  });
});
