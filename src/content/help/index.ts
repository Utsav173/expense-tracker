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
  {
    title: 'Dashboard',
    id: 'dashboard',
    icon: 'layoutGrid',
    subsections: [
      { title: 'Financial Snapshot', id: 'dashboard-financial-snapshot' },
      { title: 'Financial Trends', id: 'dashboard-financial-trends' },
      { title: 'Spending Breakdown', id: 'dashboard-spending-breakdown' }
    ]
  },
  {
    title: 'Transactions',
    id: 'transactions',
    icon: 'transaction',
    subsections: [
      { title: 'Managing Transactions', id: 'transactions-management' },
      { title: 'Importing Data', id: 'transactions-import' }
    ]
  },
  {
    title: 'Accounts',
    id: 'accounts',
    icon: 'landmark',
    subsections: [
      { title: 'Accounts List', id: 'accounts-listing' },
      { title: 'Account Details', id: 'accounts-details' },
      { title: 'Account Sharing', id: 'accounts-sharing' },
      { title: 'Generating Statements', id: 'accounts-statement' }
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
  {
    title: 'AI Assistant',
    id: 'ai-assistant',
    icon: 'sparkles',
    subsections: [
      { title: 'API Key Setup', id: 'ai-assistant-setup' },
      { title: 'Usage Guide', id: 'ai-assistant-usage' }
    ]
  },
  { title: 'Profile & Settings', id: 'profile-settings', icon: 'user' }
];

/**
 * Maps application URL paths (using regex) to specific help section IDs.
 * This is used by the contextual help sidebar to know which .mdx file to load.
 * The order is important: more specific paths should come first.
 */
export const pathMappings = [
  // More specific paths first
  { path: /^\/transactions\/import$/, id: 'transactions-import', title: 'Importing Transactions' },
  { path: /^\/accounts\/statement$/, id: 'accounts-statement', title: 'Generating Statements' },
  { path: /^\/accounts\/shares\/[a-f0-9-]+$/, id: 'accounts-sharing', title: 'Account Sharing' },
  { path: /^\/accounts\/[a-f0-9-]+$/, id: 'accounts-details', title: 'Account Details' },
  { path: /^\/investment\/[a-f0-9-]+$/, id: 'planning-investments', title: 'Investment Details' },

  // General paths
  { path: /^\/dashboard$/, id: 'dashboard', title: 'Dashboard Help' },
  { path: /^\/transactions$/, id: 'transactions-management', title: 'Transactions Help' },
  { path: /^\/accounts$/, id: 'accounts-listing', title: 'Managing Accounts' },
  { path: /^\/shared-accounts$/, id: 'accounts-sharing', title: 'Shared Accounts' },
  { path: /^\/category$/, id: 'transactions-management', title: 'Managing Categories' },
  { path: /^\/budget$/, id: 'planning-budgets', title: 'Budgeting Help' },
  { path: /^\/goal$/, id: 'planning-goals', title: 'Savings Goals Help' },
  { path: /^\/investment$/, id: 'planning-investments', title: 'Investments Help' },
  { path: /^\/debts$/, id: 'planning-debts', title: 'Debt Management' },
  { path: /^\/ai-chat$/, id: 'ai-assistant', title: 'AI Assistant Guide' },
  { path: /^\/profile$/, id: 'profile-settings', title: 'Profile & Settings' }
];
