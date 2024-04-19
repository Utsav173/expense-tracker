import { InferInsertModel, InferSelectModel, eq } from 'drizzle-orm';
import { db } from '.';
import { Account, Analytics, Category, Transaction, User } from './schema';
import bcrypt from 'bcrypt';
import { Chance } from 'chance';
import { increment } from '../utils';
import chalk from 'chalk';
import { PromisePool } from '@supercharge/promise-pool';
import cliProgress from 'cli-progress';

const MAX_CONCURRENCY = 2;
const CHUNK_SIZE = 380;

const chance = new Chance(Math.random());

const createUser = async (): Promise<InferSelectModel<typeof User>> => {
  const hashedPassword = await bcrypt.hash('Test@123', 10);
  const user = await db
    .insert(User)
    .values({ name: 'test', email: 'test@gmail.com', password: hashedPassword })
    .returning()
    .catch((err) => {
      throw new Error(err.message);
    });

  console.log(chalk.green.bold('User seeding done'));
  return user[0];
};

const createAccount = async (
  user: InferSelectModel<typeof User>,
  number: number
): Promise<InferSelectModel<typeof Account>[]> => {
  let accountData: InferInsertModel<typeof Account>[] = [];

  for (let i = 0; i < number; i++) {
    accountData.push({
      name: `${user.name} Account ${i + 1}`,
      balance: 0,
      owner: user?.id!,
    });
  }

  const account = await db.insert(Account).values(accountData).returning();

  await db.insert(Analytics).values(
    account.map((acc) => ({
      account: acc.id,
      balance: 0,
      user: user?.id!,
    }))
  );

  console.log(chalk.yellow.bold('Account-Analytics seeding done'));

  return account;
};

const createCategory = async () => {
  const category = await db
    .insert(Category)
    .values(
      [
        'Groceries',
        'Utilities',
        'Rent/Mortgage',
        'Transportation',
        'Healthcare/Medical',
        'Entertainment',
        'Eating Out',
        'Clothing',
        'Education',
        'Gifts/Donations',
        'Travel',
        'Insurance',
        'Home Improvement',
        'Savings',
        'Other',
      ].map((category) => ({ name: category }))
    )
    .returning();

  console.log(chalk.blue.bold('Category seeding done'));

  return category;
};

const createTransaction = async (
  user: InferInsertModel<typeof User>,
  account: InferInsertModel<typeof Account>[],
  number: number
) => {
  let startTime = Date.now();
  // const file = Bun.file('./data.json');
  const file = undefined;

  if (!file) {
    let transactionData: InferInsertModel<typeof Transaction>[] = [];
    const category = await db.query.Category.findMany({
      columns: {
        id: true,
        name: true,
      },
    });

    const chunkBar = new cliProgress.SingleBar(
      {
        // green bar, reset styles after bar element
        format:
          ' >> [\u001b[32m{bar}\u001b[0m] {percentage}% | ETA: {eta}s | {value}/{total}',

        // change color to yellow between bar complete/incomplete -> incomplete becomes yellow
        barGlue: '\u001b[33m',
      },
      cliProgress.Presets.shades_classic
    );

    for (let j = 0; j < account.length; j++) {
      let totalIncome = 0;
      let totalExpenses = 0;

      const accountAnalytics = await db.query.Analytics.findFirst({
        where: eq(Analytics.account, account[j].id as any),
      });

      const updatedAnalyticsData: InferInsertModel<typeof Analytics> = {
        ...accountAnalytics,
        balance: 0,
      };

      for (let i = 0; i < number; i++) {
        const text = `transaction ${chance.cc_type()} ${i} ${j} ${chance.word()}`;
        const randomIndex = Math.floor(Math.random() * category.length);
        const randomCategory = category[randomIndex];

        let randomAmount: number;
        let type: string;

        const rand = chance.floating({ min: 0, max: 1 });

        if (rand > 0.6) {
          // Generate expense
          randomAmount = chance.integer({ min: 1, max: 5000 });
          type = 'expense';
          totalExpenses += randomAmount;
        } else {
          // Generate income
          randomAmount = chance.integer({ min: 1, max: 10000 });
          type = 'income';
          totalIncome += randomAmount;
        }

        // Adjust expense amount to ensure overall balance is not negative
        if (totalExpenses > totalIncome) {
          if (type === 'expense') {
            const remainingIncome = totalIncome - totalExpenses;
            if (remainingIncome <= 0) {
              // If there's no remaining income, set expense to 0
              randomAmount = 1;
            } else {
              // Otherwise, adjust the expense to consume all remaining income
              randomAmount = Math.min(randomAmount, remainingIncome);
            }
          }
        }
        // Generate random date between today and 5 years ago
        const randomDate = new Date(
          Date.now() -
            Math.floor(Math.random() * 20 * 365 * 24 * 60 * 60 * 1000)
        );

        transactionData.push({
          text,
          amount: randomAmount,
          isIncome: type === 'income',
          transfer: chance.name(),
          category: randomCategory.id,
          account: account[j].id,
          createdBy: user?.id!,
          updatedBy: user?.id!,
          owner: user?.id!,
          createdAt: randomDate,
        });

        // perform analytics calculations
        if (type === 'income') {
          updatedAnalyticsData.balance! += randomAmount;
          updatedAnalyticsData.income! += randomAmount;
          updatedAnalyticsData.previousIncome! = randomAmount;
          updatedAnalyticsData.previousBalance! += randomAmount;
          updatedAnalyticsData.incomePercentageChange =
            (updatedAnalyticsData.income! / updatedAnalyticsData.balance!) *
            100;
        } else {
          updatedAnalyticsData.balance! -= randomAmount;
          updatedAnalyticsData.expense! += randomAmount;
          updatedAnalyticsData.previousExpenses! = randomAmount;
          updatedAnalyticsData.previousBalance! -= randomAmount;
          updatedAnalyticsData.expensesPercentageChange =
            (updatedAnalyticsData.expense! / updatedAnalyticsData.balance!) *
            100;
        }
      }

      // update analytics and account balance
      await db
        .update(Analytics)
        .set(updatedAnalyticsData)
        .where(eq(Analytics.account, account[j].id as any));

      await db
        .update(Account)
        .set({
          balance: increment(Account.balance, totalIncome - totalExpenses),
        })
        .where(eq(Account.id, account[j].id as any));
    }
    console.log(
      chalk.ansi256(42).bold(`data generation done ${Date.now() - startTime}ms`)
    );
    console.log('  ');

    // distrubite transactionData array if has more than 1000 elements
    const distributeTransactions = async (
      transactionData: InferInsertModel<typeof Transaction>[]
    ) => {
      const chunkSize = Math.ceil(transactionData.length / CHUNK_SIZE);
      const chunks = [];

      for (let i = 0; i < transactionData.length; i += chunkSize) {
        chunks.push(transactionData.slice(i, i + chunkSize));
      }

      return chunks;
    };
    await Bun.write('./data.json', JSON.stringify(transactionData));

    chunkBar.start(CHUNK_SIZE, 0);
    const chunks = await distributeTransactions(transactionData);

    const { errors } = await PromisePool.withConcurrency(MAX_CONCURRENCY)
      .for(chunks)
      .process(async (transData, index, pool) => {
        await db
          .insert(Transaction)
          .values(transData)
          .catch((err) => {
            throw new Error(err.message);
          });

        chunkBar.update(index + 1);
      });

    chunkBar.stop();
    console.log('  ');

    console.log(
      chalk.magenta.bold(
        'Transaction seeding done',
        errors ? chalk.red(errors) : '',
        `${(Date.now() - startTime) / 1000}s`
      )
    );
  } else {
    const fileData = await file.json();
    const chunkBar = new cliProgress.SingleBar(
      {
        // green bar, reset styles after bar element
        format:
          ' >> [\u001b[32m{bar}\u001b[0m] {percentage}% | ETA: {eta}s | {value}/{total}',

        // change color to yellow between bar complete/incomplete -> incomplete becomes yellow
        barGlue: '\u001b[33m',
      },
      cliProgress.Presets.shades_classic
    );

    // distrubite transactionData array if has more than 1000 elements
    const distributeTransactions = async (
      transactionData: InferInsertModel<typeof Transaction>[]
    ) => {
      const chunkSize = Math.ceil(transactionData.length / CHUNK_SIZE);
      const chunks = [];

      for (let i = 0; i < transactionData.length; i += chunkSize) {
        chunks.push(transactionData.slice(i, i + chunkSize));
      }

      return chunks;
    };
    chunkBar.start(CHUNK_SIZE, 0);
    const chunks = await distributeTransactions(fileData);

    const { errors } = await PromisePool.withConcurrency(MAX_CONCURRENCY)
      .for(chunks)
      .process(async (transData, index, pool) => {
        await db
          .insert(Transaction)
          .values(transData)
          .catch((err) => {
            throw new Error(err.message);
          });

        chunkBar.update(index + 1);
      });

    chunkBar.stop();
    console.log('  ');

    console.log(
      chalk.magenta.bold(
        'Transaction seeding done',
        errors ? chalk.red(errors) : '',
        `${(Date.now() - startTime) / 1000}s`
      )
    );
  }
};

const seeding = () => {
  const dbData = [Transaction, Analytics, Category, Account, User];
  dbData.forEach((data) => {
    db.delete(data).execute();
  });

  createUser().then((data) =>
    createAccount(data, 200).then((acc) =>
      createCategory().then(() => createTransaction(data, acc, 10000))
    )
  );
};

seeding();
