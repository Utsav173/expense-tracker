import { tool } from 'ai';
import { z } from 'zod';
import { accountService } from '../../services/account.service';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';
import { Account } from '../../database/schema';
import { db } from '../../database';
import { formatCurrency } from '../../utils/currency.utils';
import { createToolResponse, resolveAccountId } from './shared';

export function createAccountTools(userId: string) {
  return {
    createAccount: tool({
      description: 'Creates a new financial account (e.g., bank account, wallet) for the user.',
      parameters: z.object({
        accountName: z
          .string()
          .min(1)
          .describe("The desired name for the new account (e.g., 'ICICI Salary', 'Paytm Wallet')."),
        initialBalance: z
          .number()
          .optional()
          .describe('The starting balance (defaults to 0). Must be non-negative.'),
        currency: z
          .string()
          .length(3)
          .optional()
          .describe(
            "The 3-letter currency code (e.g., INR, USD). Defaults to user's preferred currency or INR.",
          ),
      }),
      execute: async ({ accountName, initialBalance = 0, currency }) => {
        if (initialBalance < 0) {
          return createToolResponse({
            success: false,
            error: 'Initial balance cannot be negative.',
          });
        }
        try {
          const result = await accountService.createAccount(
            userId,
            accountName,
            initialBalance,
            currency?.toUpperCase() || 'INR',
          );
          return createToolResponse({
            success: true,
            message: result.message,
            data: result.data,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    listAccounts: tool({
      description: "Lists the user's financial accounts, optionally filtering by name.",
      parameters: z.object({
        searchName: z
          .string()
          .optional()
          .describe('Optional: Filter accounts whose name contains this text.'),
      }),
      execute: async ({ searchName }) => {
        try {
          const result = await accountService.getAccountList(
            userId,
            1,
            100,
            'name',
            'asc',
            searchName || '',
          );
          const message =
            result.accounts.length > 0
              ? `Found ${result.accounts.length} account(s).`
              : 'No accounts found.';
          return createToolResponse({ success: true, message: message, data: result.accounts });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    getAccountBalance: tool({
      description: 'Retrieves the current balance for a specific account by its name or ID.',
      parameters: z.object({
        accountIdentifier: z
          .string()
          .min(1)
          .describe('The name or ID of the account to check the balance for.'),
      }),
      execute: async ({ accountIdentifier }) => {
        try {
          const resolved = await resolveAccountId(userId, accountIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which account do you mean?',
              options: resolved.options,
            });

          const account = await accountService.getAccountById(resolved.id, userId);
          const formattedBalance = formatCurrency(account.balance ?? 0, account.currency);
          return createToolResponse({
            success: true,
            message: `Balance for ${account.name} is ${formattedBalance}.`,
            data: account,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    identifyAccountForAction: tool({
      description:
        'Identifies a specific account by name or ID for a potential update or deletion action. Requires user confirmation before proceeding.',
      parameters: z.object({
        accountIdentifier: z.string().min(1).describe('The name or ID of the account.'),
      }),
      execute: async ({ accountIdentifier }) => {
        try {
          const resolved = await resolveAccountId(userId, accountIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which account do you want to update or delete?',
              options: resolved.options,
            });

          const account = await db.query.Account.findFirst({
            where: eq(Account.id, resolved.id),
            columns: { name: true, balance: true, currency: true },
          });
          const details = `Account: ${
            account?.name ?? accountIdentifier
          }, Balance: ${formatCurrency(account?.balance ?? 0, account?.currency)}`;

          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: resolved.id,
            details: details,
            message: `Found ${details}. Please confirm the action (update name or delete) and provide the ID (${resolved.id}). Deleting will remove all transactions.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteAccount: tool({
      description:
        'Deletes a specific financial account and all its data AFTER user confirmation, using its exact unique ID.',
      parameters: z.object({
        accountId: z
          .string()
          .describe(
            'The exact unique ID of the account to delete (obtained from the identification step).',
          ),
      }),
      execute: async ({ accountId }) => {
        try {
          const result = await accountService.deleteAccount(accountId, userId);
          return createToolResponse({ success: true, message: result.message });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateAccountName: tool({
      description:
        'Updates the name of an existing financial account AFTER user confirmation, using its specific ID.',
      parameters: z.object({
        accountId: z
          .string()
          .describe(
            'The unique ID of the account to rename (obtained from the identification step).',
          ),
        newAccountName: z.string().min(1).describe('The desired new name for the account.'),
      }),
      execute: async ({ accountId, newAccountName }) => {
        try {
          await accountService.updateAccount(
            accountId,
            userId,
            newAccountName,
            undefined,
            undefined,
          );
          return createToolResponse({
            success: true,
            message: `Account (ID: ${accountId}) renamed to "${newAccountName}".`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),
  };
}
