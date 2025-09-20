// src/components/ai/chat-message-bubble.tsx

'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Icon } from '@/components/ui/icon';
import type { MyUIMessage } from '@/lib/ai-types';
import { Response } from '@/components/ai-elements/response';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { AiToolDisplay } from './ai-tool-display';
import AiChartRenderer from './ai-chart-renderer';
import AiTransactionPreview from '@/components/transactions/ai-transaction-preview';
import AiRecordsTable from './ai-records-table';
import AiMetricsDisplay from './ai-metrics-display';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';

interface ChatMessageBubbleProps {
  message: MyUIMessage;
  isStreaming?: boolean;
}

const getFileIcon = (mediaType: string) => {
  if (mediaType?.startsWith('image/')) return 'image';
  if (mediaType?.includes('pdf')) return 'fileText';
  if (mediaType?.includes('spreadsheet') || mediaType?.includes('excel')) return 'fileSpreadsheet';
  return 'file';
};

const ChatMessageBubbleImpl: React.FC<ChatMessageBubbleProps> = ({
  message,
  isStreaming = false
}) => {
  const isUser = message.role === 'user';
  const { showSuccess, showError } = useToast();
  const [copied, setCopied] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());

  const allTextContent = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join('\n\n');

  const mainTextContent = allTextContent.split('Next actions:')[0].trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mainTextContent);
      setCopied(true);
      showSuccess('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Failed to copy');
    }
  };

  const handleImageError = (index: number) => {
    setImageLoadErrors((prev) => new Set(prev).add(index));
  };

  const sources = message.parts.filter(
    (part): part is Extract<MyUIMessage['parts'][number], { type: 'source-url' }> =>
      part.type === 'source-url'
  );
  const hasTextContent = mainTextContent.length > 0;
  const textPartIndex = message.parts.findIndex((p) => p.type === 'text');

  return (
    <div
      className={cn(
        'group relative flex w-full items-start gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar
        className={cn(
          'h-8 w-8 shrink-0 border shadow-sm',
          isUser ? 'border-primary/20' : 'border-slate-200 dark:border-slate-700'
        )}
      >
        <AvatarFallback
          className={cn(
            isUser ? 'bg-primary text-primary-foreground' : 'bg-slate-100 dark:bg-slate-800'
          )}
        >
          <Icon name={isUser ? 'user' : 'ai'} className='h-4 w-4' />
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'relative flex-1 space-y-3',
          isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'
        )}
      >
        {message.parts.map((part, index) => {
          const partKey = `${message.id}-${part.type}-${index}`;

          if (part.type.startsWith('tool-')) {
            const toolPart = part as MyUIMessage['parts'][number] & {
              type: `tool-${string}`;
            };

            if (toolPart.state === 'output-available' && toolPart.output.success) {
              switch (toolPart.type) {
                case 'tool-generateChartData':
                  if (toolPart.output.data) {
                    return <AiChartRenderer key={partKey} chart={toolPart.output.data} />;
                  }
                  break;
                case 'tool-fetchDataRecords':
                  if (toolPart.output.data) {
                    return <AiRecordsTable key={partKey} records={toolPart.output.data.records} />;
                  }
                  break;
                case 'tool-calculateMetrics':
                  if (toolPart.output.data) {
                    return (
                      <AiMetricsDisplay key={partKey} metrics={toolPart.output.data.metrics} />
                    );
                  }
                  break;
                case 'tool-analyzeFinancialImage':
                  if (toolPart.output.data) {
                    return (
                      <AiTransactionPreview key={partKey} transactions={toolPart.output.data} />
                    );
                  }
                  break;
              }
            }
            return <AiToolDisplay key={partKey} tool={toolPart as any} />;
          }

          switch (part.type) {
            case 'step-start':
              return index > 0 ? (
                <div key={partKey} className='w-full'>
                  <hr className='border-border/50 my-2' />
                </div>
              ) : null;

            case 'text':
              if (index === textPartIndex && hasTextContent) {
                return (
                  <div
                    key={partKey}
                    className={cn(
                      'relative w-fit max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                      isUser
                        ? 'bg-primary/80 text-primary-foreground ml-auto rounded-tr-sm'
                        : 'rounded-tl-sm border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                    )}
                  >
                    {!isUser && !isStreaming && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className={cn(
                          'absolute -top-1 -right-1 h-7 w-7 rounded-full border border-slate-200 bg-white opacity-0 shadow-sm transition-all group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900',
                          'hover:bg-slate-50 dark:hover:bg-slate-800'
                        )}
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
                    <Response>
                      {`${mainTextContent}${
                        isStreaming && index === message.parts.length - 1 ? '▍' : ''
                      }`}
                    </Response>
                  </div>
                );
              }
              return null;

            case 'file':
              const isImage = part.mediaType?.startsWith('image/');
              const hasError = imageLoadErrors.has(index);
              return (
                <div
                  key={partKey}
                  className={cn(
                    'overflow-hidden rounded-lg border bg-white dark:bg-slate-900',
                    'border-slate-200 dark:border-slate-700',
                    'transition-all hover:shadow-md'
                  )}
                >
                  {isImage && !hasError ? (
                    <div className='relative aspect-video w-full bg-slate-50 dark:bg-slate-800/50'>
                      <Image
                        src={part.url}
                        alt={part.filename || 'Uploaded image'}
                        fill
                        className='object-cover'
                        onError={() => handleImageError(index)}
                      />
                    </div>
                  ) : (
                    <div className='flex items-center gap-3 p-3'>
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                          'bg-slate-100 dark:bg-slate-800'
                        )}
                      >
                        <Icon
                          name={getFileIcon(part.mediaType || '')}
                          className='h-5 w-5 text-slate-600 dark:text-slate-400'
                        />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium text-slate-900 dark:text-slate-100'>
                          {part.filename || 'Unnamed file'}
                        </p>
                        <p className='text-xs text-slate-500 dark:text-slate-400'>
                          {part.mediaType?.split('/')[1]?.toUpperCase() || 'FILE'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );

            case 'reasoning':
              return (
                <Reasoning
                  key={partKey}
                  isStreaming={isStreaming && index === message.parts.length - 1}
                  className='w-full'
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              );

            case 'data-chart':
              return <AiChartRenderer key={partKey} chart={part.data} />;
            case 'data-records':
              return <AiRecordsTable key={partKey} records={part.data.records} />;
            case 'data-metrics':
              return <AiMetricsDisplay key={partKey} metrics={part.data.metrics} />;
            case 'data-imageAnalysisData':
              return <AiTransactionPreview key={partKey} transactions={part.data} />;

            case 'source-url':
              return null;

            default:
              return null;
          }
        })}

        {sources.length > 0 && (
          <Sources>
            <SourcesTrigger count={sources.length} />
            <SourcesContent>
              {sources.map((source, i) => (
                <Source
                  key={`${message.id}-source-${i}`}
                  href={source.url}
                  title={source.title || source.url}
                />
              ))}
            </SourcesContent>
          </Sources>
        )}
      </div>
    </div>
  );
};

export const ChatMessageBubble = memo(ChatMessageBubbleImpl, (prev, next) => {
  return (
    prev.isStreaming === next.isStreaming &&
    prev.message.id === next.message.id &&
    prev.message === next.message
  );
});
