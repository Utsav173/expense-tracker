'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/components/ai/hooks/useAiChat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, ClipboardCopy, Check } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Button } from '../ui/button';
import { useToast } from '@/lib/hooks/useToast';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isStreaming = false
}) => {
  const isUser = message.role === 'user';
  const { showSuccess } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(message.content)
      .then(() => {
        setCopied(true);
        showSuccess('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error('Failed to copy text: ', err));
  };

  return (
    <div
      className={cn(
        'group relative flex w-full items-start space-x-4 max-sm:space-x-2',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className='h-8 w-8 shrink-0 border'>
          <AvatarFallback className='bg-muted'>
            <Bot className='h-4 w-4' />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'relative w-auto max-w-[85%] space-y-1 rounded-2xl px-4 py-3 shadow-sm max-sm:px-2 max-sm:py-2 sm:max-w-[80%]',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-card rounded-bl-none border'
        )}
      >
        {!isUser && message.content && !isStreaming && (
          <Button
            variant='ghost'
            size='icon'
            className='hover:bg-accent/50 absolute top-1 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-70 hover:opacity-100'
            onClick={handleCopy}
            aria-label='Copy message'
          >
            {copied ? (
              <Check className='h-3.5 w-3.5 text-green-500' />
            ) : (
              <ClipboardCopy className='h-3.5 w-3.5' />
            )}
          </Button>
        )}

        <div
          className={cn(
            'prose prose-sm dark:prose-invert prose-p:my-1 max-w-none break-words',
            isUser && 'prose-p:text-primary-foreground prose-strong:text-primary-foreground'
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {message.content}
          </ReactMarkdown>
          {isStreaming && <span className='ml-1 inline-block h-4 w-1 animate-pulse bg-current' />}
        </div>

        {message.createdAt && !isStreaming && (
          <p className='pt-1 text-right text-[10px] opacity-70'>
            {format(message.createdAt, 'h:mm a')}
          </p>
        )}
      </div>
      {isUser && (
        <Avatar className='h-8 w-8 shrink-0 border'>
          <AvatarFallback>
            <User className='h-4 w-4' />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
