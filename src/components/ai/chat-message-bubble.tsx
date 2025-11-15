'use client';

import React, { useState, memo, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Icon } from '@/components/ui/icon';
import type { MyUIMessage, MyCustomData } from '@/lib/ai-types';
import type { UIMessagePart } from 'ai';
import { Response } from '@/components/ai-elements/response';
import AiChartRenderer from '@/components/ai/ai-chart-renderer';
import AiTransactionPreview from '@/components/transactions/ai-transaction-preview';
import AiRecordsTable from './ai-records-table';
import AiMetricsDisplay from './ai-metrics-display';
import AiFinancialHealthDisplay from './ai-financial-health-display';
import AiSubscriptionDisplay from './ai-subscription-display';
import AiClarificationOptionsDisplay from './ai-clarification-options-display';
import AiStockSearchResultsDisplay from './ai-stock-search-results-display';
import AiIpoLinkDisplay from './ai-ipo-link-display';
import AiCreatedEntitySummaryDisplay from './ai-created-entity-summary-display';
import { IconName } from '../ui/icon-map';
import { MyToolTypes } from '@/lib/ai-tool-types';

type FilePart = Extract<UIMessagePart<MyCustomData, MyToolTypes>, { type: 'file' }>;
type DataPartType = keyof MyCustomData;
type DataPart = UIMessagePart<MyCustomData, MyToolTypes> & { type: `data-${DataPartType}` };

interface ChatMessageBubbleProps {
  message: MyUIMessage;
  isStreaming?: boolean;
  user: any;
}

const getFileIcon = (mediaType: string): IconName => {
  if (mediaType?.startsWith('image/')) return 'image';
  if (mediaType?.includes('pdf')) return 'fileText';
  if (mediaType?.includes('spreadsheet') || mediaType?.includes('excel')) return 'fileSpreadsheet';
  return 'file';
};

const TextPartBubble: React.FC<{
  content: string;
  isUser: boolean;
  isStreaming: boolean;
}> = memo(({ content, isUser, isStreaming }) => {
  const { showSuccess, showError } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      showSuccess('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Failed to copy');
    }
  };

  if (!content && !isStreaming) return null;

  return (
    <div
      className={cn(
        'relative w-fit max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
        isUser
          ? 'bg-primary/80 text-primary-foreground ml-auto rounded-tr-sm'
          : 'rounded-tl-sm border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
      )}
    >
      {!isUser && !isStreaming && content && (
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
      <Response>{`${content}${isStreaming ? '▍' : ''}`}</Response>
    </div>
  );
});
TextPartBubble.displayName = 'TextPartBubble';

const FilePartBubble: React.FC<{ part: FilePart }> = memo(({ part }) => {
  const [hasError, setHasError] = useState(false);
  const isImage = part.mediaType?.startsWith('image/');

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-white dark:bg-slate-900',
        'border-slate-200 dark:border-slate-700',
        'max-w-md transition-all hover:shadow-md'
      )}
    >
      {isImage && !hasError ? (
        <div className='relative aspect-video w-full bg-slate-50 dark:bg-slate-800/50'>
          <Image
            src={part.url}
            alt={part?.filename || 'Uploaded image'}
            fill
            className='object-cover'
            onError={() => setHasError(true)}
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
});
FilePartBubble.displayName = 'FilePartBubble';

const CustomDataDisplay: React.FC<{ part: DataPart }> = memo(({ part }) => {
  switch (part.type) {
    case 'data-chart':
      return <AiChartRenderer chart={part.data} />;
    case 'data-records':
      return <AiRecordsTable records={part.data.records} />;
    case 'data-metrics':
      return <AiMetricsDisplay metrics={part.data.metrics} />;
    case 'data-imageAnalysisData':
      return <AiTransactionPreview transactions={part.data} />;
    case 'data-financialHealthAnalysis':
      return <AiFinancialHealthDisplay analysis={part.data} />;
    case 'data-subscriptionAnalysis':
      return <AiSubscriptionDisplay subscriptions={part.data.subscriptions} />;
    case 'data-clarificationOptions':
      return (
        <AiClarificationOptionsDisplay options={part.data} message='Please select an option:' />
      );
    case 'data-stockSearchResults':
      return <AiStockSearchResultsDisplay results={part.data} />;
    case 'data-ipoLink':
      return <AiIpoLinkDisplay url={part.data} />;
    case 'data-createdEntitySummary':
      return <AiCreatedEntitySummaryDisplay entity={part.data} />;
    default:
      return null;
  }
});
CustomDataDisplay.displayName = 'CustomDataDisplay';

const ThinkingIndicator = () => (
  <div className='flex items-end justify-start space-x-3'>
    <div className='bg-muted flex items-center space-x-1.5 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm'>
      <div className='bg-muted-foreground h-2 w-2 animate-pulse rounded-full [animation-delay:-0.3s]'></div>
      <div className='bg-muted-foreground h-2 w-2 animate-pulse rounded-full [animation-delay:-0.15s]'></div>
      <div className='bg-muted-foreground h-2 w-2 animate-pulse rounded-full'></div>
    </div>
  </div>
);

const extractDataFromToolOutput = (output: any): { type: string; content: any } | null => {
  if (!output || typeof output !== 'object') return null;

  const data = output.data || output;

  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];

    if (firstItem.category && firstItem.amount) {
      return { type: 'data-chart', content: data };
    }
    if (firstItem.symbol) {
      return { type: 'data-stockSearchResults', content: data };
    }
    if (firstItem.date || firstItem.amount) {
      return { type: 'data-imageAnalysisData', content: data };
    }
    if (firstItem.name && firstItem.value !== undefined) {
      return { type: 'data-chart', content: data };
    }
  }

  if (data.subscriptions) {
    return { type: 'data-subscriptionAnalysis', content: data };
  }
  if (data.metrics) {
    return { type: 'data-metrics', content: data };
  }
  if (data.records) {
    return { type: 'data-records', content: data };
  }
  if (data.chart) {
    return { type: 'data-chart', content: data.chart };
  }
  if (data.analysis || data.healthScore !== undefined) {
    return { type: 'data-financialHealthAnalysis', content: data };
  }

  return null;
};

const ChatMessageBubbleImpl: React.FC<ChatMessageBubbleProps> = ({
  message,
  isStreaming = false,
  user
}) => {
  const isUser = message.role === 'user';

  const renderableParts = useMemo(() => {
    const result: Array<{ type: string; content: any; id: string }> = [];
    let textBuffer = '';
    let partCounter = 0;

    const flushText = () => {
      if (textBuffer.trim()) {
        result.push({
          type: 'text',
          content: textBuffer,
          id: `text-${partCounter++}`
        });
        textBuffer = '';
      }
    };

    if (message.parts && Array.isArray(message.parts)) {
      message.parts.forEach((part: any) => {
        if (part.type === 'text') {
          textBuffer += part.text || '';
        } else if (part.type.startsWith('data-')) {
          flushText();
          const dataPart = part as DataPart;
          result.push({
            type: part.type,
            content: dataPart.data,
            id: `${part.type}-${partCounter++}`
          });
        } else if (part.type === 'file') {
          flushText();
          result.push({
            type: 'file',
            content: part,
            id: `file-${partCounter++}`
          });
        } else if (part.type.startsWith('tool-')) {
          const toolPart = part as any;

          if (toolPart.state === 'output-available' && toolPart.output) {
            flushText();
            const extracted = extractDataFromToolOutput(toolPart.output);
            if (extracted) {
              result.push({
                type: extracted.type,
                content: extracted.content,
                id: `tool-${partCounter++}`
              });
            }
          }
        } else if (part.type === 'step-start') {
        }
      });
    }

    flushText();
    return result;
  }, [message.parts]);

  if (!isUser && renderableParts.length === 0 && !isStreaming) {
    return null;
  }

  return (
    <div
      className={cn(
        'group relative flex w-full items-start gap-3 py-2',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar
        className={cn(
          'h-8 w-8 shrink-0 border shadow-sm',
          isUser ? 'border-primary/20' : 'border-slate-200 dark:border-slate-700'
        )}
      >
        {isUser && user?.image ? <AvatarImage src={user.image} alt={user.name || 'User'} /> : null}
        <AvatarFallback
          className={cn(
            isUser ? 'bg-primary text-primary-foreground' : 'bg-slate-100 dark:bg-slate-800'
          )}
        >
          <Icon name={isUser ? 'user' : 'sparkles'} className='h-4 w-4' />
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'relative flex-1 space-y-3',
          isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'
        )}
      >
        {renderableParts.map((part, index) => {
          const key = `${message.id}-${part.id}-${index}`;
          const isLastPart = index === renderableParts.length - 1;

          switch (part.type) {
            case 'text':
              return (
                <TextPartBubble
                  key={key}
                  content={part.content}
                  isUser={isUser}
                  isStreaming={isStreaming && isLastPart}
                />
              );
            case 'file':
              return <FilePartBubble key={key} part={part.content} />;
            default:
              if (part.type.startsWith('data-')) {
                return (
                  <div key={key} className='w-full max-w-4xl'>
                    <CustomDataDisplay
                      part={{ type: part.type as DataPart['type'], data: part.content }}
                    />
                  </div>
                );
              }
              return null;
          }
        })}

        {isStreaming && renderableParts.length === 0 && <ThinkingIndicator />}
      </div>
    </div>
  );
};

export const ChatMessageBubble = memo(ChatMessageBubbleImpl, (prev, next) => {
  if (prev.message.id !== next.message.id) {
    return false;
  }

  if (prev.isStreaming !== next.isStreaming) {
    return false;
  }

  if (next.isStreaming) {
    const prevParts = prev.message.parts || [];
    const nextParts = next.message.parts || [];

    if (prevParts.length !== nextParts.length) {
      return false;
    }

    const prevLast = prevParts[prevParts.length - 1];
    const nextLast = nextParts[nextParts.length - 1];

    return JSON.stringify(prevLast) === JSON.stringify(nextLast);
  }

  return JSON.stringify(prev.message.parts) === JSON.stringify(next.message.parts);
});

ChatMessageBubble.displayName = 'ChatMessageBubble';
