'use client';
import { usePathname } from 'next/navigation';
import { AiChatTrigger } from './ai-chat-trigger';
import { useAuth } from '@/components/providers/auth-provider';

const AI_CHAT_ALLOWED_PATHS = [
  '/dashboard',
  '/accounts',
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
  const { session, isLoading: userIsLoading } = useAuth();
  const user = session?.user;

  const isPathAllowed =
    AI_CHAT_ALLOWED_PATHS.includes(pathname) || AI_CHAT_DETAIL_PATH_REGEX.test(pathname);

  const showAiChatBubble = !userIsLoading && isPathAllowed && !!user?.hasAiApiKey;

  return showAiChatBubble ? <AiChatTrigger /> : null;
};
