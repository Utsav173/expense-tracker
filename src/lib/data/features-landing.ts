export const featuresData = [
  {
    id: 'ai-assistant',
    headline: 'Talk to Your Money',
    description:
      'Stop wrestling with forms. Just tell our AI Assistant what you need in plain English. Add transactions, get spending summaries, or ask complex questions.',
    bullets: [
      'Add expenses and income with natural language.',
      "Ask for summaries: 'How much did I spend on food last month?'",
      'Get smart, context-aware suggestions.',
      'Securely uses your own AI provider API key.'
    ]
  },
  {
    id: 'dashboard',
    headline: 'Your Financial Command Center',
    description:
      'See your entire financial life in one place. Our interactive dashboard gives you a complete picture of your net worth, spending trends, and goal progress.',
    bullets: [
      'Customizable widgets for what matters most to you.',
      'Rich, interactive charts powered by Recharts.',
      'Track income, expenses, investments, and debts.',
      'Assess your financial health with an intelligent score.'
    ]
  },
  {
    id: 'data-import',
    headline: 'Get Your Data In, Instantly',
    description:
      'Getting started is the hardest part—so we made it easy. Drag and drop your bank statements, and let our AI automatically extract and categorize your transactions.',
    bullets: [
      'AI-Powered PDF Import: Turn bank statements into categorized data.',
      'Import from XLSX templates for bulk entries.',
      'Export your filtered data to XLSX or CSV anytime.'
    ]
  }
];

export const imageToTheme = {
  'ai-assistant': {
    light: '/feature-ai-light.webp',
    dark: '/feature-ai-dark.webp'
  },
  'data-import': {
    light: '/feature-import-light.webp',
    dark: '/feature-import-dark.webp'
  },
  dashboard: {
    light: '/og-image-dashboard-desktop-light.webp',
    dark: '/og-image-dashboard-desktop-dark.webp'
  }
};
