'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiProcessPrompt } from '@/lib/endpoints/ai';
import { useInvalidateQueries } from '../../../hooks/useInvalidateQueries';
import { useToast } from '@/lib/hooks/useToast';
import type { AIAPI } from '@/lib/api/api-types';
import { safeJsonParse } from '@/lib/utils';

interface ChatMessage extends AIAPI.ParsedAIResponse {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
  image?: string;
  document?: { name: string; type: 'pdf' | 'xlsx' };
}

const STORAGE_KEY_MESSAGES = 'aiChatMessages';
const STORAGE_KEY_SESSION_ID = 'aiChatSessionId';

interface SendMessagePayload {
  prompt: string;
  base64Image?: string;
  documentContent?: string;
  documentType?: 'pdf' | 'xlsx';
  documentName?: string;
}

interface UseAiChatReturn {
  messages: ChatMessage[];
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
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
      message: parsedResponse?.message ?? rawResponse,
      chart: parsedResponse?.chart,
      records: parsedResponse?.records,
      metrics: parsedResponse?.metrics,
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
    mutationFn: (payload: SendMessagePayload) => aiProcessPrompt({ ...payload, sessionId }),
    onSuccess: processApiResponse,
    onError: (err: Error) => {
      setError(err);
      setMessages((prev) => prev.slice(0, -1));
    }
  });

  const sendMessage = useCallback(
    async (payload: SendMessagePayload) => {
      const { prompt, base64Image, documentContent, documentType, documentName } = payload;
      if (!prompt.trim() && !base64Image && !documentContent) return;
      if (mutation.isPending || isStreaming) return;

      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      setIsStreaming(false);
      setError(null);

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        message: prompt,
        createdAt: new Date()
      };

      if (base64Image) {
        userMessage.image = `data:image/jpeg;base64,${base64Image}`;
      }
      if (documentContent && documentType && documentName) {
        userMessage.document = { type: documentType, name: documentName };
      }

      setMessages((prev) => [...prev, userMessage]);

      await mutation.mutateAsync(payload);
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
