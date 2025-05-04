import { db } from '../database';
import { AiConversationHistory, User } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';

import { generateText, CoreMessage, CoreAssistantMessage } from 'ai';
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
  createAnalysisTools,
} from '../lib/ai/tools';
import { generateId } from 'ai';
import { InferInsertModel } from 'drizzle-orm';
import { decryptApiKey } from '../utils/crypto.utils';

const MAX_HISTORY_MESSAGES = 10;

type HistoryAssistantMessage = CoreAssistantMessage & {
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args: any;
  }>;
  toolResults?: Array<{
    toolCallId: string;
    toolName: string;
    result: any;
  }>;
};

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
        .filter((msg): msg is CoreMessage => msg.role !== 'system')
        .reverse();
    } catch (error: any) {
      console.error(`Error fetching AI history for session ${sessionId}:`, error);
      return [];
    }
  }

  private async saveHistory(
    userId: string,
    sessionId: string,
    userMessage: CoreMessage,
    assistantMessage: HistoryAssistantMessage,
  ): Promise<void> {
    try {
      const messagesToSave: Array<InferInsertModel<typeof AiConversationHistory>> = [
        { userId, sessionId, message: userMessage, createdAt: new Date() },
        { userId, sessionId, message: assistantMessage, createdAt: new Date(Date.now() + 1) },
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

    const systemPrompt = `You are a helpful financial assistant integrated into an expense tracker app. Your goal is to help the user manage their finances by understanding their natural language requests and using the available tools to perform actions or retrieve information from their account. Keep responses concise and directly address the user's request.

**Tool Usage Guidelines:**
- **Transactions:** When adding transactions, 'amount' MUST always be positive. Use 'type' ('income' or 'expense') for direction.
- **Identification & Confirmation (Updates/Deletes/Mark as Paid/etc.):**
    1. Use an identification tool first (e.g., 'identifyAccountForAction', 'identifyBudgetForAction', 'identifyTransactionForAction', 'findSavingGoal', 'identifyDebtForAction', 'markDebtAsPaid'). These tools help find the item and determine if confirmation or clarification is needed.
    2. Pay close attention to the JSON response from identification tools:
       - If you receive a response like \`{ "clarificationNeeded": true, ... }\`: Present the "options" clearly to the user and ask them to specify which item they mean (e.g., "I found multiple matching items. Which one do you mean? Please provide the ID."). STOP and wait for their response.
       - If you receive a response like \`{ "confirmationNeeded": true, "id": "...", "details": "...", "message": "..." }\`: PRESENT the "message" clearly to the user (e.g., "Okay, I found this item: [details]. [message]"). Ask them to explicitly confirm *with the ID* (e.g., "Confirm delete item [ID]?"). STOP and wait for their response.
       - If you receive a response like \`{ "success": true, "id": "..." }\` (and neither clarification nor confirmation is requested): Proceed with the execution tool directly if the user's original intent was clear and the tool's purpose is immediate execution (e.g., listing items).
       - If you receive a response like \`{ "success": false, "error": "..." }\`: Inform the user clearly using the "error" message provided by the tool. Do not proceed.
    3. If the user confirms AND explicitly includes the correct ID (e.g., "Yes, confirm delete transaction [ID]"), THEN use the corresponding 'executeConfirmed...' tool (e.g., 'executeConfirmedDeleteAccount', 'executeConfirmedUpdateTransaction', 'executeConfirmedMarkDebtPaid') providing ONLY the required ID (and any necessary update data).
    4. Do NOT use 'executeConfirmed...' tools without explicit user confirmation containing the specific ID. If they just say "yes" or "confirm", ask for the ID again for safety. Acknowledge cancellations if the user says "no" or "cancel").
- **Dates (CRITICAL):** For any tool parameter requiring a date or date range (like 'dateDescription'), **ALWAYS pass the user's *original natural language description* (e.g., "last month", "yesterday", "2024-08-15", "5 days ago", "last Tuesday", "this quarter", "between march 1 and april 10") directly into the 'dateDescription' argument.** The system will parse this string correctly. Do *not* try to calculate dates yourself. If no date is mentioned for listing transactions, do *not* add a default date unless the user specifically asks for 'today'.
- **Filtering (listTransactions - CRITICAL):** When using 'listTransactions', **carefully extract ALL specified filters** from the user's request and include them in the parameters. This includes 'accountIdentifier', 'categoryIdentifier', 'dateDescription', 'type', 'minAmount', 'maxAmount', and 'searchText'. **Do not omit filters mentioned by the user.** Example: If user says "Show expenses over 1000 from last Tuesday", call \`listTransactions\` with arguments like \`{ type: 'expense', minAmount: 1000, dateDescription: 'last Tuesday' }\`.
- **Reports & Analytics:** Use tools like 'getSpendingByCategory', 'getIncomeExpenseTrends', 'getAccountAnalyticsSummary', 'getExtremeTransaction' to fetch financial data.
    - **Analyze the Data:** When a tool returns data (in the \`data\` field of the JSON response), *analyze* that data to answer the user's question. Don't just repeat the tool's \`message\`.
    - **Summarize Findings:** Extract key insights from the \`data\` field. For example:
        - For \`getSpendingByCategory\` data: Identify the top 2-3 categories by expense amount and state their names and amounts. Mention the total expense if significant.
        - For \`getIncomeExpenseTrends\` data: Look at the income/expense arrays. Describe the overall trend (e.g., "Income seems to be increasing over the period, while expenses are fluctuating."). Avoid listing all data points.
        - For \`getAccountAnalyticsSummary\` data: Report the key figures like total income, expense, balance, and their percentage changes clearly.
        - For \`getExtremeTransaction\` data: Clearly state the found transaction's description, amount, date, and type (highest/lowest income/expense).
    - **Indicate Chart Potential:** If the tool returns structured data suitable for visualization (like \`getIncomeExpenseTrends\` or \`getSpendingByCategory\`), mention that you have retrieved the data and it can be visualized (e.g., "I found your spending breakdown. The data is ready to be charted."). Do *not* attempt to generate chart configurations.
- **Tool Results:** After successfully executing *any* tool, provide a brief, clear confirmation or summary message based *primarily* on the tool's \`message\` field, but *also* incorporate key data points *from the analysis* if it's an analytics/reporting tool (e.g., "OK, account 'Savings' created.", "Transaction for 'Groceries' deleted.", "Spending data retrieved: Food was the highest expense at $X.", "Income/expense trends retrieved. Income increased overall.", "Account analytics summary retrieved. Your balance increased by X%.").
- **Errors:** If a tool returns an error (JSON like \`{ success: false, "error": "..." }\`), explain the "error" message clearly and concisely to the user. Do not show raw JSON.
- **Context:** Remember previous turns in the conversation.
- **Ambiguity:** Ask clarifying questions if the request is unclear (e.g., which account/category/date?).`;

    const messages: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-MAX_HISTORY_MESSAGES),
      userMessage,
    ];

    const accountTools = createAccountTools(userId);
    const categoryTools = createCategoryTools(userId);
    const transactionTools = createTransactionTools(userId);
    const budgetTools = createBudgetTools(userId);
    const goalTools = createGoalTools(userId);
    const investmentAccountTools = createInvestmentAccountTools(userId);
    const investmentTools = createInvestmentTools(userId);
    const debtTools = createDebtTools(userId);
    const analysisTools = createAnalysisTools(userId);

    const allTools = {
      ...accountTools,
      ...categoryTools,
      ...transactionTools,
      ...budgetTools,
      ...goalTools,
      ...investmentAccountTools,
      ...investmentTools,
      ...debtTools,
      ...analysisTools,
    };

    let result;
    try {
      result = await generateText({
        model: aiModel,
        messages: messages,
        tools: allTools,
        maxSteps: 6,
      });
    } catch (aiError: any) {
      console.error(`AI Model Error (Session: ${currentSessionId}, User: ${userId}):`, aiError);
      if (aiError.message?.includes('API key not valid')) {
        throw new HTTPException(403, {
          message: 'Your configured AI API key is invalid. Please check it in your profile.',
        });
      }
      if (aiError.message?.includes('Invalid arguments for tool')) {
        const toolMatch = aiError.message.match(/Invalid arguments for tool "(\w+)": (.+)/);
        if (toolMatch && toolMatch[1] && toolMatch[2]) {
          throw new HTTPException(400, {
            message: `AI tried to use the "${toolMatch[1]}" tool incorrectly: ${toolMatch[2]}`,
          });
        }
        throw new HTTPException(400, {
          message: `AI failed to use a tool correctly. This might be due to unexpected input or an AI issue. Please try rephrasing.`,
        });
      }
      if (aiError.message?.includes('quota') || aiError.status === 429) {
        throw new HTTPException(429, {
          message: 'AI processing limit reached. Please try again later.',
        });
      }
      throw new HTTPException(502, {
        message: `AI processing failed: ${aiError.message || 'Unknown AI error'}`,
      });
    }

    const assistantMessageForHistory: HistoryAssistantMessage = {
      role: 'assistant',
      content: result.text || '',
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
    };

    await this.saveHistory(userId, currentSessionId, userMessage, assistantMessageForHistory);

    return {
      response: result.text,
      sessionId: currentSessionId,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
    };
  }
}

export const aiService = new AiService();
