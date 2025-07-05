import { InferInsertModel, InferSelectModel, eq, sql } from 'drizzle-orm';
import { db } from '.';
import { Account, Analytics, Category, Debts, Transaction, User, RecurrenceType } from './schema';
import bcrypt from 'bcryptjs';
import { Chance } from 'chance';
import chalk from 'chalk';
import { PromisePool } from '@supercharge/promise-pool';
import cliProgress from 'cli-progress';
import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
  endOfYear,
} from 'date-fns';

const ACCOUNTS_PER_USER = 3;
const TRANSACTIONS_PER_ACCOUNT = 250;
const MAX_CONCURRENCY = 5;
const BATCH_SIZE = 500;

const chance = new Chance();
const progressBar = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format: ' {bar} | {task} | {value}/{total} Chunks | ETA: {eta_formatted}',
  },
  cliProgress.Presets.shades_classic,
);

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function clearSampleUserData() {
  console.log(chalk.yellow('Clearing sampleuser@example.com data...'));
  const user = await db.query.User.findFirst({
    where: eq(User.email, 'sampleuser@example.com'),
  });

  if (!user) {
    console.log(chalk.green('No sample user found to clear.'));
    return;
  }

  console.log(chalk.yellow(`Found user ${user.name} (${user.id}). Clearing related data...`));
  const task = progressBar.create(5, 0, { task: chalk.red('Clearing User Data') });

  // 1. Delete records with non-cascading foreign keys first
  await db.delete(Debts).where(eq(Debts.createdBy, user.id));
  task.increment();

  await db.delete(Transaction).where(eq(Transaction.owner, user.id));
  task.increment();

  await db.delete(Category).where(eq(Category.owner, user.id));
  task.increment();

  // 2. Delete the user. The rest of the data will be removed via 'onDelete: cascade'.
  await db.delete(User).where(eq(User.id, user.id));
  task.increment();

  progressBar.stop();
  console.log(chalk.green('Sample user data cleared successfully.'));
}

async function seedSampleUser(): Promise<InferSelectModel<typeof User>> {
  const usersTask = progressBar.create(1, 0, { task: chalk.cyan('Seeding Sample User') });
  const password = await bcrypt.hash('Password@123', 10);
  const userToInsert = {
    name: 'Sample User',
    email: 'sampleuser@example.com',
    password,
    isSocial: false,
    preferredCurrency: 'INR',
  };

  const insertedUsers = await db.insert(User).values(userToInsert).returning();
  const user = insertedUsers[0];
  usersTask?.increment();
  console.log(chalk.green(`\nSeeded sample user (INR Focus). ID: ${user.id}`));
  return user;
}

async function seedCategories(user: InferSelectModel<typeof User>): Promise<{
  categoriesMap: Map<string, InferSelectModel<typeof Category>>;
}> {
  const categoriesTask = progressBar.create(1, 0, { task: chalk.blue('Seeding Categories') });

  const sharedCategoryNames = [
    'Groceries',
    'Utilities (Electricity/Water)',
    'Rent/Home Loan EMI',
    'Transportation (Petrol/Metro)',
    'Healthcare',
    'Medical Bill',
    'Entertainment (Movies/OTT)',
    'Eating Out (Zomato/Swiggy)',
    'Coffee Shop',
    'Clothing',
    'Insurance (Life/Health)',
    'Gifts',
    'Donations',
    'Salary',
    'Freelance Work',
    'Business Income',
    'Interest Income',
    'Dividends',
    'Other Income',
    'Opening Balance',
    'Transfer In',
    'Transfer Out',
    'Home Repair',
    'Education Fees',
    'Travel (Holiday)',
    'Electronics Purchase',
    'Mobile Recharge/Bill',
    'Internet Bill',
    'Domestic Help',
    'Bank Charges',
  ];
  const userCategoriesToInsert: InferInsertModel<typeof Category>[] = [];

  sharedCategoryNames.forEach((name) => {
    userCategoriesToInsert.push({ name, owner: user.id });
  });

  const insertedUserCategories =
    userCategoriesToInsert.length > 0
      ? await db.insert(Category).values(userCategoriesToInsert).returning()
      : [];

  const allCategories = insertedUserCategories;
  const categoriesMap = new Map(allCategories.map((cat) => [cat.name, cat]));

  categoriesTask?.increment();
  console.log(chalk.green(`\nSeeded ${insertedUserCategories.length} user-specific categories.`));
  return { categoriesMap };
}

async function seedAccountsAndAnalytics(
  user: InferSelectModel<typeof User>,
  categoriesMap: Map<string, InferSelectModel<typeof Category>>,
): Promise<{ accounts: Map<string, InferSelectModel<typeof Account>[]> }> {
  const accountsTask = progressBar.create(ACCOUNTS_PER_USER, 0, {
    task: chalk.magenta('Seeding Accounts & Analytics (INR)'),
  });
  const accountsMap = new Map<string, InferSelectModel<typeof Account>[]>();
  const accountsToInsert: InferInsertModel<typeof Account>[] = [];
  const openingBalanceCategory = categoriesMap.get('Opening Balance');

  if (!openingBalanceCategory) {
    throw new Error('Opening Balance category not found after seeding categories.');
  }

  const userAccounts: InferInsertModel<typeof Account>[] = [];
  for (let i = 0; i < ACCOUNTS_PER_USER; i++) {
    let name = '';
    let initialBalance = 0;
    let currency = 'INR';
    switch (i) {
      case 0:
        name = `${user.name}'s Salary Account (ICICI)`;
        initialBalance = chance.floating({ min: 25000, max: 150000, fixed: 2 });
        break;
      case 1:
        name = `${user.name}'s Savings Account (HDFC)`;
        initialBalance = chance.floating({ min: 50000, max: 500000, fixed: 2 });
        break;
      default:
        name = `${user.name}'s Paytm Wallet`;
        initialBalance = chance.floating({ min: 500, max: 10000, fixed: 2 });
        break;
    }
    userAccounts.push({
      name,
      balance: initialBalance,
      owner: user.id,
      currency: currency,
      isDefault: i === 0,
    });
  }
  accountsToInsert.push(...userAccounts);
  accountsTask?.increment(ACCOUNTS_PER_USER);

  const insertedAccounts = await db.insert(Account).values(accountsToInsert).returning();

  insertedAccounts.forEach((acc) => {
    const userAccs = accountsMap.get(acc.owner) || [];
    userAccs.push(acc);
    accountsMap.set(acc.owner, userAccs);
  });

  const analyticsToInsert: InferInsertModel<typeof Analytics>[] = insertedAccounts.map((acc) => ({
    account: acc.id,
    user: acc.owner,
    income: acc.balance ?? 0,
    expense: 0,
    balance: acc.balance ?? 0,
    previousIncome: acc.balance ?? 0,
    previousExpenses: 0,
    previousBalance: acc.balance ?? 0,
    incomePercentageChange: (acc.balance ?? 0) > 0 ? 100 : 0,
    expensesPercentageChange: 0,
  }));

  if (analyticsToInsert.length > 0) {
    await db.insert(Analytics).values(analyticsToInsert);
  }

  const openingTransactions: InferInsertModel<typeof Transaction>[] = insertedAccounts.map(
    (acc) => ({
      account: acc.id,
      owner: acc.owner,
      createdBy: acc.owner,
      updatedBy: acc.owner,
      text: 'Opening Account Balance',
      amount: acc.balance ?? 0,
      isIncome: true,
      category: openingBalanceCategory.id,
      createdAt: subYears(new Date(), 2),
      currency: acc.currency,
      transfer: 'Initial Bank Deposit',
    }),
  );

  if (openingTransactions.length > 0) {
    await db.insert(Transaction).values(openingTransactions);
  }

  console.log(
    chalk.green(
      `\nSeeded ${insertedAccounts.length} accounts (INR), analytics entries, and opening balances.`,
    ),
  );
  return { accounts: accountsMap };
}

async function seedTransactions(
  user: InferSelectModel<typeof User>,
  accountsMap: Map<string, InferSelectModel<typeof Account>[]>,
  categoriesMap: Map<string, InferSelectModel<typeof Category>>,
) {
  console.log(
    chalk.yellow(
      `\nGenerating ${TRANSACTIONS_PER_ACCOUNT} transactions per account (INR Focus)...`,
    ),
  );
  const transactionTask = progressBar.create(ACCOUNTS_PER_USER * TRANSACTIONS_PER_ACCOUNT, 0, {
    task: chalk.blueBright('Generating Transactions'),
  });

  let allTransactions: InferInsertModel<typeof Transaction>[] = [];
  const today = new Date();
  const twoYearsAgo = subYears(today, 2);
  const transactionStartDate = addDays(twoYearsAgo, 1);
  const categories = Array.from(categoriesMap.values());
  const openingBalanceCategoryId = categoriesMap.get('Opening Balance')?.id;
  const transferInId = categoriesMap.get('Transfer In')?.id;
  const transferOutId = categoriesMap.get('Transfer Out')?.id;

  const incomeCategoryIds = categories
    .filter((c) =>
      [
        'Salary',
        'Freelance Work',
        'Business Income',
        'Interest Income',
        'Dividends',
        'Other Income',
        'Transfer In',
      ].includes(c.name),
    )
    .map((c) => c.id);
  const expenseCategoryIds = categories
    .filter(
      (c) =>
        c.id !== openingBalanceCategoryId &&
        !incomeCategoryIds.includes(c.id) &&
        c.id !== transferOutId,
    )
    .map((c) => c.id);

  const userAccounts = accountsMap.get(user.id) || [];

  if (expenseCategoryIds.length === 0 || incomeCategoryIds.length === 0) {
    console.warn(
      chalk.yellow(
        `User ${user.name} has insufficient income/expense categories. Skipping transactions.`,
      ),
    );
    transactionTask?.increment(userAccounts.length * TRANSACTIONS_PER_ACCOUNT);
    return;
  }

  for (const account of userAccounts) {
    let recurringCounter = 0;
    const specificKeywords = [
      'Urgent Bill',
      'Client Refund',
      'EMI Payment',
      'Swiggy Order',
      'Petrol Fill',
      'Consulting Invoice',
    ];
    let keywordIdx = 0;

    for (let i = 0; i < TRANSACTIONS_PER_ACCOUNT; i++) {
      let isIncome = chance.bool({ likelihood: 25 });
      let categoryId: string | null = null;
      let amount: number;
      let text = '';
      let transferParty: string | null = '';
      let transactionDate = randomDate(transactionStartDate, today);
      let recurring = false;
      let recurrenceType: (typeof RecurrenceType.enumValues)[number] | null = null;
      let recurrenceEndDate: Date | null = null;

      if (i % 50 === 0) transactionDate = startOfMonth(transactionDate);
      if (i % 75 === 0) transactionDate = endOfMonth(transactionDate);
      if (i % 100 === 0) transactionDate = startOfYear(transactionDate);
      if (i % 125 === 0) transactionDate = endOfYear(transactionDate);

      if (isIncome) {
        categoryId = chance.pickone(incomeCategoryIds);
        amount = chance.floating({ min: 500, max: 200000, fixed: 2 });
        text = `Income received from ${chance.word()}`;
        transferParty = chance.pickone([
          'Infosys Ltd.',
          'TCS',
          'Reliance Industries',
          'HDFC Bank',
          'Client Payment',
          'Self Transfer',
        ]);
      } else {
        categoryId = chance.pickone(expenseCategoryIds);
        amount = chance.floating({ min: 50, max: 25000, fixed: 2 });
        text = `Expense for ${chance.word()}`;
        transferParty = chance.pickone([
          'Reliance Retail',
          'DMart',
          'Zomato',
          'Swiggy',
          'Amazon IN',
          'Flipkart',
          'BESCOM',
          'Airtel',
          'Jio',
          'Local Kirana Store',
          'Petrol Pump',
        ]);
      }

      if (i > 0 && i % (TRANSACTIONS_PER_ACCOUNT / specificKeywords.length) < 1) {
        text = `${specificKeywords[keywordIdx % specificKeywords.length]} ${text}`;
        keywordIdx++;
      }

      if (i % 30 === 0) categoryId = null;
      if (i % 40 === 0) transferParty = null;
      if (i % 100 === 5) {
        amount = 0;
        categoryId = categoriesMap.get('Bank Charges')?.id || chance.pickone(expenseCategoryIds);
        text = 'Bank Charges Waived';
        isIncome = false;
      }

      const rentCatId = categoriesMap.get('Rent/Home Loan EMI')?.id;
      if (rentCatId && !isIncome && categoryId === rentCatId && recurringCounter < 1) {
        recurring = true;
        recurrenceType = 'monthly';
        recurrenceEndDate = addYears(transactionDate, 2);
        recurringCounter++;
        text = 'Monthly Rent/EMI';
        amount = chance.floating({ min: 8000, max: 50000, fixed: 2 });
      }
      const salaryCatId = categoriesMap.get('Salary')?.id;
      if (salaryCatId && isIncome && categoryId === salaryCatId && recurringCounter < 2) {
        recurring = true;
        recurrenceType = 'monthly';
        recurrenceEndDate = addYears(transactionDate, 3);
        recurringCounter++;
        text = 'Monthly Salary Credit';
        amount = chance.floating({ min: 40000, max: 250000, fixed: 2 });
      }

      if (!recurring && recurringCounter < 4 && chance.bool({ likelihood: 3 })) {
        recurring = true;
        recurringCounter++;
        recurrenceType = chance.pickone(['weekly', 'daily']);
        recurrenceEndDate = addMonths(transactionDate, chance.integer({ min: 3, max: 12 }));
        text = `Recurring ${recurrenceType} ${isIncome ? 'Income' : 'Expense'} Item`;
      }

      allTransactions.push({
        account: account.id,
        owner: user.id,
        createdBy: user.id,
        updatedBy: user.id,
        text,
        amount,
        isIncome,
        category: categoryId,
        transfer: transferParty,
        createdAt: transactionDate,
        currency: account.currency,
        recurring,
        recurrenceType,
        recurrenceEndDate,
      });
      transactionTask?.increment();
    }
  }
  transactionTask?.stop();

  console.log(chalk.yellow(`Inserting ${allTransactions.length} transactions in batches (INR)...`));
  const insertTask = progressBar.create(Math.ceil(allTransactions.length / BATCH_SIZE), 0, {
    task: chalk.greenBright('Inserting Transactions'),
  });

  const transactionChunks: InferInsertModel<typeof Transaction>[][] = [];
  for (let i = 0; i < allTransactions.length; i += BATCH_SIZE) {
    transactionChunks.push(allTransactions.slice(i, i + BATCH_SIZE));
  }

  const { errors } = await PromisePool.withConcurrency(MAX_CONCURRENCY)
    .for(transactionChunks)
    .process(async (batch: InferInsertModel<typeof Transaction>[], index, pool) => {
      try {
        await db.insert(Transaction).values(batch);
        insertTask?.increment();
      } catch (error: any) {
        console.error(chalk.red(`\nError inserting transaction batch #${index}: ${error.message}`));
      }
    });

  insertTask?.stop();
  if (errors.length > 0) {
    console.error(chalk.red(`\nEncountered ${errors.length} errors during transaction insertion.`));
  }
  console.log(chalk.green(`\nFinished inserting transactions (INR).`));
}

async function updateAnalyticsAndAccountBalances(user: InferSelectModel<typeof User>) {
  console.log(chalk.yellow('\nRecalculating Analytics and Account Balances (INR)...'));
  const updateTask = progressBar.create(1, 0, { task: chalk.cyan('Updating Balances') });

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  try {
    const userAccounts = await db.query.Account.findMany({
      where: eq(Account.owner, user.id),
      columns: { id: true },
    });

    for (const account of userAccounts) {
      // --- Get Overall Totals ---
      const overallResult = await db
        .execute(
          sql`
              SELECT
                  COALESCE(SUM(CASE WHEN "isIncome" = true THEN amount ELSE 0 END), 0) as total_income,
                  COALESCE(SUM(CASE WHEN "isIncome" = false THEN amount ELSE 0 END), 0) as total_expense
              FROM "transaction"
              WHERE account = ${account.id}
          `,
        )
        .then((res) => res.rows[0] as { total_income: number; total_expense: number });

      const overallBalance = overallResult.total_income - overallResult.total_expense;

      // --- Get Date Range ---
      const dateRangeResult = await db
        .select({
          minDate: sql<Date>`MIN("createdAt")`,
          maxDate: sql<Date>`MAX("createdAt")`,
        })
        .from(Transaction)
        .where(eq(Transaction.account, account.id))
        .then((res) => res[0]);

      let currentIncome = 0;
      let currentExpense = 0;
      let previousIncome = 0;
      let previousExpense = 0;
      let incomePercentageChange = 0;
      let expensesPercentageChange = 0;

      if (dateRangeResult.maxDate) {
        const latestDate = new Date(dateRangeResult.maxDate);
        const currentEndDate = endOfMonth(latestDate);
        const currentStartDate = startOfMonth(latestDate);
        const previousEndDate = endOfMonth(subMonths(currentStartDate, 1));
        const previousStartDate = startOfMonth(subMonths(currentStartDate, 1));

        // --- Get Current Period Totals ---
        const currentPeriodResult = await db
          .execute(
            sql`
                SELECT
                    COALESCE(SUM(CASE WHEN "isIncome" = true THEN amount ELSE 0 END), 0) as current_income,
                    COALESCE(SUM(CASE WHEN "isIncome" = false THEN amount ELSE 0 END), 0) as current_expense
                FROM "transaction"
                WHERE account = ${account.id} AND "createdAt" BETWEEN ${currentStartDate} AND ${currentEndDate}
            `,
          )
          .then((res) => res.rows[0] as { current_income: number; current_expense: number });
        currentIncome = currentPeriodResult.current_income;
        currentExpense = currentPeriodResult.current_expense;

        // --- Get Previous Period Totals ---
        const previousPeriodResult = await db
          .execute(
            sql`
                SELECT
                    COALESCE(SUM(CASE WHEN "isIncome" = true THEN amount ELSE 0 END), 0) as previous_income,
                    COALESCE(SUM(CASE WHEN "isIncome" = false THEN amount ELSE 0 END), 0) as previous_expense
                FROM "transaction"
                WHERE account = ${account.id} AND "createdAt" BETWEEN ${previousStartDate} AND ${previousEndDate}
            `,
          )
          .then((res) => res.rows[0] as { previous_income: number; previous_expense: number });
        previousIncome = previousPeriodResult.previous_income;
        previousExpense = previousPeriodResult.previous_expense;

        // --- Calculate Percentage Changes ---
        incomePercentageChange = calculatePercentageChange(currentIncome, previousIncome);
        expensesPercentageChange = calculatePercentageChange(currentExpense, previousExpense);
      }

      // --- Update Account Balance ---
      await db
        .update(Account)
        .set({ balance: overallBalance, updatedAt: new Date() })
        .where(eq(Account.id, account.id));

      // --- Update Analytics ---
      await db
        .update(Analytics)
        .set({
          income: overallResult.total_income,
          expense: overallResult.total_expense,
          balance: overallBalance,
          incomePercentageChange: incomePercentageChange,
          expensesPercentageChange: expensesPercentageChange,
          updatedAt: new Date(),
          previousIncome: previousIncome,
          previousExpenses: previousExpense,
          previousBalance: previousIncome - previousExpense,
        })
        .where(eq(Analytics.account, account.id));
    }
    updateTask?.increment();
  } catch (error: any) {
    console.error(chalk.red(`\nError updating balances for user ${user.name}: ${error.message}`));
  }
  updateTask?.stop();
  console.log(chalk.green('\nFinished updating analytics and account balances (INR).'));
}

async function reseedDatabase() {
  console.log(chalk.bold.inverse('Starting Sample User Reseeding...'));
  const startTime = Date.now();

  try {
    await clearSampleUserData();

    const user = await seedSampleUser();
    const { categoriesMap } = await seedCategories(user);

    const { accounts: accountsMap } = await seedAccountsAndAnalytics(user, categoriesMap);

    await seedTransactions(user, accountsMap, categoriesMap);

    await updateAnalyticsAndAccountBalances(user);

    progressBar.stop();
    const endTime = Date.now();
    console.log(
      chalk.bold.inverse(
        `\nReseeding Completed Successfully in ${((endTime - startTime) / 1000).toFixed(2)}s`,
      ),
    );
  } catch (error: any) {
    progressBar.stop();
    console.error(chalk.red.bold('\nReseeding Failed!'));
    console.error(error);
    process.exit(1);
  }
}

reseedDatabase();
