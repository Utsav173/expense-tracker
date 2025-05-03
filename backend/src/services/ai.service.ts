import { db } from '../database';
import { AiConversationHistory, User } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateText, CoreMessage, TextPart, ToolCallPart, CoreAssistantMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { HTTPException } from 'hono/http-exception';
import {
  createAccountTools,
  createCategoryTools,
  createTransactionTools,
  createBudgetTools,
  createGoalTools,
  createInvestmentAccountTools,
  createInvestmentTools,
  createDebtTools,
} from '../lib/ai/tools';
import { generateId } from 'ai';
import { InferInsertModel } from 'drizzle-orm';
import { decryptApiKey } from '../utils/crypto.utils';

const MAX_HISTORY_MESSAGES = 10;

export class AiService {
  private async getHistory(userId: string, sessionId: string): Promise<CoreMessage[]> {
    try {
      const history = await db.query.AiConversationHistory.findMany({
        where: and(
          eq(AiConversationHistory.userId, userId),
          eq(AiConversationHistory.sessionId, sessionId),
        ),
        orderBy: [desc(AiConversationHistory.createdAt)],
        limit: MAX_HISTORY_MESSAGES * 2,
        columns: { message: true },
      });

      return history
        .map((h) => {
          try {
            return typeof h.message === 'string' ? JSON.parse(h.message) : h.message;
          } catch (e) {
            console.error('Failed to parse message from history:', h.message, e);
            return { role: 'system', content: '[Error parsing message]' } as CoreMessage;
          }
        })
        .filter((msg): msg is CoreMessage => msg.role !== 'system');
    } catch (error: any) {
      console.error(`Error fetching AI history for session ${sessionId}:`, error);
      return [];
    }
  }

  private async saveHistory(
    userId: string,
    sessionId: string,
    userMessage: CoreMessage,
    assistantMessage: CoreAssistantMessage,
  ): Promise<void> {
    try {
      const messagesToSave: Array<InferInsertModel<typeof AiConversationHistory>> = [
        {
          userId,
          sessionId,
          message: userMessage,
          createdAt: new Date(),
        },
        {
          userId,
          sessionId,
          message: assistantMessage,
          createdAt: new Date(Date.now() + 1),
        },
      ];
      await db.insert(AiConversationHistory).values(messagesToSave);
    } catch (error: any) {
      console.error(`Error saving AI history for session ${sessionId}:`, error);
    }
  }

  async processPrompt(userId: string, prompt: string, sessionId?: string) {
    let userApiKey: string | undefined;
    try {
      const userData = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: { aiApiKeyEncrypted: true },
      });

      if (!userData?.aiApiKeyEncrypted) {
        throw new HTTPException(403, {
          message: 'AI API key not configured for this user. Please add it in your profile.',
        });
      }

      userApiKey = await decryptApiKey(userData.aiApiKeyEncrypted);
    } catch (dbError: any) {
      console.error(`Error fetching/decrypting user API key for user ${userId}:`, dbError);
      if (dbError instanceof HTTPException) throw dbError;
      throw new HTTPException(500, { message: 'Failed to retrieve AI configuration.' });
    }

    if (!userApiKey) {
      throw new HTTPException(500, { message: 'Could not load AI API key.' });
    }

    const google = createGoogleGenerativeAI({ apiKey: userApiKey });
    const aiModel = google('gemini-1.5-flash-latest');

    const currentSessionId = sessionId || generateId();
    const history = await this.getHistory(userId, currentSessionId);
    const userMessage: CoreMessage = { role: 'user', content: prompt };
    const messages: CoreMessage[] = [...history, userMessage];

    const accountTools = createAccountTools(userId);
    const categoryTools = createCategoryTools(userId);
    const transactionTools = createTransactionTools(userId);
    const budgetTools = createBudgetTools(userId);
    const goalTools = createGoalTools(userId);
    const investmentAccountTools = createInvestmentAccountTools(userId);
    const investmentTools = createInvestmentTools(userId);
    const debtTools = createDebtTools(userId);

    const allTools = {
      ...accountTools,
      ...categoryTools,
      ...transactionTools,
      ...budgetTools,
      ...goalTools,
      ...investmentAccountTools,
      ...investmentTools,
      ...debtTools,
    };

    let result;
    try {
      result = await generateText({
        model: aiModel,
        messages: messages,
        tools: allTools,
        maxSteps: 5,
        system: `You are a helpful financial assistant integrated into an expense tracker app. Use the available tools to perform actions requested by the user (create, list, update, delete accounts, categories, transactions, budgets, saving goals, investment accounts, investments, debts).
        **Tool Usage Guidelines:**
        - **Transactions:** 'amount' MUST always be positive. Use 'type' ('income' or 'expense') for direction.
        - **Budgets/Goals:** Amounts should always be positive.
        - **Identification & Confirmation (Updates/Deletes/Mark as Paid):**
            1. Use an identification tool first (e.g., 'identifyAccountForAction', 'identifyBudgetForAction', 'identifyTransactionForAction', 'findSavingGoal', 'markDebtAsPaid').
            2. These tools return JSON like '{ success: true, confirmationNeeded: true, id: '...', details: '...', message: '...' }' OR '{ success: true, clarificationNeeded: true, ... }' OR '{ success: false, error: '...' }'.
            3. If clarification is needed, present the options and stop.
            4. If confirmation is needed, PRESENT the 'message' clearly to the user.
            5. If the user confirms AND includes the correct ID (e.g., "Yes, confirm delete account [ID]"), THEN use the corresponding 'executeConfirmed...' tool (e.g., 'executeConfirmedDeleteAccount', 'executeConfirmedUpdateTransaction', 'executeConfirmedMarkDebtPaid') providing ONLY the required ID (and update data if applicable).
            6. Do NOT use 'executeConfirmed...' tools without explicit user confirmation containing the specific ID. If they just say "yes", ask for the ID. Acknowledge cancellations (if user says "no" or "cancel").
        - **Ambiguity:** If a resolver tool returns clarificationNeeded, present the options clearly and ask the user to specify by ID or name. Do not proceed with action.
        - **Not Found:** If an item (account, category, etc.) isn't found by a resolver, inform the user clearly using the error message provided by the tool.
        - **Dates:** Use the date resolver tools. Infer relative dates ('today', 'yesterday', 'last month'). Default to 'today' for transactions if unspecified. Budgets require month/year. Goal target dates are optional.
        - **New Tools:** You can now check budget progress ('getBudgetProgress') and find extreme transactions ('getExtremeTransaction').
        **Confirmation Messages:** After successfully executing *any* tool (create, list, confirmed update/delete/mark paid), provide a brief, clear confirmation message from the tool's response (e.g., 'OK, account created.', 'Transaction deleted.', 'Budget progress retrieved.').
        **Errors:** If a tool returns an error (JSON like '{ success: false, error: '...' }'), explain the 'error' message clearly and concisely. Do not show raw JSON or technical details.`,
      });
    } catch (aiError: any) {
      console.error(`AI Model Error (Session: ${currentSessionId}, User: ${userId}):`, aiError);
      if (aiError.message?.includes('API key not valid')) {
        throw new HTTPException(403, {
          message: 'Your configured AI API key is invalid. Please check it in your profile.',
        });
      }
      if (aiError.message?.includes('Invalid arguments for tool')) {
        throw new HTTPException(400, {
          message: `AI failed to use tool correctly: ${aiError.message}`,
        });
      }
      if (aiError.message?.includes('quota') || aiError.status === 429) {
        throw new HTTPException(429, {
          message: 'AI processing limit reached. Please try again later.',
        });
      }
      throw new HTTPException(502, { message: `AI processing failed: ${aiError.message}` });
    }

    const assistantMessageForHistory: CoreAssistantMessage = {
      role: 'assistant',
      content: result.text || '',
    };

    await this.saveHistory(userId, currentSessionId, userMessage, assistantMessageForHistory);

    return {
      response: result.text,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      sessionId: currentSessionId,
    };
  }
}

export const aiService = new AiService();
