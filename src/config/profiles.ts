import { ProfileId, ProfileTheme } from '../models/types';

export const PROFILE_CONFIGS: Record<ProfileId, ProfileTheme> = {
  school: {
    id: 'school',
    name: 'School & Family',
    subtitle: 'Flyers, permission slips, spirit days & PTA sign-ups',
    icon: 'school-outline',
    accentColor: '#6366f1', // Indigo
    secondaryColor: '#f59e0b', // Amber
    badgeText: 'DEFAULT',
    emptyStateText: 'No pending school flyers! Enjoy your quiet fridge.',
    tab1Name: '📋 Actionable',
    tab2Name: 'ℹ️ Informational',
  },
  elderCare: {
    id: 'elderCare',
    name: 'Elder Care & Health',
    subtitle: 'Doctor pre-op fasting, lab preps & Rx refills',
    icon: 'medical-outline',
    accentColor: '#0d9488', // Teal
    secondaryColor: '#f43f5e', // Rose
    badgeText: 'POPULAR',
    emptyStateText: 'All care directives & doctor preps are organized.',
    tab1Name: '🩺 Directives & Preps',
    tab2Name: '💊 Rx & Records',
  },
  smallBiz: {
    id: 'smallBiz',
    name: 'Small Business & Trades',
    subtitle: 'Net-30 invoices, permits & tax notices',
    icon: 'briefcase-outline',
    accentColor: '#10b981', // Emerald
    secondaryColor: '#334155', // Slate
    badgeText: 'PRO',
    emptyStateText: 'No unpaid invoices or expiring permits found!',
    tab1Name: '💳 Unpaid Invoices',
    tab2Name: '📄 Permits & Receipts',
  },
  property: {
    id: 'property',
    name: 'Property & HOA',
    subtitle: 'Leases, HOA violation fines & utility warnings',
    icon: 'home-outline',
    accentColor: '#06b6d4', // Cyan
    secondaryColor: '#8b5cf6', // Violet
    badgeText: 'NEW',
    emptyStateText: 'Property notices and tenant quotes up to date.',
    tab1Name: '⚠️ Pending Actions',
    tab2Name: '📝 Notices & Quotes',
  },
  legalImmigration: {
    id: 'legalImmigration',
    name: 'Legal & Immigration',
    subtitle: 'USCIS biometrics, I-797 notices & court dates',
    icon: 'scale-outline',
    accentColor: '#7c3aed', // Purple
    secondaryColor: '#dc2626', // Red
    badgeText: 'CRITICAL',
    emptyStateText: 'No urgent court dates or USCIS notices pending.',
    tab1Name: '⚖️ Court & Hearings',
    tab2Name: '📄 Filings & Notices',
  },
};

export const ALL_PROFILES: ProfileId[] = ['school', 'elderCare', 'smallBiz', 'property', 'legalImmigration'];
