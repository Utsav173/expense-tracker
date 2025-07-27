'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiProcessPrompt } from '@/lib/endpoints/ai';
import { useInvalidateQueries } from '../../../hooks/useInvalidateQueries';
import { useToast } from '@/lib/hooks/useToast';

const STORAGE_KEY_MESSAGES = 'aiChatMessages';
const STORAGE_KEY_SESSION_ID = 'aiChatSessionId';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
}

interface UseAiChatReturn {
  messages: ChatMessage[];
  sendMessage: (prompt: string) => Promise<void>;
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

  const streamResponse = useCallback((fullMessage: ChatMessage) => {
    setIsStreaming(true);
    let i = 0;
    const fullResponseText = fullMessage.content;

    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    typingIntervalRef.current = setInterval(() => {
      setMessages((currentMessages) => {
        const newMessages = [...currentMessages];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1].content = fullResponseText.slice(0, i + 1);
        }
        return newMessages;
      });
      i++;
      if (i > fullResponseText.length) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setIsStreaming(false);
        setMessages((currentMessages) => {
          const newMessages = [...currentMessages];
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].id === fullMessage.id) {
            newMessages[newMessages.length - 1] = fullMessage; // Set final rich data
          }
          return newMessages;
        });
      }
    }, 15);
  }, []);

  const processApiResponse = (data: any) => {
    const fullResponse = data?.response ?? 'Sorry, I encountered an issue.';
    const newSessionId = data?.sessionId;

    if (newSessionId && newSessionId !== sessionId) {
      setSessionId(newSessionId);
    }

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '', // Start empty for streaming
      createdAt: new Date()
    };

    // Create a version of the message with the full content for the stream function
    const finalMessage = { ...assistantMessage, content: fullResponse };

    setMessages((prev) => [...prev, assistantMessage]);
    streamResponse(finalMessage);

    const actionKeywords = ['added', 'created', 'updated', 'deleted', 'set', 'modified', 'paid'];
    if (actionKeywords.some((keyword) => fullResponse.toLowerCase().includes(keyword))) {
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
    mutationFn: (prompt: string) => aiProcessPrompt({ prompt, sessionId }),
    onSuccess: processApiResponse,
    onError: (err: Error) => {
      setError(err);
      setMessages((prev) => prev.slice(0, -1));
    }
  });

  const sendMessage = useCallback(
    async (prompt: string) => {
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

      await mutation.mutateAsync(prompt);
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
