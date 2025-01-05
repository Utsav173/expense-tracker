import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

// <---------------------------------------------- Enums ----------------------------------------------->
export const roleEnum = pgEnum('role', ['user', 'admin']);
export const DebtType = pgEnum('DebtType', ['given', 'taken']);
export const InterestType = pgEnum('InterestType', ['simple', 'compound']);
export const RecurrenceType = pgEnum('recurrence_type', ['daily', 'weekly', 'monthly', 'yearly']);

// <---------------------------------------------- Common Columns ----------------------------------------------->
const commonFields = {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt'),
};

// <---------------------------------------------- Tables ----------------------------------------------->
export const User = pgTable(
  'user',
  {
    ...commonFields,
    name: varchar('name', { length: 64 }).notNull(),
    email: varchar('email', { length: 64 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    token: text('token'),
    isSocial: boolean('isSocial').default(false),
    profilePic: text('profilePic').default('https://i.stack.imgur.com/l60Hf.png'),
    role: roleEnum('role').default('user'),
    isActive: boolean('isActive').default(true),
    lastLoginAt: timestamp('lastLoginAt'),
    resetPasswordToken: text('resetPasswordToken'),
    preferredCurrency: varchar('preferredCurrency', { length: 3 }).default('INR'),
  },
  (table) => [
    uniqueIndex('user_email_idx').on(table.email),
    uniqueIndex('userNameIndex').on(table.name),
  ],
);

export const Account = pgTable(
  'account',
  {
    ...commonFields,
    name: varchar('name', { length: 64 }).notNull(),
    owner: varchar('owner', { length: 64 })
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    balance: real('balance').default(0),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    isDefault: boolean('isDefault').default(false),
  },
  (table) => [index('accountNameIndex').on(table.name), index('accountOwnerIndex').on(table.owner)],
);

export const UserAccount = pgTable(
  'user_account',
  {
    ...commonFields,
    userId: varchar('userId', { length: 64 })
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    accountId: varchar('accountId', { length: 64 })
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
  },
  (table) => [uniqueIndex('userAccountUniqueIndex').on(table.userId, table.accountId)],
);

export const Category = pgTable(
  'category',
  {
    ...commonFields,
    name: varchar('name', { length: 64 }).notNull(),
    owner: varchar('owner', { length: 64 }).references(() => User.id),
  },
  (table) => [uniqueIndex('catNameIndex').on(table.name, table.owner)],
);

export const Transaction = pgTable(
  'transaction',
  {
    ...commonFields,
    text: varchar('text', { length: 255 }).notNull(),
    amount: real('amount').notNull(),
    isIncome: boolean('isIncome').notNull(),
    transfer: varchar('transfer', { length: 64 }),
    category: varchar('category', { length: 64 }).references(() => Category.id, {
      onDelete: 'set null',
    }),
    account: varchar('account', { length: 64 })
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    createdBy: varchar('createdBy', { length: 64 })
      .notNull()
      .references(() => User.id),
    updatedBy: varchar('updatedBy', { length: 64 }).references(() => User.id),
    owner: varchar('owner', { length: 64 })
      .notNull()
      .references(() => User.id),
    // Recurring Transaction Fields
    recurring: boolean('recurring').default(false),
    recurrenceType: RecurrenceType('recurrence_type'),
    recurrenceEndDate: timestamp('recurrence_end_date'),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'), // Multi-Currency Support
  },
  (table) => [
    index('textIndex').on(table.text),
    index('amountIndex').on(table.amount),
    index('ownerIdx').on(table.owner),
    index('accountIdx').on(table.account),
    index('createdAtIdx').on(table.createdAt),
    index('amountAccountIndex').on(table.amount, table.account),
    index('amountCategoryIndex').on(table.amount, table.category),
  ],
);

export const Analytics = pgTable('analytics', {
  ...commonFields,
  account: varchar('account', { length: 64 })
    .notNull()
    .references(() => Account.id, { onDelete: 'cascade' }),
  user: varchar('user', { length: 64 })
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  income: real('income').default(0),
  expense: real('expense').default(0),
  balance: real('balance').default(0),
  previousIncome: real('previousIncome').default(0),
  previousExpenses: real('previousExpenses').default(0),
  previousBalance: real('previousBalance').default(0),
  incomePercentageChange: real('incomePercentageChange').default(0),
  expensesPercentageChange: real('expensesPercentageChange').default(0),
});

export const ImportData = pgTable('import_data', {
  ...commonFields,
  account: varchar('account', { length: 64 })
    .notNull()
    .references(() => Account.id, { onDelete: 'cascade' }),
  user: varchar('user', { length: 64 })
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  data: text('data').notNull(),
  totalRecords: integer('totalRecords').notNull(),
  errorRecords: integer('errorRecords').notNull(),
  isImported: boolean('isImported').default(false),
});

export const Debts = pgTable(
  'debts',
  {
    ...commonFields,
    amount: real('amount').notNull(),
    premiumAmount: real('premiumAmount').notNull(),
    createdBy: varchar('createdBy', { length: 64 })
      .notNull()
      .references(() => User.id),
    description: varchar('description', { length: 255 }),
    dueDate: date('dueDate'),
    duration: varchar('duration', { length: 64 }),
    percentage: real('percentage').notNull(),
    frequency: varchar('frequency', { length: 64 }),
    isPaid: boolean('isPaid').default(false),
    userId: varchar('userId', { length: 64 })
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    type: DebtType('type').notNull(),
    interestType: InterestType('interestType').notNull(),
    account: varchar('account', { length: 64 }).references(() => Account.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('payment_status_index').on(table.isPaid, table.dueDate),
    index('createdByAccountIndex').on(table.createdBy, table.account),
  ],
);

export const Budget = pgTable(
  'budget',
  {
    ...commonFields,
    userId: varchar('userId', { length: 64 })
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 64 })
      .notNull()
      .references(() => Category.id, { onDelete: 'cascade' }),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    amount: real('amount').notNull(),
  },
  (budget) => [
    uniqueIndex('budget_unique_index').on(
      budget.userId,
      budget.category,
      budget.month,
      budget.year,
    ),
  ],
);

export const SavingGoal = pgTable('saving_goal', {
  ...commonFields,
  userId: varchar('userId', { length: 64 })
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  targetAmount: real('targetAmount').notNull(),
  savedAmount: real('savedAmount').default(0),
  targetDate: timestamp('targetDate'),
});

export const InvestmentAccount = pgTable(
  'investment_account',
  {
    ...commonFields,
    userId: varchar('userId', { length: 64 })
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    platform: varchar('platform', { length: 64 }),
    balance: real('balance').default(0),
    currency: varchar('currency', { length: 3 }).notNull(),
  },
  (table) => [index('investmentAccountUserIdIndex').on(table.userId)],
);

export const Investment = pgTable(
  'investment',
  {
    ...commonFields,
    account: varchar('account', { length: 64 })
      .notNull()
      .references(() => InvestmentAccount.id, { onDelete: 'cascade' }),
    symbol: varchar('symbol', { length: 16 }).notNull(),
    shares: real('shares'),
    purchasePrice: real('purchasePrice'),
    purchaseDate: timestamp('purchaseDate'),
    dividend: real('dividend').default(0),
    investedAmount: real('investedAmount'),
  },
  (table) => [index('investedAccountSymbolIdx').on(table.account, table.symbol)],
);
// <---------------------------------------------- Relations ----------------------------------------------->
export const usersRelations = relations(User, ({ many }) => ({
  accounts: many(Account),
  transactions: many(Transaction, { relationName: 'owner' }), // now consistency
  investmentAccounts: many(InvestmentAccount, {
    relationName: 'userInvestments', //added consistent naming
  }),
}));

export const accountsRelations = relations(Account, ({ one, many }) => ({
  owner: one(User, {
    fields: [Account.owner],
    references: [User.id],
  }),
  transactions: many(Transaction, {
    relationName: 'accountTransactions',
  }),
  debts: many(Debts, { relationName: 'accountDebts' }),
}));

export const debtsRelations = relations(Debts, ({ one }) => ({
  account: one(Account, {
    fields: [Debts.account],
    references: [Account.id],
    relationName: 'accountDebts',
  }),
}));

export const categoriesRelations = relations(Category, ({ one, many }) => ({
  owner: one(User, {
    fields: [Category.owner],
    references: [User.id],
  }),
  transactions: many(Transaction, { relationName: 'categoryTransactions' }), // now consistency
  budgets: many(Budget, { relationName: 'categoryBudgets' }),
}));

export const transactionsRelations = relations(Transaction, ({ one }) => ({
  account: one(Account, {
    fields: [Transaction.account],
    references: [Account.id],
    relationName: 'accountTransactions',
  }),
  category: one(Category, {
    fields: [Transaction.category],
    references: [Category.id],
    relationName: 'categoryTransactions',
  }),
  owner: one(User, {
    fields: [Transaction.owner],
    references: [User.id],
    relationName: 'owner',
  }),
  createdBy: one(User, {
    fields: [Transaction.createdBy],
    references: [User.id],
    relationName: 'createdBy',
  }),
  updatedBy: one(User, {
    fields: [Transaction.updatedBy],
    references: [User.id],
    relationName: 'updatedBy',
  }),
}));

export const analyticsRelations = relations(Analytics, ({ one }) => ({
  account: one(Account, {
    fields: [Analytics.account],
    references: [Account.id],
  }),
  user: one(User, {
    fields: [Analytics.user],
    references: [User.id],
  }),
}));

export const budgetRelations = relations(Budget, ({ one }) => ({
  category: one(Category, {
    fields: [Budget.category],
    references: [Category.id],
    relationName: 'categoryBudgets',
  }),
  user: one(User, {
    fields: [Budget.userId],
    references: [User.id],
    relationName: 'budgetUser',
  }),
}));

export const investmentAccountRelations = relations(InvestmentAccount, ({ one, many }) => ({
  user: one(User, {
    fields: [InvestmentAccount.userId],
    references: [User.id],
    relationName: 'userInvestments',
  }),
  investments: many(Investment, {
    relationName: 'accountInvestments', //explicit reference, now will remove error from type checks
  }),
}));

export const investmentRelations = relations(Investment, ({ one }) => ({
  account: one(InvestmentAccount, {
    fields: [Investment.account],
    references: [InvestmentAccount.id],
    relationName: 'accountInvestments', //explicit naming for relationship type from another table now
  }),
}));
