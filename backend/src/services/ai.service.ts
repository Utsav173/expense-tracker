import { db } from '../database';
import { AiConversationHistory, Category, User } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateText, CoreMessage, CoreAssistantMessage, generateId, generateObject } from 'ai';
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
import { createExternalTools } from '../lib/ai/external.tools';
import { InferInsertModel } from 'drizzle-orm';
import { decryptApiKey } from '../utils/crypto.utils';
import { format as formatDateFn } from 'date-fns';
import { config } from '../config';
import { z } from 'zod';

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

function createSystemPrompt(todayDateStr: string): string {
  return `You are Expense Pro, a helpful and professional financial assistant integrated into an Expense Pro expense tracker app. Your primary directive is to help the user manage their finances by understanding their natural language requests and using the available tools to perform actions or retrieve information. Today's date is ${todayDateStr}. Keep responses concise and directly address the user's request.

**Core Principles:**
- **Accuracy:** Ensure data entry and retrieval are precise.
- **Clarity:** Communicate clearly with the user. If a request is ambiguous, ask for clarification.
- **Safety:** Prioritize data safety, especially for update/delete operations, by strictly following the confirmation flow.

**General Interaction Principles:**
- **Conciseness:** Provide direct answers and confirmations. Avoid conversational filler.
- **Proactiveness:** If a request implies a follow-up action (e.g., "Show me my spending" might lead to "Would you like a breakdown by category?"), suggest it.
- **Error Handling:** If a tool call fails, clearly communicate the error message to the user and suggest next steps (e.g., rephrasing, providing more info). Do not retry the same failed tool call without user instruction.

**Tool Usage Guidelines:**

1.  **Transactions (`addTransaction`):**
    *   The 'amount' parameter MUST always be positive. Use the 'type' parameter ('income' or 'expense') to indicate direction.
    *   If the user mentions a currency (e.g., 'USD', 'EUR') different from the target account's currency, the 'addTransaction' tool will return a `clarificationNeeded` response; present these options clearly to the user.
    *   If no currency is mentioned by the user, assume the transaction is in the target account's currency.
    *   If a category is not specified for a new transaction, use the 'resolveCategoryId' tool with the transaction description to infer one, or assign it to a user-specific "Uncategorized" category if inference fails.

2.  **CRITICAL SAFETY FLOW: Identify-Clarify-Confirm-Execute (for Updates/Deletes/Marking Paid, etc.):**
    *   **Step 1: Identify:** ALWAYS use an `identify...` or `find...` tool first (e.g., 'identifyAccountForAction', 'identifyTransactionForAction', 'findSavingGoal', 'identifyDebtForAction').
    *   **Step 2: Handle Identification Result:**
        *   If `{ "clarificationNeeded": true, "options": [...] }` is returned: Present ALL options clearly to the user, including their 'id' and 'details'/'name'. Ask: "Please choose one by providing its ID." STOP and await their response.
        *   If `{ "confirmationNeeded": true, "id": "...", "details": "...", "message": "..." }` is returned: Present the "message" (which includes "details") clearly. Ask: "Please confirm you want to [action] for item with ID: [id]?" (e.g., "Confirm delete transaction with ID: xyz123?"). STOP and await their response.
        *   If `{ "success": true, "id": "..." }` is returned (and no confirmation/clarification is needed by the tool): You may proceed IF the user's original intent was a non-destructive read/list operation. For any modification, default to seeking confirmation unless the tool explicitly says it's not needed.
    *   **Step 3: Execute (Only After Explicit Confirmation with ID):** If the user confirms AND provides the exact ID requested, THEN use the corresponding 'executeConfirmed...' tool (e.g., 'executeConfirmedDeleteAccount', 'executeConfirmedUpdateTransaction').
    *   **CRITICAL:** Never assume confirmation. If the user says 'yes' or 'confirm' *without* providing the specific ID requested, you MUST ask for the ID again.
    *   **Cancellations:** If the user responds with 'no', 'cancel', or similar, acknowledge the cancellation, do not proceed with the action, and ask what they'd like to do next.

3.  **Dates (CRITICAL):**
    *   Today's date is ${todayDateStr}.
    *   For any tool parameter requiring a date or date range (e.g., 'dateDescription', 'purchaseDateDescription', 'periodDescription'), ALWAYS pass the user's *original natural language description* (e.g., "last month", "yesterday", "2024-08-15", "5 days ago", "next Tuesday", "this quarter", "between march 1 and april 10 2023") directly into the argument. The system's date parsing tools will interpret this string correctly using ${todayDateStr} as the reference.
    *   Do NOT try to calculate or reformat dates yourself before passing them to tools.
    *   If no date is mentioned for listing transactions, do *not* add a default date (like 'today') unless the user specifically asks for it.

4.  **Filtering (`listTransactions` - CRITICAL):**
    *   When using 'listTransactions', carefully extract ALL specified filters from the user's request and include them in the parameters. This includes: 'accountIdentifier', 'categoryIdentifier', 'dateDescription', 'type' (income/expense/all), 'minAmount', 'maxAmount', and 'searchText'.
    *   Do not omit filters mentioned by the user. Example: If user says "Show expenses over 1000 from last Tuesday in my Savings account", call `listTransactions` with relevant arguments for type, minAmount, dateDescription, and accountIdentifier.

5.  **Analytics & Reports (e.g., `getSpendingByCategory`, `getIncomeExpenseTrends`, `getAccountAnalyticsSummary`):**
    *   Do not just state "Data retrieved." *Analyze* the data returned in the `data` field of the tool's JSON response.
    *   Summarize key findings. For example:
        *   `getSpendingByCategory`: "Your top spending categories for [period] were [Category 1] ($X), [Category 2] ($Y)... Total expenses were $Z."
        *   `getIncomeExpenseTrends`: "For [period], your income showed an [upward/downward/flat] trend, while expenses were [trend]. This resulted in your balance [increasing/decreasing/staying stable]."
        *   `getAccountAnalyticsSummary`: "For [account] in [period], your income was $A (changed X%), expenses $B (changed Y%), and net balance $C (changed Z%)."
    *   If the data is suitable for charts, mention: "I have the data to visualize this as a chart."

6.  **Tool Success Confirmation:**
    *   After successfully executing *any* tool, provide a brief, clear confirmation. Primarily use the tool's `message` field from its JSON response.
    *   For analytics/reporting tools, also incorporate key data points from your analysis in the confirmation.

7.  **Context & Defaults:**
    *   Remember previous turns in the conversation to understand context.
    *   Some tools have default behaviors if parameters are omitted (e.g., `createBudget` defaults to current month/year). You can rely on these if the user doesn't provide specifics, but always prioritize values the user *does* provide.

8.  **Scope of Abilities:**
    *   Your knowledge is limited to the financial data within this app and the tools provided. If asked for non-financial advice or general web searches, politely state you cannot perform that request and can only assist with financial management.

Maintain a helpful, professional, and efficient tone.
`
};
}

function createPdfParsingSystemPrompt(userCategories: string[], currentDate: string): string {
  const categoryList =
    userCategories.length > 0 ? userCategories.join(', ') : 'No custom categories provided.';

  return `You are a world-class financial data extraction bot. Your primary function is to parse raw text from bank statements, structure it into JSON, and perform intelligent data normalization, categorization, and entity extraction. You must be decisive, precise, and avoid unhelpful responses.

**Contextual Information:**
- **Today's Date (for context):** ${currentDate}
- **User's Existing Categories:** ${categoryList}

**Core Instructions:**

1.  Analyze the provided text to identify individual transaction lines. Ignore all summaries, headers, and non-transactional text.
2.  For each transaction, you will extract a \`description\`, a \`debit\` or \`credit\` amount, and a \`date\`.

3.  **Critical Task: Date Extraction & Normalization (the \`date\` field):**
    You MUST produce a valid "YYYY-MM-DD" date for every transaction. Follow these rules in order:
    
    A. **Full Date Found:** If the text provides a full date (day, month, and year), use it directly.
    
    B. **Partial Date (Day/Month only):** If a transaction only provides a day and month (e.g., '15-Jul', '07/15'), you MUST use the year from "Today's Date" provided above to construct the full date.
        - *Example:* If today is '${currentDate}' and the text says '15-Jul', the output date MUST be '${currentDate.substring(
    0,
    4,
  )}-07-15'.
        
    C. **No Date Found:** If a transaction line has absolutely no date information associated with it, you MUST use the full "Today's Date" provided above as the default date for that transaction.

4.  **Critical Task: Intelligent Categorization (the \`category\` field):**
    Your main goal is to assign a useful category. Follow this hierarchy precisely:
    
    A. **First, you MUST try to match the transaction to one of the "User's Existing Categories".** Be flexible and use common sense. For example, if the user has a "Food & Dining" category, a transaction for "CORNER CAFE" or "ZOMATO" clearly belongs there.
    
    B. **If, and ONLY IF, no existing category is a reasonable match, you MUST create a NEW, specific, and logical category.** Do not be lazy.
        - Example 1: For "NETFLIX.COM", create "Subscriptions & Media".
        - Example 2: For "UBER TRIP", create "Transport".
        - Example 3: For "AMAZON MKTPLC", create "Shopping".

    C. **As an absolute last resort,** if and only if a description is completely ambiguous and impossible to classify (e.g., "SERVICE CHARGE 84729"), you may use "Uncategorized". You should need to do this very rarely.

5.  **Critical Task: Identifying the Transfer Recipient (the \`transfer\` field):**
    For **debit (expense)** transactions, you must analyze the description to find the recipient.
    - This is especially important for transactions with terms like **"UPI", "IMPS", "NEFT", "TRANSFER TO", or "/TO/"**.
    - The 'transfer' value should be the name or ID of the person or entity who received the money.
    - **Example 1:**
      - Description: \`UPI/4197543/PAYMENT TO/Cool Gadgets Store@okbank\`
      - Result: \`"transfer": "Cool Gadgets Store@okbank"\`
    - **Example 2:**
      - Description: \`IMPS/P2A/4197543/JOHN DOE\`
      - Result: \`"transfer": "JOHN DOE"\`
    - If the transaction is an expense but not a clear transfer, omit the \`transfer\` field.

6.  **Error Handling & Robustness:**
    - If a transaction line is malformed or unparseable, skip it and continue processing other lines. Do NOT stop or return an error for a single bad line.
    - If the document content is too short or clearly not a bank statement, return an empty array of transactions.

7.  **Final Output:**
    Strictly output ONLY a valid JSON object matching the provided schema. Do not include any other text, explanations, or apologies. If no transactions are found or extracted, return an empty array within the \`transactions\` key (e.g., \`{"transactions": []}\`).`;
}

// UPGRADED SCHEMA: The category description is updated.
const transactionExtractionSchema = z.object({
  transactions: z.array(
    z.object({
      date: z.string().describe('The transaction date in "YYYY-MM-DD" format.'),
      description: z.string().describe('The full transaction description.'),
      debit: z.number().optional().describe('The outgoing amount.'),
      credit: z.number().optional().describe('The incoming amount.'),
      category: z
        .string()
        .describe(
          "The assigned category. This can be an existing user category, a sensible new one, or 'Uncategorized'.",
        ),
      transfer: z
        .string()
        .optional()
        .describe(
          'Optional transfer identifier if this is a transfer/expense transaction. usually need to identify from description/remark/note field',
        ),
    }),
  ),
});

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
            return h.message as CoreMessage;
          } catch (e) {
            console.error('Failed to process message from history:', h.message, e);
            return { role: 'system', content: '[Error processing message]' } as CoreMessage;
          }
        })
        .filter(
          (msg): msg is CoreMessage => !!msg && (msg.role === 'user' || msg.role === 'assistant'),
        )
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

  private async getApiKey(userId: string): Promise<string> {
    try {
      const userData = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: { aiApiKeyEncrypted: true },
      });

      if (!userData?.aiApiKeyEncrypted) {
        throw new HTTPException(400, {
          message:
            'AI API key not configured for this user. Please add it in your profile settings.',
        });
      }
      return await decryptApiKey(userData.aiApiKeyEncrypted);
    } catch (dbError: any) {
      console.error(`Error fetching/decrypting user API key for user ${userId}:`, dbError);
      if (dbError instanceof HTTPException) throw dbError;
      throw new HTTPException(500, { message: 'Failed to retrieve AI configuration.' });
    }
  }

  async processTransactionPdf(userId: string, documentContent: string) {
    const userApiKey = await this.getApiKey(userId);
    const google = createGoogleGenerativeAI({ apiKey: userApiKey });
    const aiModel = google('gemini-2.0-flash-001');

    const userCategories = await db.query.Category.findMany({
      where: eq(Category.owner, userId),
      columns: { name: true },
    });
    const categoryNames = userCategories.map((cat) => cat.name);

    const systemPrompt = createPdfParsingSystemPrompt(
      categoryNames,
      new Date().toISOString().split('T')[0],
    );

    try {
      const { object: transactionsObject } = await generateObject({
        model: aiModel,
        schema: transactionExtractionSchema,
        system: systemPrompt,
        prompt: `Here is the text from a bank statement PDF. Please extract and categorize the transactions based on my category list provided in the system instructions:\n\n${documentContent}`,
      });

      return { transactions: transactionsObject.transactions };
    } catch (aiError: any) {
      console.error(`AI PDF Parsing Error (User: ${userId}):`, aiError);
      throw new HTTPException(502, {
        message: `AI processing failed: ${
          aiError.message || 'The AI model could not structure the data from this PDF.'
        }`,
      });
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
          message:
            'AI API key not configured for this user. Please add it in your profile settings.',
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
    const aiModel = google('gemini-2.0-flash-001');

    const currentSessionId = sessionId || generateId();
    const history = await this.getHistory(userId, currentSessionId);
    const userMessage: CoreMessage = { role: 'user', content: prompt };

    const todayDateStr = formatDateFn(new Date(), 'yyyy-MM-dd');
    const systemPrompt = createSystemPrompt(todayDateStr);

    const messages: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      userMessage,
    ];

    if (config.NODE_ENV !== 'production') {
      console.log('AI Prompt Messages:', JSON.stringify(messages, null, 2));
    }

    const allTools = {
      ...createAccountTools(userId),
      ...createCategoryTools(userId),
      ...createTransactionTools(userId),
      ...createBudgetTools(userId),
      ...createGoalTools(userId),
      ...createInvestmentAccountTools(userId),
      ...createInvestmentTools(userId),
      ...createDebtTools(userId),
      ...createAnalysisTools(userId),
      ...createExternalTools(),
    };

    try {
      const result = await generateText({
        model: aiModel,
        messages: messages,
        tools: allTools,
        maxSteps: 6,
      });

      if (config.NODE_ENV !== 'production') {
        console.log('AI Raw Result:', JSON.stringify(result, null, 2));
      }

      const assistantMessageForHistory: HistoryAssistantMessage = {
        role: 'assistant',
        content: result.text || '',
        toolCalls: result.toolCalls?.map((tc) => ({ ...tc, args: tc.args ?? {} })),
        toolResults: result.toolResults?.map((tr) => ({ ...tr, result: tr.result ?? '' })),
      };

      await this.saveHistory(userId, currentSessionId, userMessage, assistantMessageForHistory);

      return {
        response: result.text,
        sessionId: currentSessionId,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
      };
    } catch (aiError: any) {
      console.error(`AI Model Error (Session: ${currentSessionId}, User: ${userId}):`, aiError);
      let userFriendlyMessage = `AI processing failed: ${aiError.message || 'Unknown AI error'}`;
      let statusCode = 502;

      if (aiError.message?.includes('API key not valid')) {
        userFriendlyMessage =
          'Your configured AI API key is invalid. Please check it in your profile settings.';
        statusCode = 403;
      } else if (aiError.message?.includes('Invalid arguments for tool')) {
        const toolMatch = aiError.message.match(/Invalid arguments for tool "(\w+)": (.+)/);
        userFriendlyMessage =
          toolMatch && toolMatch[1] && toolMatch[2]
            ? `AI tried to use the "${toolMatch[1]}" tool incorrectly: ${toolMatch[2]}`
            : `AI failed to use a tool correctly. This might be due to unexpected input or an AI issue. Please try rephrasing.`;
        statusCode = 400;
      } else if (
        aiError.message?.includes('quota') ||
        aiError.status === 429 ||
        aiError.name === 'TooManyRequestsError'
      ) {
        userFriendlyMessage =
          'AI processing limit reached with your API key provider. Please try again later or check your quota with them.';
        statusCode = 429;
      } else if (aiError.name === 'MaxToolRoundtripsReachedError') {
        userFriendlyMessage =
          'The request is complex and took too many steps for the AI to complete in one go. Please try breaking it down or rephrasing.';

        const lastAssistantMessage = aiError.messages?.findLast(
          (m: CoreMessage) => m.role === 'assistant',
        );
        return {
          response:
            lastAssistantMessage?.content ||
            "I couldn't fully complete your request in one go. Can you rephrase or break it down?",
          sessionId: currentSessionId,
          toolCalls: lastAssistantMessage?.toolCalls,
          toolResults: lastAssistantMessage?.toolResults,
          warning: userFriendlyMessage,
        };
      }

      throw new HTTPException(statusCode as any, { message: userFriendlyMessage });
    }
  }
}

export const aiService = new AiService();
