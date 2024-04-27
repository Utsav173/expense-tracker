DO $$ BEGIN
 CREATE TYPE "DebtType" AS ENUM('given', 'taken');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "InterestType" AS ENUM('simple', 'compound');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "role" AS ENUM('user', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"owner" varchar(64) NOT NULL,
	"balance" real DEFAULT 0,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	"isDefault" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account" varchar(64),
	"user" varchar(64),
	"income" real DEFAULT 0,
	"expense" real DEFAULT 0,
	"balance" real DEFAULT 0,
	"previousIncome" real DEFAULT 0,
	"previousExpenses" real DEFAULT 0,
	"previousBalance" real DEFAULT 0,
	"incomePercentageChange" real DEFAULT 0,
	"expensesPercentageChange" real DEFAULT 0,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"owner" varchar(64),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "debts" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" real NOT NULL,
	"premiumAmount" real NOT NULL,
	"createdBy" varchar(64),
	"description" varchar(255),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	"dueDate" date,
	"duration" varchar(64),
	"percentage" real NOT NULL,
	"frequency" varchar(64),
	"isPaid" boolean DEFAULT false,
	"userId" varchar(64),
	"type" "DebtType" NOT NULL,
	"interestType" "InterestType" NOT NULL,
	"account" varchar(64)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "import_data" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account" varchar(64),
	"user" varchar(64),
	"data" text NOT NULL,
	"totalRecords" integer NOT NULL,
	"errorRecords" integer NOT NULL,
	"isImported" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" varchar(255) NOT NULL,
	"amount" real NOT NULL,
	"isIncome" boolean NOT NULL,
	"transfer" varchar(64),
	"category" varchar(64),
	"account" varchar(64),
	"createdBy" varchar(64),
	"updatedBy" varchar(64),
	"owner" varchar(64),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"email" varchar(64) NOT NULL,
	"password" varchar(255) NOT NULL,
	"token" text,
	"isSocial" boolean DEFAULT false,
	"profilePic" text DEFAULT 'https://i.stack.imgur.com/l60Hf.png',
	"role" "role" DEFAULT 'user',
	"isActive" boolean DEFAULT true,
	"lastLoginAt" timestamp,
	"resetPasswordToken" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_account" (
	"userId" varchar(64),
	"accountId" varchar(64),
	CONSTRAINT "user_account_userId_accountId_pk" PRIMARY KEY("userId","accountId")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountNameIndex" ON "account" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountOwnerIndex" ON "account" ("owner");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "catNameIndex" ON "category" ("name","owner");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_status_index" ON "debts" ("isPaid","dueDate");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "createdByAccountIndex" ON "debts" ("createdBy","account");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "textIndex" ON "transaction" ("text");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "amountIndex" ON "transaction" ("amount");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "amountAccountIndex" ON "transaction" ("amount","account");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "amountCategoryIndex" ON "transaction" ("amount","category");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "userNameIndex" ON "user" ("name");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_owner_user_id_fk" FOREIGN KEY ("owner") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics" ADD CONSTRAINT "analytics_account_account_id_fk" FOREIGN KEY ("account") REFERENCES "account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics" ADD CONSTRAINT "analytics_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category" ADD CONSTRAINT "category_owner_user_id_fk" FOREIGN KEY ("owner") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "debts" ADD CONSTRAINT "debts_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "debts" ADD CONSTRAINT "debts_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "debts" ADD CONSTRAINT "debts_account_account_id_fk" FOREIGN KEY ("account") REFERENCES "account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "import_data" ADD CONSTRAINT "import_data_account_account_id_fk" FOREIGN KEY ("account") REFERENCES "account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "import_data" ADD CONSTRAINT "import_data_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction" ADD CONSTRAINT "transaction_category_category_id_fk" FOREIGN KEY ("category") REFERENCES "category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_account_id_fk" FOREIGN KEY ("account") REFERENCES "account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction" ADD CONSTRAINT "transaction_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction" ADD CONSTRAINT "transaction_updatedBy_user_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction" ADD CONSTRAINT "transaction_owner_user_id_fk" FOREIGN KEY ("owner") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_account" ADD CONSTRAINT "user_account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_account" ADD CONSTRAINT "user_account_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
