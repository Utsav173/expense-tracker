import { db } from '../database';
import { AiConversationHistory } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateText, CoreMessage, TextPart, ToolCallPart } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { config } from '../config';
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

// Correct type for assistant content array
type AssistantContentArray = Array<TextPart | ToolCallPart>;

const MAX_HISTORY_MESSAGES = 10;

let google: ReturnType<typeof createGoogleGenerativeAI> | null = null;
if (config.GOOGLE_GENERATIVE_AI_API_KEY) {
  google = createGoogleGenerativeAI({ apiKey: config.GOOGLE_GENERATIVE_AI_API_KEY });
} else {
  console.error('AI Service: GOOGLE_GENERATIVE_AI_API_KEY is not configured.');
}
const aiModel = google ? google('gemini-1.5-flash-latest') : null;

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
    if (!aiModel) {
      throw new HTTPException(503, { message: 'AI service is not configured or unavailable.' });
    }

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

    // Let TypeScript infer the specific result type here
    let result;
    try {
      // Use maxSteps for generateText as per docs
      result = await generateText({
        model: aiModel,
        messages: messages,
        tools: allTools,
        maxSteps: 5,
        system: `You are a helpful financial assistant integrated into an expense tracker app.
                         Use the available tools to perform actions requested by the user (create, list, update, delete accounts, categories, transactions, budgets, saving goals, investment accounts, investments, debts).
                         IMPORTANT for Transactions: The 'amount' parameter MUST always be a positive number. Use the 'type' parameter ('income' or 'expense') for direction.
                         IMPORTANT for Budgets/Goals: Amounts should always be positive.
                         IMPORTANT for Deletion/Updates:
                         1. First, use an identification tool (like 'identifyAccountForDeletion', 'findBudgetForUpdateOrDelete', 'findSavingGoal') to locate the item.
                         2. These tools return a message asking the user for confirmation and provide the item's ID. Present this message clearly.
                         3. If the user confirms the action AND provides the correct ID from the previous step, THEN use the corresponding 'executeConfirmed...' or 'executeUpdate...' tool (like 'executeConfirmedDeleteAccount', 'executeUpdateTransactionById') with the provided ID.
                         4. Do NOT use 'executeConfirmed...' or 'executeUpdate...' tools unless the user has explicitly confirmed the action for a specific ID you provided.
                         Clarification: If a user request is ambiguous (e.g., multiple accounts match a name), ask for clarification. If an account or category name is not found, inform the user clearly.
                         Dates: Infer dates like 'today', 'yesterday', 'last month', 'this month'. Default to 'today' if unspecified for transactions. Use 'YYYY-MM-DD' format if specified. For budgets, require month and year. For goals, target date is optional.
                         Confirmation: After successfully executing *any* tool (create, list, or confirmed update/delete), provide a brief confirmation message (e.g., 'OK, account created.', 'Transaction deleted.', 'Here are your categories: ...').
                         Errors: If a tool returns an error, explain it clearly to the user.`,
      });
    } catch (aiError: any) {
      console.error(`AI Model Error (Session: ${currentSessionId}):`, aiError);
      if (aiError.message?.includes('Invalid arguments for tool')) {
        throw new HTTPException(400, {
          message: `AI failed to use tool correctly: ${aiError.message}`,
        });
      }
      if (aiError.message?.includes('API key')) {
        throw new HTTPException(503, { message: `AI service API key issue: ${aiError.message}` });
      }
      throw new HTTPException(502, { message: `AI processing failed: ${aiError.message}` });
    }

    // Construct assistant message content using specific Part types
    // Allow only TextPart and ToolCallPart as per CoreMessage definition for 'assistant' role
    const assistantResponseContent: AssistantContentArray = [];
    if (result.text) {
      assistantResponseContent.push({ type: 'text', text: result.text } as TextPart);
    }
    if (result.toolCalls && result.toolCalls.length > 0) {
      result.toolCalls.forEach((tc) => {
        // tc type is inferred correctly here
        assistantResponseContent.push({
          type: 'tool-call',
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          args: tc.args,
        });
      });
    }

    // Ensure content array is not empty
    const finalAssistantContent =
      assistantResponseContent.length > 0
        ? assistantResponseContent
        : [{ type: 'text', text: 'OK.' } as TextPart];

    const assistantMessage: CoreMessage = {
      role: 'assistant',
      content: finalAssistantContent,
    };

    await this.saveHistory(userId, currentSessionId, userMessage, assistantMessage);

    // Return the result and sessionId
    return { ...result, sessionId: currentSessionId };
  }
}

export const aiService = new AiService();
