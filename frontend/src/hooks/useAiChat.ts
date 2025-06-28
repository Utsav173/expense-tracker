import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiProcessPrompt } from '@/lib/endpoints/ai';
import { toast } from 'react-hot-toast';
import { useInvalidateQueries } from './useInvalidateQueries';
import { safeJsonParse } from '@/lib/utils';

const STORAGE_KEY_MESSAGES = 'aiChatMessages';
const STORAGE_KEY_SESSION_ID = 'aiChatSessionId';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
  toolResults?: any[];
  toolData?: {
    toolName: string;
    data: any;
    message?: string;
    error?: string;
  } | null;
  chart?: {
    type: 'bar' | 'line' | 'pie' | 'donut';
    data: any;
    options?: any;
    title?: string;
  };
  createdAt?: Date;
}

interface UseAiChatReturn {
  messages: ChatMessage[];
  latestAssistantMessage: ChatMessage | null;
  sendMessage: (prompt: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  sessionId: string | undefined;
  clearChat: () => void;
}

export const useAiChat = (): UseAiChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const storedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
      try {
        const parsed = storedMessages ? JSON.parse(storedMessages) : [];
        return parsed.map((msg: ChatMessage) => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined
        }));
      } catch (e) {
        console.error('Failed to parse stored messages:', e);
        localStorage.removeItem(STORAGE_KEY_MESSAGES);
        return [];
      }
    }
    return [];
  });

  const [sessionId, setSessionId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_SESSION_ID) || undefined;
    }
    return undefined;
  });

  const [error, setError] = useState<Error | null>(null);
  const invalidate = useInvalidateQueries();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionId) {
        localStorage.setItem(STORAGE_KEY_SESSION_ID, sessionId);
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION_ID);
      }
    }
  }, [sessionId]);

  const mutation = useMutation({
    mutationFn: async (prompt: string) => {
      setError(null);
      return aiProcessPrompt({ prompt, sessionId });
    },
    onSuccess: (data) => {
      if (!data) {
        console.error('AI Processing Error: Received null or undefined data.');
        setError(new Error('Received no response from the AI assistant.'));
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      let processedToolData: ChatMessage['toolData'] = null;
      let chartData: ChatMessage['chart'] | undefined = undefined;
      let shouldInvalidateQueries = false;

      if (data.toolResults && data.toolResults.length > 0) {
        const successfulAnalysisResult = data.toolResults.find((res) => {
          const parsed = safeJsonParse(res.result);
          return parsed && parsed.success === true && (parsed.data !== undefined || parsed.chart);
        });

        if (successfulAnalysisResult) {
          const parsed = safeJsonParse(successfulAnalysisResult.result);
          const callingTool = data.toolCalls?.find(
            (tc) => tc.toolCallId === successfulAnalysisResult.toolCallId
          );
          processedToolData = {
            toolName: callingTool?.toolName || 'Unknown Analysis Tool',
            data: parsed.data,
            message: parsed.message
          };
          chartData = parsed.chart;
          if (
            !callingTool?.toolName?.startsWith('get') &&
            !callingTool?.toolName?.startsWith('list') &&
            !callingTool?.toolName?.startsWith('identify')
          ) {
            shouldInvalidateQueries = true;
          }
        } else {
          const firstRelevantResult = data.toolResults[0];
          const parsed = safeJsonParse(firstRelevantResult.result);
          const callingTool = data.toolCalls?.find(
            (tc) => tc.toolCallId === firstRelevantResult.toolCallId
          );

          processedToolData = {
            toolName: callingTool?.toolName || 'Tool Execution',
            data: parsed?.data,
            message: parsed?.message,
            error: parsed?.error
          };
          chartData = parsed.chart;
          if (parsed?.confirmationNeeded || parsed?.clarificationNeeded) {
            shouldInvalidateQueries = false;
          } else if (
            parsed?.success === true &&
            !callingTool?.toolName?.startsWith('get') &&
            !callingTool?.toolName?.startsWith('list') &&
            !callingTool?.toolName?.startsWith('identify')
          ) {
            shouldInvalidateQueries = true;
          }
        }
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response ?? '',
        toolCalls: data.toolCalls,
        toolResults: data.toolResults,
        toolData: processedToolData,
        chart: chartData,
        createdAt: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }

      if (shouldInvalidateQueries) {
        invalidate(['dashboardData']);
        invalidate(['transactions']);
        invalidate(['accounts']);
        invalidate(['budgets']);
        invalidate(['goals']);
        invalidate(['investments']);
        invalidate(['investmentAccounts']);
        invalidate(['debts']);
      }
    },
    onError: (err: Error) => {
      console.error('AI processing mutation error:', err);
      setError(err);
      setMessages((prev) => prev.slice(0, -1));
    }
  });

  const sendMessage = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || mutation.isPending) {
        return;
      }
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        createdAt: new Date()
      };

      setMessages((prev) => [...prev, userMessage]);
      await mutation.mutateAsync(prompt);
    },
    [mutation]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
      localStorage.removeItem(STORAGE_KEY_SESSION_ID);
    }
    toast.success('Chat history cleared.');
  }, []);

  const latestAssistantMessage = useMemo(() => {
    return messages.filter((msg) => msg.role === 'assistant').pop() || null;
  }, [messages]);

  return {
    messages,
    latestAssistantMessage,
    sendMessage,
    isLoading: mutation.isPending,
    error,
    sessionId,
    clearChat
  };
};
