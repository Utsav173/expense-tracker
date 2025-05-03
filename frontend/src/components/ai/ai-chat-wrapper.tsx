'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AiChatTrigger } from './ai-chat-trigger';
import { useAuth } from '@/lib/hooks/useAuth'; // Import useAuth

const AI_CHAT_ALLOWED_PATHS = [
  '/dashboard',
  '/',
  '/transactions',
  '/budget',
  '/goal',
  '/investment',
  '/debts'
];

const AI_CHAT_DETAIL_PATH_REGEX =
  /^\/(accounts|investment)\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const AiChatWrapper = () => {
  const pathname = usePathname();
  const { user, userIsLoading } = useAuth(); // Get user and loading state

  // Determine if the path allows the chat bubble
  const isPathAllowed =
    AI_CHAT_ALLOWED_PATHS.includes(pathname) || AI_CHAT_DETAIL_PATH_REGEX.test(pathname);

  // Determine if the bubble should be shown based on path AND API key status
  // Don't show while user data is loading
  const showAiChatBubble = !userIsLoading && isPathAllowed && !!user?.hasAiApiKey;

  return showAiChatBubble ? <AiChatTrigger /> : null;
};
