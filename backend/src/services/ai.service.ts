import { db } from '../database';
import { AiConversationHistory, User } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateText, CoreMessage, TextPart, ToolCallPart } from 'ai';
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
      return history.map((h) => h.message as CoreMessage).reverse();
    } catch (error: any) {
      console.error(`Error fetching AI history for session ${sessionId}:`, error);
      return [];
    }
  }

  private async saveHistory(
    userId: string,
    sessionId: string,
    userMessage: CoreMessage,
    assistantMessage: CoreMessage,
  ): Promise<void> {
    try {
      const messagesToSave: Array<InferInsertModel<typeof AiConversationHistory>> = [
        {
          userId,
          sessionId,
          message: userMessage as unknown as CoreMessage,
          createdAt: new Date(),
        },
        {
          userId,
          sessionId,
          message: assistantMessage as unknown as CoreMessage,
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
        system: `You are a helpful financial assistant integrated into an expense tracker app. Use the available tools to perform actions requested by the user (create, list, update, delete accounts, categories, transactions, budgets, saving goals, investment accounts, investments, debts). IMPORTANT for Transactions: The 'amount' parameter MUST always be a positive number. Use the 'type' parameter ('income' or 'expense') for direction. IMPORTANT for Budgets/Goals: Amounts should always be positive. IMPORTANT for Deletion/Updates (2-Step Confirmation): 1. First, use an identification tool (like 'identifyAccountForDeletion', 'findBudgetForUpdateOrDelete', 'findSavingGoal', 'markDebtAsPaid') to locate the specific item the user wants to modify. 2. These identification tools will return a structured JSON string containing '{ confirmationNeeded: true, id: '...', details: '...', message: '...' }'. You MUST present the 'message' clearly to the user, asking for their confirmation. 3. If the user confirms the action AND their confirmation message explicitly contains the correct ID returned in step 2 (e.g., "Yes, confirm delete account [ID]", "Confirm update budget [ID]"), THEN you MUST use the corresponding 'executeConfirmed...' or 'executeUpdate...' tool (like 'executeConfirmedDeleteAccount', 'executeUpdateTransactionById', 'executeConfirmedMarkDebtPaid') and provide ONLY the required ID (and any update data if applicable). 4. Do NOT use any 'executeConfirmed...' or 'executeUpdate...' tools unless the user has provided explicit confirmation containing the specific ID from the previous step. If the user simply says "yes" without the ID, ask them to confirm with the ID. If the user cancels or says no, acknowledge the cancellation. Clarification: If a user request is ambiguous (e.g., multiple items match a name), use the tool to list the items and ask the user to clarify by providing the specific name or ID. If an account or category name is not found, inform the user clearly. Dates: Infer dates like 'today', 'yesterday', 'last month', 'this month'. Default to 'today' if unspecified for transactions. Use 'YYYY-MM-DD' format if specified. For budgets, require month and year. For goals, target date is optional. Confirmation Messages: After successfully executing *any* tool (create, list, or a CONFIRMED update/delete/mark as paid), provide a brief, clear confirmation message (e.g., 'OK, account created.', 'Transaction deleted.', 'Debt marked as paid.', 'Here are your categories: ...'). Errors: If a tool returns an error (in the structured JSON like '{ success: false, error: '...' }'), explain the 'error' message clearly to the user. Do not expose raw JSON errors.`,
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
      throw new HTTPException(502, { message: `AI processing failed: ${aiError.message}` });
    }

    const assistantMessageForHistory: CoreMessage = {
      role: 'assistant',
      content: [
        ...(result.text ? [{ type: 'text', text: result.text } as TextPart] : []),
        ...(result.toolCalls?.map(
          (tc) =>
            ({
              type: 'tool-call',
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              args: tc.args,
            } as ToolCallPart),
        ) ?? []),
      ],
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
