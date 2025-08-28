import { IconName } from '@/components/ui/icon-map';

interface HelpSection {
  title: string;
  id: string;
  icon: IconName;
  subsections?: {
    title: string;
    id: string;
  }[];
}

export const helpSections: HelpSection[] = [
  {
    title: 'Getting Started',
    id: 'getting-started',
    icon: 'rocket',
    subsections: [
      { title: 'Signing Up', id: 'getting-started-signup' },
      { title: 'Creating Your First Account', id: 'getting-started-first-account' },
      { title: 'Understanding the Layout', id: 'getting-started-layout' }
    ]
  },
  { title: 'Dashboard', id: 'dashboard', icon: 'layoutGrid' },
  { title: 'Transactions', id: 'transactions', icon: 'arrowLeftRight' },
  {
    title: 'Accounts',
    id: 'accounts',
    icon: 'landmark',
    subsections: [
      { title: 'Accounts List', id: 'accounts-list' },
      { title: 'Account Details', id: 'accounts-details' },
      { title: 'Account Sharing', id: 'accounts-sharing' },
      { title: 'Shared With Me', id: 'accounts-shared-with-me' }
    ]
  },
  {
    title: 'Planning',
    id: 'planning',
    icon: 'calendarCheck',
    subsections: [
      { title: 'Budgets', id: 'planning-budgets' },
      { title: 'Goals', id: 'planning-goals' },
      { title: 'Investments', id: 'planning-investments' },
      { title: 'Debts', id: 'planning-debts' }
    ]
  },
  { title: 'AI Assistant', id: 'ai-assistant', icon: 'sparkles' },
  { title: 'Data Management', id: 'data-management', icon: 'database' },
  { title: 'Profile & Settings', id: 'profile-settings', icon: 'user' }
];

/**
 * Maps application URL paths (using regex) to specific help section IDs.
 * This is used by the contextual help sidebar to know which .mdx file to load.
 * The order is important: more specific paths should come first.
 */
export const pathMappings = [
  // More specific paths first
  { path: /^\/transactions\/import$/, id: 'data-management', title: 'Importing Data' },
  { path: /^\/accounts\/statement$/, id: 'data-management', title: 'Generating Statements' },
  { path: /^\/accounts\/shares\/[a-f0-9-]+$/, id: 'accounts', title: 'Account Sharing' },
  { path: /^\/accounts\/[a-f0-9-]+$/, id: 'accounts', title: 'Account Details' },
  { path: /^\/investment\/[a-f0-9-]+$/, id: 'planning', title: 'Investment Details' },
  // General paths
  { path: /^\/dashboard$/, id: 'dashboard', title: 'Dashboard Help' },
  { path: /^\/transactions$/, id: 'transactions', title: 'Transactions Help' },
  { path: /^\/accounts$/, id: 'accounts', title: 'Managing Accounts' },
  { path: /^\/shared-accounts$/, id: 'accounts', title: 'Shared Accounts' },
  { path: /^\/category$/, id: 'transactions', title: 'Managing Categories' },
  { path: /^\/budget$/, id: 'planning', title: 'Budgeting Help' },
  { path: /^\/goal$/, id: 'planning', title: 'Savings Goals Help' },
  { path: /^\/investment$/, id: 'planning', title: 'Investments Help' },
  { path: /^\/debts$/, id: 'planning', title: 'Debt Management' },
  { path: /^\/ai-chat$/, id: 'ai-assistant', title: 'AI Assistant Guide' },
  { path: /^\/profile$/, id: 'profile-settings', title: 'Profile & Settings' }
];
