export interface FeatureFlags {
  enableGeminiAI: boolean;
  enableShareEmail: boolean;
  enableExport: boolean;
  enableUrgentAlarms: boolean;
  enableOTAUpdates: boolean;
  enableSubscriptions: boolean;
}

export const featureFlags: FeatureFlags = {
  enableGeminiAI: true,
  enableShareEmail: true,
  enableExport: true,
  enableUrgentAlarms: true,
  enableOTAUpdates: true,
  enableSubscriptions: true,
};
