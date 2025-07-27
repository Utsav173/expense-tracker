'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiProcessPrompt } from '@/lib/endpoints/ai';
import { useInvalidateQueries } from '../../../hooks/useInvalidateQueries';
import { useToast } from '@/lib/hooks/useToast';
import { ChatMessage } from '@/lib/types';
import { safeJsonParse } from '@/lib/utils';

const STORAGE_KEY_MESSAGES = 'aiChatMessages';
const STORAGE_KEY_SESSION_ID = 'aiChatSessionId';

interface UseAiChatReturn {
  messages: ChatMessage[];
  sendMessage: (prompt: string, base64Image?: string) => Promise<void>;
  isLoading: boolean;
  isStreaming: boolean;
  error: Error | null;
  clearChat: () => void;
}

export const useAiChat = (): UseAiChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const invalidate = useInvalidateQueries();
  const { showSuccess } = useToast();
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
      const parsed = storedMessages ? JSON.parse(storedMessages) : [];
      setMessages(
        parsed.map((msg: ChatMessage) => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined
        }))
      );
      setSessionId(localStorage.getItem(STORAGE_KEY_SESSION_ID) || undefined);
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    if (sessionId) localStorage.setItem(STORAGE_KEY_SESSION_ID, sessionId);
    else localStorage.removeItem(STORAGE_KEY_SESSION_ID);
  }, [messages, sessionId]);

  const streamResponse = useCallback((finalMessage: ChatMessage) => {
    setIsStreaming(true);
    let i = 0;
    const fullResponseText = finalMessage.content;

    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    typingIntervalRef.current = setInterval(() => {
      setMessages((currentMessages) => {
        const newMessages = [...currentMessages];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = fullResponseText.slice(0, i + 1);
        }
        return newMessages;
      });
      i++;
      if (i > fullResponseText.length) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setIsStreaming(false);
        setMessages((currentMessages) => {
          const newMessages = [...currentMessages];
          if (
            newMessages.length > 0 &&
            newMessages[newMessages.length - 1].id === finalMessage.id
          ) {
            newMessages[newMessages.length - 1] = finalMessage;
          }
          return newMessages;
        });
      }
    }, 15);
  }, []);

  const processApiResponse = (data: any) => {
    const rawResponse = data?.response ?? 'Sorry, I encountered an issue.';
    const newSessionId = data?.sessionId;

    if (newSessionId && newSessionId !== sessionId) {
      setSessionId(newSessionId);
    }

    const parsedResponse = safeJsonParse(rawResponse);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: parsedResponse?.message ?? rawResponse,
      chart: parsedResponse?.chart,
      imageAnalysisData: parsedResponse?.imageAnalysisData,
      followUpPrompts: parsedResponse?.followUpPrompts,
      createdAt: new Date()
    };

    setMessages((prev) => [...prev, assistantMessage]);
    streamResponse(assistantMessage);

    const actionKeywords = ['added', 'created', 'updated', 'deleted', 'set', 'modified', 'paid'];
    const responseText =
      typeof parsedResponse === 'string' ? parsedResponse : parsedResponse?.message || '';
    if (actionKeywords.some((keyword) => responseText.toLowerCase().includes(keyword))) {
      invalidate([
        'dashboardData',
        'transactions',
        'accounts',
        'budgets',
        'goals',
        'investments',
        'debts'
      ]);
    }
  };

  const mutation = useMutation({
    mutationFn: ({ prompt, base64Image }: { prompt: string; base64Image?: string }) =>
      aiProcessPrompt({ prompt, sessionId, base64Image }),
    onSuccess: processApiResponse,
    onError: (err: Error) => {
      setError(err);
      setMessages((prev) => prev.slice(0, -1));
    }
  });

  const sendMessage = useCallback(
    async (prompt: string, base64Image?: string) => {
      if (!prompt.trim() || mutation.isPending || isStreaming) return;

      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      setIsStreaming(false);
      setError(null);

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        createdAt: new Date()
      };
      setMessages((prev) => [...prev, userMessage]);

      await mutation.mutateAsync({ prompt, base64Image });
    },
    [mutation, isStreaming]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setIsStreaming(false);
    showSuccess('Chat history cleared.');
  }, [showSuccess]);

  return {
    messages,
    sendMessage,
    isLoading: mutation.isPending,
    isStreaming,
    error,
    clearChat
  };
};
