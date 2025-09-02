'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { AIAPI } from '@/lib/api/api-types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Button } from '../ui/button';
import { useToast } from '@/lib/hooks/useToast';
import AiChartRenderer from './ai-chart-renderer';
import AiTransactionPreview from '@/components/transactions/ai-transaction-preview';
import AiRecordsTable from './ai-records-table';
import AiMetricsDisplay from './ai-metrics-display';
import { Icon } from '@/components/ui/icon';
import { format } from 'date-fns';

interface ChatMessage extends AIAPI.ParsedAIResponse {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
  image?: string;
  document?: { name: string; type: 'pdf' | 'xlsx' };
}

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
            <Icon name='ai' className='h-4 w-4' />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'relative w-auto max-w-[85%] space-y-1 rounded-2xl px-4 py-3 shadow-sm max-sm:px-2 max-sm:py-2 sm:max-w-[80%]',
          'min-w-0',
          isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none'
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
              <Icon name='check' className='h-3.5 w-3.5 text-green-500' />
            ) : (
              <Icon name='clipboardCopy' className='h-3.5 w-3.5' />
            )}
          </Button>
        )}

        {message.image && (
          <div className='relative mb-2 aspect-video w-full max-w-xs overflow-hidden rounded-lg'>
            <Image src={message.image} alt='Uploaded content' layout='fill' objectFit='cover' />
          </div>
        )}

        {message.document && (
          <div className='bg-muted/50 mb-2 flex items-center gap-3 rounded-lg border p-3'>
            <Icon name='fileText' className='text-muted-foreground h-6 w-6 shrink-0' />
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium'>{message.document.name}</p>
              <p className='text-muted-foreground text-xs uppercase'>{message.document.type}</p>
            </div>
          </div>
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

        {message.chart && (
          <div className='mt-2'>
            <AiChartRenderer chart={message.chart} />
          </div>
        )}

        {message.records && message.records.length > 0 && (
          <div className='mt-2'>
            <AiRecordsTable records={message.records} />
          </div>
        )}

        {message.metrics && Object.keys(message.metrics).length > 0 && (
          <div className='mt-2'>
            <AiMetricsDisplay metrics={message.metrics} />
          </div>
        )}

        {message.imageAnalysisData && message.imageAnalysisData.length > 0 && (
          <div className='mt-2'>
            <AiTransactionPreview transactions={message.imageAnalysisData} />
          </div>
        )}

        {message.createdAt && !isStreaming && (
          <p className='pt-1 text-right text-[10px] opacity-70'>
            {format(message.createdAt, 'h:mm a')}
          </p>
        )}
      </div>
      {isUser && (
        <Avatar className='h-8 w-8 shrink-0 border'>
          <AvatarFallback>
            <Icon name='user' className='h-4 w-4' />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
