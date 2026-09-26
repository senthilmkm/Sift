export type ItemTab = 'actionable' | 'informational';
export type ItemStatus = 'open' | 'done' | 'read' | 'archived';
export type ConfidenceLevel = 'high' | 'check_date';

export interface SiftItem {
  id: string;
  document_id: string;
  doc_filename?: string;
  tab: ItemTab;
  title: string;
  notes?: string;
  due_at: string | null;
  source_snippet: string;
  status: ItemStatus;
  is_urgent: boolean;
  reminder_at: string | null;
  notification_id?: string | null;
  confidence?: ConfidenceLevel;
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
  tab?: ItemTab;
  status?: ItemStatus | 'all';
  urgentOnly: boolean;
  sortBy: SortByOption;
  sortOrder: SortOrder;
}

export type AutoDeletePeriod = '1w' | '2w' | '4w' | '90d' | '180d' | 'never';

export interface UserPreferences {
  enableNotifications: boolean;
  defaultReminderTime: string;
  reminderSound: string;
  autoDeletePeriod: AutoDeletePeriod;
  freeScansUsed: number;
  isSubscribed: boolean;
  activePlanId?: string;
}

export interface CandidateItem {
  title: string;
  tab: ItemTab;
  due_date: string | null;
  due_time?: string | null;
  source_snippet: string;
  confidence: ConfidenceLevel;
  is_urgent?: boolean;
}