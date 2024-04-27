import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

// <---------------------------------------------- Enums ----------------------------------------------->

export const roleEnum = pgEnum('role', ['user', 'admin']);

// <---------------------------------------------- Tables ----------------------------------------------->

// User Schema
export const User = pgTable(
  'user',
  {
    id: varchar('id', { length: 64 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt'),
  },
  (user) => {
    return {
      userNameIndex: uniqueIndex('userNameIndex').on(user.name),
    };
  },
);

// Account Schema
export const Account = pgTable(
  'account',
  {
    id: varchar('id', { length: 64 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 64 }).notNull(),
    owner: varchar('owner', { length: 64 })
      .notNull()
      .references(() => User.id),
    balance: real('balance').default(0),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt'),
    isDefault: boolean('isDefault').default(false),
  },
  (t) => ({
    accountNameIndex: index('accountNameIndex').on(t.name),
    accountOwnerIndex: index('accountOwnerIndex').on(t.owner),
  }),
);

// UserAccount many-to-many relationship
export const UserAccount = pgTable(
  'user_account',
  {
    userId: varchar('userId', { length: 64 }).references(() => User.id),
    accountId: varchar('accountId', { length: 64 }).references(() => Account.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.accountId] }),
  }),
);

// Transaction Schema
export const Transaction = pgTable(
  'transaction',
  {
    id: varchar('id', { length: 64 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    text: varchar('text', { length: 255 }).notNull(),
    amount: real('amount').notNull(),
    isIncome: boolean('isIncome').notNull(),
    transfer: varchar('transfer', { length: 64 }),
    category: varchar('category', { length: 64 }).references(() => Category.id),
    account: varchar('account', { length: 64 }).references(() => Account.id),
    createdBy: varchar('createdBy', { length: 64 }).references(() => User.id),
    updatedBy: varchar('updatedBy', { length: 64 }).references(() => User.id),
    owner: varchar('owner', { length: 64 }).references(() => User.id),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt'),
  },
  (t) => ({
    textIndex: index('textIndex').on(t.text),
    amountIndex: index('amountIndex').on(t.amount),
    amountAccountIndex: index('amountAccountIndex').on(t.amount, t.account),
    amountCategoryIndex: index('amountCategoryIndex').on(t.amount, t.category),
  }),
);

// Category Schema
export const Category = pgTable(
  'category',
  {
    id: varchar('id', { length: 64 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 64 }).notNull(),
    owner: varchar('owner', { length: 64 }).references(() => User.id),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt'),
  },
  (t) => ({
    catNameIndex: uniqueIndex('catNameIndex').on(t.name, t.owner),
  }),
);

// Analytics Schema
export const Analytics = pgTable('analytics', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  account: varchar('account', { length: 64 }).references(() => Account.id),
  user: varchar('user', { length: 64 }).references(() => User.id),
  income: real('income').default(0),
  expense: real('expense').default(0),
  balance: real('balance').default(0),
  previousIncome: real('previousIncome').default(0),
  previousExpenses: real('previousExpenses').default(0),
  previousBalance: real('previousBalance').default(0),
  incomePercentageChange: real('incomePercentageChange').default(0),
  expensesPercentageChange: real('expensesPercentageChange').default(0),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt'),
});

// ImportData Schema
export const ImportData = pgTable('import_data', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  account: varchar('account', { length: 64 }).references(() => Account.id),
  user: varchar('user', { length: 64 }).references(() => User.id),
  data: text('data').notNull(),
  totalRecords: integer('totalRecords').notNull(),
  errorRecords: integer('errorRecords').notNull(),
  isImported: boolean('isImported').default(false),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt'),
});

// Enum for Debts type
export const DebtType = pgEnum('DebtType', ['given', 'taken']);
export const InterestType = pgEnum('InterestType', ['simple', 'compound']);
// Debts table schema
export const Debts = pgTable(
  'debts',
  {
    id: varchar('id', { length: 64 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    amount: real('amount').notNull(),
    premiumAmount: real('premiumAmount').notNull(),
    createdBy: varchar('createdBy', { length: 64 }).references(() => User.id),
    description: varchar('description', { length: 255 }),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt'),
    dueDate: date('dueDate'),
    duration: varchar('duration', { length: 64 }),
    percentage: real('percentage').notNull(),
    frequency: varchar('frequency', { length: 64 }),
    isPaid: boolean('isPaid').default(false),
    userId: varchar('userId', { length: 64 }).references(() => User.id),
    type: DebtType('type').notNull(),
    interestType: InterestType('interestType').notNull(),
    account: varchar('account', { length: 64 }).references(() => Account.id),
  },
  (table) => ({
    paymentStatusIndex: index('payment_status_index').on(table.isPaid, table.dueDate),
    createdByAccountIndex: index('createdByAccountIndex').on(table.createdBy, table.account),
  }),
);

// <---------------------------------------------- Relations ----------------------------------------------->

// Relations Schema users
export const usersRelations = relations(User, ({ many }) => ({
  accounts: many(Account),
  transactions: many(Transaction, {
    relationName: 'owner',
  }),
  importData: many(ImportData),
  debtsUser: many(Debts),
  userDebts: many(Debts),
}));

export const debtsRelations = relations(Debts, ({ one }) => ({
  userId: one(User, {
    fields: [Debts.userId],
    references: [User.id],
    relationName: 'userId',
  }),
  createdBy: one(User, {
    fields: [Debts.createdBy],
    references: [User.id],
    relationName: 'createdBy',
  }),
  account: one(Account, {
    fields: [Debts.account],
    references: [Account.id],
  }),
}));

// Relations Schema accounts
export const accountsRelations = relations(Account, ({ one, many }) => ({
  owner: one(User, {
    fields: [Account.owner],
    references: [User.id],
  }),
  debts: many(Debts, {
    relationName: 'account',
  }),
}));

// Relations Schema userAccount
export const userAccountRelations = relations(UserAccount, ({ one }) => ({
  shareAccount: one(Account, {
    fields: [UserAccount.accountId],
    references: [Account.id],
  }),
  user: one(User, {
    fields: [UserAccount.userId],
    references: [User.id],
  }),
}));

export const categoriesRelations = relations(Category, ({ one }) => ({
  owner: one(User, {
    fields: [Category.owner],
    references: [User.id],
  }),
}));

// Relations Schema transactions
export const transactionsRelations = relations(Transaction, ({ one }) => ({
  account: one(Account, {
    fields: [Transaction.account],
    references: [Account.id],
  }),
  category: one(Category, {
    fields: [Transaction.category],
    references: [Category.id],
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

// Relations Schema analytics
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

// Relations Schema importData
export const importDataRelations = relations(ImportData, ({ one }) => ({
  account: one(Account, {
    fields: [ImportData.account],
    references: [Account.id],
  }),
  user: one(User, {
    fields: [ImportData.user],
    references: [User.id],
  }),
}));
