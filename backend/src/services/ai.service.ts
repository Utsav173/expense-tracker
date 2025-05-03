import { db } from '../database';
import { AiConversationHistory, User } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateText, CoreMessage, TextPart, ToolCallPart, CoreAssistantMessage } from 'ai'; // Import CoreAssistantMessage
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

type AssistantContentArray = Array<TextPart | ToolCallPart>;
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
      // Ensure correct parsing and typing - Drizzle might return stringified JSON
      return history
        .map((h) => {
          try {
            // Attempt to parse if it's a string, otherwise assume it's already an object
            return typeof h.message === 'string' ? JSON.parse(h.message) : h.message;
          } catch (e) {
            console.error('Failed to parse message from history:', h.message, e);
            // Return a placeholder or skip if unparseable
            return { role: 'system', content: '[Error parsing message]' } as CoreMessage;
          }
        })
        .filter((msg) => msg.role !== 'system'); // Filter out error placeholders if needed
    } catch (error: any) {
      console.error(`Error fetching AI history for session ${sessionId}:`, error);
      return [];
    }
  }

  private async saveHistory(
    userId: string,
    sessionId: string,
    userMessage: CoreMessage,
    assistantMessage: CoreAssistantMessage, // Use the specific assistant message type
  ): Promise<void> {
    try {
      const messagesToSave: Array<InferInsertModel<typeof AiConversationHistory>> = [
        {
          userId,
          sessionId,
          message: userMessage, // Drizzle should handle JSONB stringification
          createdAt: new Date(),
        },
        {
          userId,
          sessionId,
          message: assistantMessage, // Drizzle should handle JSONB stringification
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

    // --- Tool Setup ---
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
            1. Use an identification tool first (e.g., 'identifyAccountForDeletion', 'findBudgetForUpdateOrDelete', 'findTransactionForUpdateOrDelete', 'findSavingGoal', 'markDebtAsPaid').
            2. These tools return JSON like '{ confirmationNeeded: true, id: '...', details: '...', message: '...' }'.
            3. PRESENT the 'message' clearly to the user, asking for confirmation.
            4. If the user confirms AND includes the correct ID (e.g., "Yes, confirm delete account [ID]"), THEN use the corresponding 'execute...' tool (e.g., 'executeConfirmedDeleteAccount', 'executeUpdateTransactionById', 'executeConfirmedMarkDebtPaid') providing ONLY the required ID (and update data if applicable).
            5. Do NOT use 'execute...' tools without explicit user confirmation containing the specific ID. If they just say "yes", ask for the ID. Acknowledge cancellations.
        - **Ambiguity:** If a request is ambiguous (multiple items match), use a listing tool and ask the user to clarify by name or ID.
        - **Not Found:** If an item (account, category, etc.) isn't found, inform the user clearly.
        - **Dates:** Infer relative dates ('today', 'yesterday', 'last month'). Default to 'today' for transactions if unspecified. Use 'YYYY-MM-DD' if provided. Budgets require month/year. Goal target dates are optional.
        - **New Tools:** You can now check budget progress ('getBudgetProgress') and find extreme transactions ('getExtremeTransaction').
        **Confirmation Messages:** After successfully executing *any* tool (create, list, confirmed update/delete), provide a brief, clear confirmation (e.g., 'OK, account created.', 'Transaction deleted.', 'Budget progress retrieved.').
        **Errors:** If a tool returns an error (JSON like '{ success: false, error: '...' }'), explain the 'error' message clearly. Do not show raw JSON.`,
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

    // --- Use the message object from the result for history ---
    // Ensure result.message conforms to CoreAssistantMessage
    const assistantMessageForHistory: CoreAssistantMessage = {
      role: 'assistant',
      content: result.text, // Use content from result.message
    };
    // ---------------------------------------------------------

    await this.saveHistory(userId, currentSessionId, userMessage, assistantMessageForHistory);

    // --- Return the final text and the last step's tool info ---
    return {
      response: result.text,
      toolCalls: result.toolCalls, // Still useful for frontend display summary
      toolResults: result.toolResults, // Still useful for frontend display summary
      sessionId: currentSessionId,
    };
    // ----------------------------------------------------------
  }
}

export const aiService = new AiService();
