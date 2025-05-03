import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiProcessPrompt } from '@/lib/endpoints/ai';
import { toast } from 'react-hot-toast';

const STORAGE_KEY_MESSAGES = 'aiChatMessages';
const STORAGE_KEY_SESSION_ID = 'aiChatSessionId';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: { toolCallId: string; toolName: string; args: any }[];
  toolResults?: { toolCallId: string; result: any }[];
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
      if (data?.response !== undefined) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response ?? '',
          toolCalls: data.toolCalls,
          toolResults: data.toolResults,
          createdAt: new Date()
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (data.sessionId && data.sessionId !== sessionId) {
          setSessionId(data.sessionId);
        }
      } else {
        console.warn('Received success response but no AI message content.');

        setError(new Error('Received an empty response from the AI assistant.'));

        setMessages((prev) => prev.slice(0, -1));
      }
    },
    onError: (err: Error) => {
      console.error('AI processing error:', err);
      setError(err);

      setMessages((prev) => {
        const lastUserIndex = prev.map((m) => m.role).lastIndexOf('user');
        if (lastUserIndex > -1) {
          return prev.slice(0, lastUserIndex);
        }
        return prev;
      });
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
    [mutation, sessionId]
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
