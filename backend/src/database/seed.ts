import { InferInsertModel, InferSelectModel, eq, sql } from 'drizzle-orm';
import { db } from '.';
import {
  Account,
  Analytics,
  Budget,
  Category,
  Debts,
  Investment,
  InvestmentAccount,
  SavingGoal,
  Transaction,
  User,
  UserAccount,
  RecurrenceType,
} from './schema';
import bcrypt from 'bcryptjs';
import { Chance } from 'chance';
import chalk from 'chalk';
import { PromisePool } from '@supercharge/promise-pool';
import cliProgress from 'cli-progress';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
  endOfYear,
  format as formatDate,
} from 'date-fns';

const NUM_USERS = 2;
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

async function clearDatabase() {
  console.log(chalk.yellow('Clearing existing data...'));
  const tables = [
    UserAccount,
    Debts,
    Investment,
    InvestmentAccount,
    SavingGoal,
    Budget,
    Analytics,
    Transaction,
    Category,
    Account,
    User,
  ];
  const task = progressBar.create(tables.length, 0, { task: chalk.red('Clearing Tables') });

  for (const table of tables) {
    try {
      await db.delete(table);
      task?.increment();
    } catch (error: any) {
      console.error(
        chalk.red(`\nError clearing table ${table.constructor.name}: ${error.message}`),
      );
    }
  }
  progressBar.stop();
  console.log(chalk.green('Database clearing attempted.'));
}

async function seedUsers(): Promise<InferSelectModel<typeof User>[]> {
  const usersTask = progressBar.create(NUM_USERS, 0, { task: chalk.cyan('Seeding Users') });
  const users: InferInsertModel<typeof User>[] = [];
  const generatedUserIds: string[] = [];

  for (let i = 0; i < NUM_USERS; i++) {
    const name = i === 0 ? 'Sample User' : 'Amit Singh';
    const email = i === 0 ? 'sampleuser@example.com' : 'amit.singh@example.com';
    const password = await bcrypt.hash('Password@123', 10);
    users.push({
      name,
      email,
      password,
      isSocial: false,
      preferredCurrency: 'INR',
    });
    usersTask?.increment();
  }

  const insertedUsers = await db.insert(User).values(users).returning();
  insertedUsers.forEach((u) => generatedUserIds.push(u.id));
  console.log(
    chalk.green(
      `\nSeeded ${insertedUsers.length} users (INR Focus). IDs: ${generatedUserIds.join(', ')}`,
    ),
  );
  return insertedUsers;
}

async function seedCategories(users: InferSelectModel<typeof User>[]): Promise<{
  shared: InferSelectModel<typeof Category>[];
  userSpecific: Map<string, InferSelectModel<typeof Category>[]>;
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
  const userSpecificCategoriesMap = new Map<string, InferSelectModel<typeof Category>[]>();
  const userCategoriesToInsert: InferInsertModel<typeof Category>[] = [];

  users.forEach((user) => {
    const specificNames = [
      `${user.name}'s Pooja Expenses`,
      `${user.name}'s Investment Fees`,
      `Startup ${user.name}`,
      ...sharedCategoryNames,
    ];
    specificNames.forEach((name) => {
      userCategoriesToInsert.push({ name, owner: user.id });
    });
  });

  const insertedUserCategories =
    userCategoriesToInsert.length > 0
      ? await db.insert(Category).values(userCategoriesToInsert).returning()
      : [];

  const allCategories = insertedUserCategories;
  const categoriesMap = new Map(allCategories.map((cat) => [cat.name, cat]));

  insertedUserCategories.forEach((cat) => {
    const userCats = userSpecificCategoriesMap.get(cat.owner!) || [];
    userCats.push(cat);
    userSpecificCategoriesMap.set(cat.owner!, userCats);
  });

  categoriesTask?.increment();
  console.log(chalk.green(`\nSeeded ${insertedUserCategories.length} user-specific categories.`));
  return { shared: [], userSpecific: userSpecificCategoriesMap, categoriesMap };
}

async function seedAccountsAndAnalytics(
  users: InferSelectModel<typeof User>[],
  categoriesMap: Map<string, InferSelectModel<typeof Category>>,
): Promise<{ accounts: Map<string, InferSelectModel<typeof Account>[]> }> {
  const accountsTask = progressBar.create(users.length * ACCOUNTS_PER_USER, 0, {
    task: chalk.magenta('Seeding Accounts & Analytics (INR)'),
  });
  const accountsMap = new Map<string, InferSelectModel<typeof Account>[]>();
  const accountsToInsert: InferInsertModel<typeof Account>[] = [];
  const openingBalanceCategory = categoriesMap.get('Opening Balance');

  if (!openingBalanceCategory) {
    throw new Error('Opening Balance category not found after seeding categories.');
  }

  users.forEach((user, userIndex) => {
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
  });

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
  users: InferSelectModel<typeof User>[],
  accountsMap: Map<string, InferSelectModel<typeof Account>[]>,
  categoriesMap: Map<string, InferSelectModel<typeof Category>>,
) {
  console.log(
    chalk.yellow(
      `\nGenerating ${TRANSACTIONS_PER_ACCOUNT} transactions per account (INR Focus)...`,
    ),
  );
  const transactionTask = progressBar.create(
    users.length * ACCOUNTS_PER_USER * TRANSACTIONS_PER_ACCOUNT,
    0,
    {
      task: chalk.blueBright('Generating Transactions'),
    },
  );

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

  for (const user of users) {
    const userAccounts = accountsMap.get(user.id) || [];

    if (expenseCategoryIds.length === 0 || incomeCategoryIds.length === 0) {
      console.warn(
        chalk.yellow(
          `User ${user.name} has insufficient income/expense categories. Skipping transactions.`,
        ),
      );
      transactionTask?.increment(userAccounts.length * TRANSACTIONS_PER_ACCOUNT);
      continue;
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

async function updateAnalyticsAndAccountBalances(users: InferSelectModel<typeof User>[]) {
  console.log(chalk.yellow('\nRecalculating Analytics and Account Balances (INR)...'));
  const updateTask = progressBar.create(users.length, 0, { task: chalk.cyan('Updating Balances') });

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  for (const user of users) {
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
  }
  updateTask?.stop();
  console.log(chalk.green('\nFinished updating analytics and account balances (INR).'));
}

async function seedBudgets(
  users: InferSelectModel<typeof User>[],
  categoriesMap: Map<string, InferSelectModel<typeof Category>>,
) {
  const budgetTask = progressBar.create(users.length * 5, 0, {
    task: chalk.yellow('Seeding Budgets (INR)'),
  });
  const budgetsToInsert: InferInsertModel<typeof Budget>[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const yearOfLastMonth = currentMonth === 1 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const yearOfNextMonth = currentMonth === 12 ? currentYear + 1 : currentYear;
  const lastYearMonth = currentMonth;
  const lastYear = currentYear - 1;

  const allCategories = Array.from(categoriesMap.values());
  const expenseCategories = allCategories.filter(
    (c) =>
      ![
        'Salary',
        'Freelance Work',
        'Business Income',
        'Interest Income',
        'Dividends',
        'Other Income',
        'Transfer In',
        'Opening Balance',
        'Transfer Out',
      ].includes(c.name),
  );

  users.forEach((user) => {
    const userExpenseCategories = expenseCategories.filter(
      (c) => c.owner === null || c.owner === user.id,
    );
    if (userExpenseCategories.length < 3) return;

    const budgetCats = chance.pickset(userExpenseCategories, 3);

    budgetsToInsert.push({
      userId: user.id,
      category: budgetCats[0].id,
      month: currentMonth,
      year: currentYear,
      amount: chance.floating({ min: 2000, max: 15000, fixed: 0 }),
    });
    budgetTask?.increment();
    budgetsToInsert.push({
      userId: user.id,
      category: budgetCats[1].id,
      month: lastMonth,
      year: yearOfLastMonth,
      amount: chance.floating({ min: 1500, max: 12000, fixed: 0 }),
    });
    budgetTask?.increment();
    budgetsToInsert.push({
      userId: user.id,
      category: budgetCats[2].id,
      month: lastYearMonth,
      year: lastYear,
      amount: chance.floating({ min: 2500, max: 18000, fixed: 0 }),
    });
    budgetTask?.increment();
    budgetsToInsert.push({
      userId: user.id,
      category: budgetCats[0].id,
      month: nextMonth,
      year: yearOfNextMonth,
      amount: chance.floating({ min: 3000, max: 20000, fixed: 0 }),
    });
    budgetTask?.increment();
    budgetsToInsert.push({
      userId: user.id,
      category: budgetCats[1].id,
      month: currentMonth,
      year: currentYear - 1,
      amount: 0,
    });
    budgetTask?.increment();
  });

  if (budgetsToInsert.length > 0) {
    await db.insert(Budget).values(budgetsToInsert);
  }
  console.log(
    chalk.green(`\nSeeded ${budgetsToInsert.length} budgets across different months/years (INR).`),
  );
}

async function seedSavingGoals(users: InferSelectModel<typeof User>[]) {
  const goalTask = progressBar.create(users.length * 4, 0, {
    task: chalk.magentaBright('Seeding Saving Goals (INR)'),
  });
  const goalsToInsert: InferInsertModel<typeof SavingGoal>[] = [];

  users.forEach((user) => {
    const goalData = [
      {
        name: `${user.name}'s Emergency Fund`,
        months: 12,
        targetMin: 50000,
        targetMax: 300000,
        progress: 0.95,
      },
      {
        name: `${user.name}'s Car Downpayment`,
        months: 36,
        targetMin: 100000,
        targetMax: 500000,
        progress: 0.2,
      },
      {
        name: `Completed Europe Trip Fund (${user.name})`,
        months: -6,
        targetMin: 80000,
        targetMax: 150000,
        progress: 1.0,
      },
      {
        name: `New Phone Fund (${user.name})`,
        months: 9,
        targetMin: 40000,
        targetMax: 100000,
        progress: 0.0,
      },
    ];

    goalData.forEach((data) => {
      const targetAmount = chance.floating({ min: data.targetMin, max: data.targetMax, fixed: 0 });
      goalsToInsert.push({
        userId: user.id,
        name: data.name,
        targetAmount,
        savedAmount: targetAmount * data.progress,
        targetDate: addMonths(new Date(), data.months),
      });
      goalTask?.increment();
    });
  });

  if (goalsToInsert.length > 0) {
    await db.insert(SavingGoal).values(goalsToInsert);
  }
  console.log(
    chalk.green(`\nSeeded ${goalsToInsert.length} saving goals with varied progress/dates (INR).`),
  );
}

async function seedInvestmentData(users: InferSelectModel<typeof User>[]) {
  const invTask = progressBar.create(users.length * (3 + 5 * 2), 0, {
    task: chalk.blue('Seeding Investments (INR)'),
  });
  const investmentAccountsToInsert: InferInsertModel<typeof InvestmentAccount>[] = [];
  const investmentsToInsert: InferInsertModel<typeof Investment>[] = [];

  const stockSymbols = [
    'RELIANCE.NS',
    'TCS.NS',
    'HDFCBANK.NS',
    'INFY.NS',
    'ICICIBANK.NS',
    'SBIN.NS',
    'ITC.NS',
    'BHARTIARTL.NS',
    'KOTAKBANK.NS',
    'LT.NS',
  ];

  users.forEach((user) => {
    investmentAccountsToInsert.push({
      userId: user.id,
      name: `${user.name}'s Zerodha Account`,
      platform: 'Zerodha Kite',
      currency: 'INR',
    });
    invTask?.increment();
    investmentAccountsToInsert.push({
      userId: user.id,
      name: `${user.name}'s Groww Mutual Funds`,
      platform: 'Groww',
      currency: 'INR',
    });
    invTask?.increment();
    investmentAccountsToInsert.push({
      userId: user.id,
      name: `${user.name}'s Upstox Empty Acct`,
      platform: 'Upstox',
      currency: 'INR',
    });
    invTask?.increment();
  });

  const insertedInvAccounts = await db
    .insert(InvestmentAccount)
    .values(investmentAccountsToInsert)
    .returning();

  const twoYearsAgoInv = subYears(new Date(), 2);
  const oneMonthAgo = subMonths(new Date(), 1);

  let holdingsAdded = 0;
  insertedInvAccounts.forEach((acc, index) => {
    const userIndex = users.findIndex((u) => u.id === acc.userId);
    const accountIndexWithinUser = insertedInvAccounts
      .filter((ia) => ia.userId === acc.userId)
      .findIndex((ia) => ia.id === acc.id);
    if (accountIndexWithinUser >= 2) {
      invTask?.increment(5);
      return;
    }

    const numHoldings = 5;
    const userSymbols = chance.pickset(stockSymbols, numHoldings);
    for (let i = 0; i < numHoldings; i++) {
      const purchasePrice = chance.floating({ min: 100, max: 5000, fixed: 2 });
      const shares = chance.integer({ min: 5, max: 500 });
      investmentsToInsert.push({
        account: acc.id,
        symbol: userSymbols[i],
        shares: shares,
        purchasePrice: purchasePrice,
        purchaseDate: randomDate(twoYearsAgoInv, oneMonthAgo),
        dividend: chance.floating({ min: 0, max: shares * 50, fixed: 2 }),
        investedAmount: shares * purchasePrice,
      });
      invTask?.increment();
      holdingsAdded++;
    }
  });

  if (investmentsToInsert.length > 0) {
    await db.insert(Investment).values(investmentsToInsert);
  }
  console.log(
    chalk.green(
      `\nSeeded ${insertedInvAccounts.length} investment accounts and ${holdingsAdded} holdings (INR Stocks).`,
    ),
  );
}

async function seedDebts(
  users: InferSelectModel<typeof User>[],
  accountsMap: Map<string, InferSelectModel<typeof Account>[]>,
) {
  const debtTask = progressBar.create(users.length * 4, 0, {
    task: chalk.redBright('Seeding Debts (INR)'),
  });
  const debtsToInsert: InferInsertModel<typeof Debts>[] = [];

  if (users.length < 2) {
    console.warn(
      chalk.yellow('\nNeed at least 2 users to seed debts between them. Skipping debts.'),
    );
    debtTask?.increment(users.length * 4);
    return;
  }

  for (let i = 0; i < users.length; i++) {
    const currentUser = users[i];
    const otherUser = users[(i + 1) % users.length];
    const currentUserAccount = (accountsMap.get(currentUser.id) || [])[0];
    const otherUserAccount = (accountsMap.get(otherUser.id) || [])[0];

    if (!currentUserAccount || !otherUserAccount) {
      console.warn(
        chalk.yellow(`\nSkipping debts for ${currentUser.name} due to missing accounts.`),
      );
      debtTask?.increment(4);
      continue;
    }

    debtsToInsert.push({
      amount: chance.floating({ min: 5000, max: 50000, fixed: 0 }),
      premiumAmount: 0,
      createdBy: currentUser.id,
      description: `Personal loan from ${otherUser.name} (Paid)`,
      dueDate: formatDate(subMonths(new Date(), chance.integer({ min: 1, max: 6 })), 'yyyy-MM-dd'),
      duration: 'month',
      percentage: chance.floating({ min: 8, max: 18, fixed: 1 }),
      frequency: String(chance.integer({ min: 3, max: 12 })),
      isPaid: true,
      userId: otherUser.id,
      type: 'taken',
      interestType: 'simple',
      account: currentUserAccount.id,
      createdAt: subMonths(new Date(), chance.integer({ min: 7, max: 18 })),
    });
    debtTask?.increment();

    debtsToInsert.push({
      amount: chance.floating({ min: 20000, max: 200000, fixed: 0 }),
      premiumAmount: chance.floating({ min: 0, max: 5000, fixed: 0 }),
      createdBy: currentUser.id,
      description: `Business loan to ${otherUser.name} (Compound)`,
      dueDate: formatDate(addYears(new Date(), chance.integer({ min: 1, max: 3 })), 'yyyy-MM-dd'),
      duration: 'year',
      percentage: chance.floating({ min: 10, max: 20, fixed: 1 }),
      frequency: String(chance.integer({ min: 1, max: 3 })),
      isPaid: false,
      userId: otherUser.id,
      type: 'given',
      interestType: 'compound',
      account: currentUserAccount.id,
      createdAt: subMonths(new Date(), chance.integer({ min: 1, max: 6 })),
    });
    debtTask?.increment();

    debtsToInsert.push({
      amount: chance.floating({ min: 1000, max: 15000, fixed: 0 }),
      premiumAmount: 0,
      createdBy: currentUser.id,
      description: `Quick cash borrow from ${otherUser.name}`,
      dueDate: formatDate(addWeeks(new Date(), chance.integer({ min: 1, max: 4 })), 'yyyy-MM-dd'),
      duration: 'week',
      percentage: chance.floating({ min: 0, max: 12, fixed: 1 }),
      frequency: String(chance.integer({ min: 1, max: 4 })),
      isPaid: false,
      userId: otherUser.id,
      type: 'taken',
      interestType: 'simple',
      account: currentUserAccount.id,
      createdAt: subDays(new Date(), chance.integer({ min: 10, max: 40 })),
    });
    debtTask?.increment();

    debtsToInsert.push({
      amount: chance.floating({ min: 10000, max: 80000, fixed: 0 }),
      premiumAmount: 0,
      createdBy: currentUser.id,
      description: `Old unpaid loan to ${otherUser.name}`,
      dueDate: formatDate(subMonths(new Date(), chance.integer({ min: 2, max: 8 })), 'yyyy-MM-dd'),
      duration: 'month',
      percentage: chance.floating({ min: 9, max: 16, fixed: 1 }),
      frequency: String(3),
      isPaid: false,
      userId: otherUser.id,
      type: 'given',
      interestType: 'simple',
      account: currentUserAccount.id,
      createdAt: subMonths(new Date(), chance.integer({ min: 9, max: 18 })),
    });
    debtTask?.increment();
  }

  if (debtsToInsert.length > 0) {
    await db.insert(Debts).values(debtsToInsert);
  }
  console.log(chalk.green(`\nSeeded ${debtsToInsert.length} debt records (INR).`));
}

async function seedAccountSharing(
  users: InferSelectModel<typeof User>[],
  accountsMap: Map<string, InferSelectModel<typeof Account>[]>,
) {
  const sharingTask = progressBar.create(2, 0, {
    task: chalk.cyanBright('Seeding Account Sharing'),
  });
  if (users.length < 2) {
    console.warn(chalk.yellow('\nNeed at least 2 users for account sharing. Skipping.'));
    sharingTask?.increment(2);
    return;
  }

  const user1 = users[0];
  const user2 = users[1];
  const riyaSavings = (accountsMap.get(user1.id) || []).find((acc) => acc.name.includes('Savings'));
  const amitChecking = (accountsMap.get(user2.id) || []).find((acc) => acc.name.includes('Salary'));

  const sharesToInsert: InferInsertModel<typeof UserAccount>[] = [];

  if (riyaSavings) {
    sharesToInsert.push({ userId: user2.id, accountId: riyaSavings.id });
    sharingTask?.increment();
    console.log(
      chalk.green(`\nSharing account '${riyaSavings.name}' from ${user1.name} with ${user2.name}.`),
    );
  } else {
    console.warn(chalk.yellow(`\n${user1.name} missing Savings account for sharing.`));
    sharingTask?.increment();
  }

  if (amitChecking) {
    sharesToInsert.push({ userId: user1.id, accountId: amitChecking.id });
    sharingTask?.increment();
    console.log(
      chalk.green(`Sharing account '${amitChecking.name}' from ${user2.name} with ${user1.name}.`),
    );
  } else {
    console.warn(chalk.yellow(`\n${user2.name} missing Salary account for sharing.`));
    sharingTask?.increment();
  }

  if (sharesToInsert.length > 0) {
    await db.insert(UserAccount).values(sharesToInsert);
  }
  console.log(chalk.green(`Seeded ${sharesToInsert.length} account sharing records.`));
}

async function seedDatabase() {
  console.log(chalk.bold.inverse('Starting Database Seeding (v2.3 - India Focus)...'));
  const startTime = Date.now();

  try {
    await clearDatabase();

    const users = await seedUsers();
    const {
      shared: sharedCategories,
      userSpecific: userSpecificCategories,
      categoriesMap,
    } = await seedCategories(users);

    const { accounts: accountsMap } = await seedAccountsAndAnalytics(users, categoriesMap);

    await seedTransactions(users, accountsMap, categoriesMap);

    await updateAnalyticsAndAccountBalances(users);

    await seedBudgets(users, categoriesMap);
    await seedSavingGoals(users);
    await seedInvestmentData(users);
    await seedDebts(users, accountsMap);
    await seedAccountSharing(users, accountsMap);

    progressBar.stop();
    const endTime = Date.now();
    console.log(
      chalk.bold.inverse(
        `\nSeeding Completed Successfully (India Focus) in ${((endTime - startTime) / 1000).toFixed(
          2,
        )}s`,
      ),
    );
  } catch (error: any) {
    progressBar.stop();
    console.error(chalk.red.bold('\nSeeding Failed!'));
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();
