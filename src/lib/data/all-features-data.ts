import {
  Users,
  Database,
  BarChart,
  Target,
  Scale,
  TrendingUp,
  BrainCircuit,
  Lock,
  ArrowLeftRight,
  Filter,
  FileDown,
  Tag
} from 'lucide-react';

export const allFeaturesData = [
  {
    icon: Lock,
    title: 'Secure Authentication',
    description: 'JWT-based login, registration, and password reset flows.'
  },
  {
    icon: Users,
    title: 'Account Sharing',
    description: 'Securely share accounts with other users and manage permissions.'
  },
  {
    icon: ArrowLeftRight,
    title: 'Full CRUD Operations',
    description: 'Create, read, edit, and delete transactions with ease.'
  },
  {
    icon: Filter,
    title: 'Advanced Filtering',
    description: 'Powerful filters for date, category, type, and text search.'
  },
  {
    icon: Database,
    title: 'Data Import',
    description: 'Import transactions from XLSX templates and PDF bank statements.'
  },
  {
    icon: FileDown,
    title: 'Data Export',
    description: 'Export your filtered transaction data to XLSX or CSV formats.'
  },
  {
    icon: Tag,
    title: 'Smart Categorization',
    description: 'Intuitive category management with inline creation.'
  },
  {
    icon: BarChart,
    title: 'Interactive Dashboard',
    description: 'Customizable widgets for a complete financial overview.'
  },
  {
    icon: Target,
    title: 'Budgeting & Goals',
    description: 'Set monthly budgets and track savings goals visually.'
  },
  {
    icon: Scale,
    title: 'Debt Management',
    description: 'Track loans with details on interest, duration, and status.'
  },
  {
    icon: TrendingUp,
    title: 'Investment Tracking',
    description: 'Monitor holdings and overall portfolio performance.'
  },
  {
    icon: BrainCircuit,
    title: 'AI Assistant',
    description: 'Use natural language to add transactions and get summaries.'
  }
];
