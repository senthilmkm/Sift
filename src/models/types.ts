export type ItemTab = 'actionable' | 'informational';
export type ItemStatus = 'open' | 'done' | 'read' | 'archived';
export type ConfidenceLevel = 'high' | 'medium' | 'check_date';

export type ProfileId = 'school' | 'elderCare' | 'smallBiz' | 'property' | 'legalImmigration';

export interface ProfileTheme {
  id: ProfileId;
  name: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  secondaryColor: string;
  badgeText: string;
  emptyStateText: string;
  tab1Name: string;
  tab2Name: string;
}

export interface SecondaryDate {
  label: string;
  date: string;
}

export interface ContactInfo {
  name?: string;
  phone?: string;
  email?: string;
  location_address?: string;
  url?: string;
}

export interface SiftItem {
  id: string;
  document_id: string;
  doc_filename?: string;
  image_path?: string;
  profile_id?: ProfileId;
  tab: ItemTab;
  title: string;
  notes?: string;
  due_at: string | null;
  source_snippet: string;
  status: ItemStatus;
  is_urgent: boolean;
  urgency_reason?: string;
  reminder_at: string | null;
  notification_id?: string | null;
  confidence?: ConfidenceLevel;
  action_checklist?: string[];
  contact_info?: ContactInfo;
  secondary_dates?: SecondaryDate[];
  metadata_json?: string; // JSON encoded profile-specific extra fields
  created_at: string;
  updated_at: string;
}

export interface SiftDocument {
  id: string;
  origin: 'camera' | 'share';
  filename: string;
  mime: string;
  image_path?: string;
  created_at: string;
}

export type SortByOption = 'due_date' | 'created_at' | 'title' | 'urgency';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  searchQuery: string;
  profileId?: ProfileId;
  tab?: ItemTab;
  status?: ItemStatus | 'all';
  urgentOnly: boolean;
  sortBy: SortByOption;
  sortOrder: SortOrder;
  taxCategory?: string;
}

export type AutoDeletePeriod = '1w' | '2w' | '4w' | '90d' | '180d' | 'never';

export interface UserPreferences {
  activeProfile: ProfileId;
  enabledProfiles: ProfileId[];
  onboardingCompleted: boolean;
  enableNotifications: boolean;
  enableCriticalAlerts: boolean;
  enablePiiRedaction: boolean;
  enableBiometricLock: boolean;
  defaultReminderTime: string;
  reminderSound: string;
  autoDeletePeriod: AutoDeletePeriod;
  freeScansUsed: number;
  isSubscribed: boolean;
  activePlanId?: string;
}

export interface CandidateItem {
  title: string;
  summary?: string;
  tab: ItemTab;
  due_date: string | null;
  due_time?: string | null;
  secondary_dates?: SecondaryDate[];
  source_snippet: string;
  confidence: ConfidenceLevel;
  is_urgent?: boolean;
  urgency_reason?: string;
  action_checklist?: string[];
  contact_info?: ContactInfo;
  profile_id?: ProfileId;
  metadata_json?: string;
}