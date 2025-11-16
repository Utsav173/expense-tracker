'use client';

import React, { useState, memo, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Icon } from '@/components/ui/icon';
import type {
  FileDataPart,
  MyUIMessage,
  MyUIMessagePart,
  RenderableDataPart,
  TextDataPart
} from '@/lib/ai-types';
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
import AiConfirmationDisplay from './ai-confirmation-display';
import AiGenericDataDisplay from './ai-generic-data-display';
import { IconName } from '../ui/icon-map';
import { tools as allToolsSchemas } from '@/lib/ai-tool-types';
import type { z } from 'zod';
import { User } from 'better-auth';

interface ChatMessageBubbleProps {
  message: MyUIMessage;
  isStreaming?: boolean;
  user: User | null;
  onConfirm?: (id: string) => void;
  onClarificationSelect?: (id: string) => void;
}

const getFileIcon = (mediaType: string): IconName => {
  if (mediaType?.startsWith('image/')) return 'image';
  if (mediaType?.includes('pdf')) return 'fileText';
  if (mediaType?.includes('spreadsheet') || mediaType?.includes('excel')) return 'fileSpreadsheet';
  return 'file';
};

const TextPartBubble = memo<{
  content: string;
  isUser: boolean;
  isStreaming: boolean;
}>(({ content, isUser, isStreaming }) => {
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

const FilePartBubble = memo<{
  part: Extract<MyUIMessagePart, { type: 'file' }>;
}>(({ part }) => {
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
            alt={part.filename || 'Uploaded image'}
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

interface ComponentConfig {
  Component: React.FC<any>;
  propName: string;
}

const dataComponentMap: Record<string, ComponentConfig> = {
  'data-chart': { Component: AiChartRenderer, propName: 'chart' },
  'data-records': { Component: AiRecordsTable, propName: 'records' },
  'data-metrics': { Component: AiMetricsDisplay, propName: 'metrics' },
  'data-imageAnalysisData': { Component: AiTransactionPreview, propName: 'transactions' },
  'data-financialHealthAnalysis': { Component: AiFinancialHealthDisplay, propName: 'analysis' },
  'data-subscriptionAnalysis': { Component: AiSubscriptionDisplay, propName: 'subscriptions' },
  'data-clarificationOptions': {
    Component: AiClarificationOptionsDisplay,
    propName: 'options'
  },
  'data-stockSearchResults': { Component: AiStockSearchResultsDisplay, propName: 'results' },
  'data-ipoLink': { Component: AiIpoLinkDisplay, propName: 'url' },
  'data-createdEntitySummary': { Component: AiCreatedEntitySummaryDisplay, propName: 'entity' },
  'data-confirmation': { Component: AiConfirmationDisplay, propName: 'confirmation' },
  json: { Component: AiGenericDataDisplay, propName: 'data' }
} as const;

const CustomDataDisplay = memo<{
  part: RenderableDataPart;
  onConfirm?: (id: string) => void;
  onSelect?: (id: string) => void;
}>(({ part, onConfirm, onSelect }) => {
  const config = dataComponentMap[part.type];

  if (!config) {
    console.warn(`No component found for type: ${part.type}`);
    return null;
  }

  const { Component, propName } = config;

  // Handle special cases
  if (part.type === 'data-clarificationOptions') {
    const clarificationPart = part as Extract<
      RenderableDataPart,
      { type: 'data-clarificationOptions' }
    >;
    if (Array.isArray(clarificationPart.content)) {
      return (
        <Component
          options={clarificationPart.content}
          message='Please select an option:'
          onSelect={onSelect}
        />
      );
    }
    return <Component {...clarificationPart.content} onSelect={onSelect} />;
  }

  if (part.type === 'data-confirmation') {
    const confirmationPart = part as Extract<RenderableDataPart, { type: 'data-confirmation' }>;
    return <Component confirmation={confirmationPart.content} onConfirm={onConfirm} />;
  }

  const props = { [propName]: part.content };
  return <Component {...props} />;
});
CustomDataDisplay.displayName = 'CustomDataDisplay';

const ThinkingIndicator = () => (
  <div className='flex items-center space-x-1.5 rounded-2xl rounded-bl-none border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
    <div className='h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:-0.3s] dark:bg-slate-600'></div>
    <div className='h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:-0.15s] dark:bg-slate-600'></div>
    <div className='h-2 w-2 animate-pulse rounded-full bg-slate-400 dark:bg-slate-600'></div>
  </div>
);

// Type guard helpers
const isObjectWithKey = <K extends string>(value: unknown, key: K): value is Record<K, unknown> => {
  return typeof value === 'object' && value !== null && key in value;
};

const hasSuccessField = (value: unknown): value is { success: boolean } => {
  return isObjectWithKey(value, 'success') && typeof value.success === 'boolean';
};

const hasTypeField = (value: unknown): value is { type: string } => {
  return isObjectWithKey(value, 'type') && typeof value.type === 'string';
};

/**
 * Extract structured data from tool outputs based on their schemas
 */
const extractDataFromToolOutput = (
  toolName: string,
  output: unknown
): RenderableDataPart | null => {
  if (!output || typeof output !== 'object') return null;

  const toolSchema = allToolsSchemas[toolName as keyof typeof allToolsSchemas]?.outputSchema;

  if (!toolSchema) {
    console.warn(`No output schema found for tool: ${toolName}`);
    return { type: 'json', content: output as Record<string, unknown>, id: crypto.randomUUID() };
  }

  const parsed = toolSchema.safeParse(output);

  if (!parsed.success) {
    console.error(`Failed to parse output for tool ${toolName}:`, parsed.error);
    return {
      type: 'text',
      content: `Error parsing ${toolName} output.`,
      id: crypto.randomUUID()
    };
  }

  const data = parsed.data;

  // Handle error responses (success: false)
  if (hasSuccessField(data) && data.success === false) {
    const errorMsg =
      isObjectWithKey(data, 'error') && typeof data.error === 'string'
        ? data.error
        : isObjectWithKey(data, 'message') && typeof data.message === 'string'
          ? data.message
          : `Error executing ${toolName}.`;
    return { type: 'text', content: errorMsg, id: crypto.randomUUID() };
  }

  // Handle confirmation needed responses
  if (
    isObjectWithKey(data, 'confirmationNeeded') &&
    data.confirmationNeeded === true &&
    isObjectWithKey(data, 'id') &&
    isObjectWithKey(data, 'details') &&
    isObjectWithKey(data, 'message') &&
    typeof data.id === 'string' &&
    typeof data.details === 'string' &&
    typeof data.message === 'string'
  ) {
    return {
      type: 'data-confirmation',
      content: {
        id: data.id,
        details: data.details,
        message: data.message
      },
      id: crypto.randomUUID()
    };
  }

  // Handle clarification needed responses (identifyBudgetForAction style)
  if (
    isObjectWithKey(data, 'clarificationNeeded') &&
    data.clarificationNeeded === true &&
    isObjectWithKey(data, 'options') &&
    isObjectWithKey(data, 'message') &&
    Array.isArray(data.options) &&
    typeof data.message === 'string'
  ) {
    return {
      type: 'data-clarificationOptions',
      content: {
        message: data.message,
        options: data.options as Array<{
          id: string;
          name?: string;
          description?: string;
          details?: string;
        }>
      },
      id: crypto.randomUUID()
    };
  }

  // Handle responses with explicit type field
  if (hasTypeField(data) && data.type.startsWith('data-')) {
    return {
      type: data.type,
      content: (isObjectWithKey(data, 'data') ? data.data : data) as Record<string, unknown>,
      id: crypto.randomUUID()
    };
  }

  // Handle clarification options (identifyAccountForAction style)
  if (
    hasSuccessField(data) &&
    data.success === true &&
    isObjectWithKey(data, 'data') &&
    Array.isArray(data.data)
  ) {
    const firstItem = data.data[0];
    if (
      firstItem &&
      typeof firstItem === 'object' &&
      'id' in firstItem &&
      ('name' in firstItem || 'description' in firstItem)
    ) {
      return {
        type: 'data-clarificationOptions',
        content: {
          message:
            isObjectWithKey(data, 'message') && typeof data.message === 'string'
              ? data.message
              : 'Please select an option:',
          options: data.data as Array<{
            id: string;
            name?: string;
            description?: string;
            details?: string;
          }>
        },
        id: crypto.randomUUID()
      };
    }
  }

  // Special handling for specific tools
  const specificHandlers: Record<
    string,
    (data: z.infer<typeof toolSchema>) => RenderableDataPart | null
  > = {
    generateChartData: (data) => {
      if (isObjectWithKey(data, 'data') && isObjectWithKey(data.data, 'data')) {
        return {
          type: 'data-chart',
          content: data.data as { type: string; data: Array<Record<string, unknown>> },
          id: crypto.randomUUID()
        };
      }
      return null;
    },

    fetchDataRecords: (data) => {
      if (isObjectWithKey(data, 'data') && isObjectWithKey(data.data, 'records')) {
        return {
          type: 'data-records',
          content: data.data as { records: Array<Record<string, unknown>>; count: number },
          id: crypto.randomUUID()
        };
      }
      return null;
    },

    calculateMetrics: (data) => {
      if (
        isObjectWithKey(data, 'data') &&
        isObjectWithKey(data.data, 'metrics') &&
        typeof data.data.metrics === 'object'
      ) {
        return {
          type: 'data-metrics',
          content: data.data.metrics as Record<string, unknown>,
          id: crypto.randomUUID()
        };
      }
      return null;
    },

    analyzeFinancialImage: (data) => {
      if (isObjectWithKey(data, 'data') && Array.isArray(data.data)) {
        return { type: 'data-imageAnalysisData', content: data.data, id: crypto.randomUUID() };
      }
      return null;
    },

    analyzeFinancialHealth: (data) => {
      if (isObjectWithKey(data, 'data')) {
        return {
          type: 'data-financialHealthAnalysis',
          content: data.data as Record<string, unknown>,
          id: crypto.randomUUID()
        };
      }
      return null;
    },

    findRecurringTransactions: (data) => {
      if (isObjectWithKey(data, 'data') && isObjectWithKey(data.data, 'subscriptions')) {
        return {
          type: 'data-subscriptionAnalysis',
          content: data.data.subscriptions,
          id: crypto.randomUUID()
        };
      }
      return null;
    },

    getExpenseBreakdown: (data) => {
      if (isObjectWithKey(data, 'data') && Array.isArray(data.data)) {
        return {
          type: 'data-records',
          content: { records: data.data, count: data.data.length },
          id: crypto.randomUUID()
        };
      }
      return null;
    },

    searchStockSymbols: (data) => {
      if (isObjectWithKey(data, 'data') && Array.isArray(data.data)) {
        return { type: 'data-stockSearchResults', content: data.data, id: crypto.randomUUID() };
      }
      return null;
    },

    getUpcomingIpos: (data) => {
      if (isObjectWithKey(data, 'data') && typeof data.data === 'string') {
        return { type: 'data-ipoLink', content: data.data, id: crypto.randomUUID() };
      }
      return null;
    },

    getHelpArticle: (data) => {
      if (isObjectWithKey(data, 'article') && typeof data.article === 'string') {
        return { type: 'text', content: data.article, id: crypto.randomUUID() };
      }
      return null;
    }
  };

  const handler = specificHandlers[toolName];
  if (handler) {
    const result = handler(data);
    if (result) return result;
  }

  // Handle simple success message responses
  if (hasSuccessField(data) && data.success === true && isObjectWithKey(data, 'message')) {
    const keys = Object.keys(data);
    const hasOnlyMessage =
      keys.length === 2 ||
      (keys.length === 3 && hasTypeField(data) && !data.type.startsWith('data-'));

    if (hasOnlyMessage && typeof data.message === 'string') {
      return { type: 'text', content: data.message, id: crypto.randomUUID() };
    }
  }

  // Try to extract data field if present
  if (isObjectWithKey(data, 'data') && data.data !== null && typeof data.data === 'object') {
    return { type: 'json', content: data.data as Record<string, unknown>, id: crypto.randomUUID() };
  }

  // Last resort: return as JSON if object
  if (typeof data === 'object' && data !== null && Object.keys(data).length > 0) {
    return { type: 'json', content: data as Record<string, unknown>, id: crypto.randomUUID() };
  }

  return null;
};

const ChatMessageBubbleImpl = ({
  message,
  isStreaming = false,
  user,
  onConfirm,
  onClarificationSelect
}: ChatMessageBubbleProps) => {
  const isUser = message.role === 'user';

  const renderableParts = useMemo((): RenderableDataPart[] => {
    const result: RenderableDataPart[] = [];
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

    if (!message.parts || !Array.isArray(message.parts)) {
      return result;
    }

    message.parts.forEach((part) => {
      // Text parts
      if (part.type === 'text') {
        textBuffer += part.text || '';
        return;
      }

      // File parts
      if (part.type === 'file') {
        flushText();
        result.push({
          type: 'file',
          content: {
            mediaType: part.mediaType || '',
            url: part.url,
            filename: part.filename
          },
          id: `file-${partCounter++}`
        });
        return;
      }

      // Data parts (custom)
      if (part.type?.startsWith('data-')) {
        flushText();
        result.push({
          type: part.type,
          content: ('data' in part ? part.data : 'content' in part ? part.content : {}) as Record<
            string,
            unknown
          >,
          id: `${part.type}-${partCounter++}`
        });
        return;
      }

      // Tool parts
      if (part.type?.startsWith('tool-')) {
        // Only process completed tool calls
        if (
          'state' in part &&
          part.state === 'output-available' &&
          'output' in part &&
          part.output
        ) {
          flushText();
          const toolName = part.type.replace('tool-', '');
          const extracted = extractDataFromToolOutput(toolName, part.output);

          if (extracted) {
            result.push(extracted);
          }
        }
        return;
      }

      // Step start parts (can be ignored)
      if (part.type === 'step-start') {
        flushText();
        return;
      }
    });

    flushText();
    return result;
  }, [message.parts]);

  // Don't render empty assistant messages
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
            case 'text': {
              const textPart = part as TextDataPart;
              return (
                <TextPartBubble
                  key={key}
                  content={textPart.content}
                  isUser={isUser}
                  isStreaming={isStreaming && isLastPart}
                />
              );
            }
            case 'file': {
              const filePart = part as FileDataPart;
              const filePartForComponent: Extract<MyUIMessagePart, { type: 'file' }> = {
                type: 'file',
                mediaType: filePart.content.mediaType,
                url: filePart.content.url,
                filename: filePart.content.filename
              };
              return <FilePartBubble key={key} part={filePartForComponent} />;
            }
            default:
              if (part.type.startsWith('data-') || part.type === 'json') {
                return (
                  <div key={key} className='w-full max-w-4xl'>
                    <CustomDataDisplay
                      part={part}
                      onConfirm={onConfirm}
                      onSelect={onClarificationSelect}
                    />
                  </div>
                );
              }
              return null;
          }
        })}

        {/* Show thinking indicator when streaming but no content yet */}
        {isStreaming && renderableParts.length === 0 && <ThinkingIndicator />}
      </div>
    </div>
  );
};

export const ChatMessageBubble = memo(ChatMessageBubbleImpl, (prev, next) => {
  if (prev.message.id !== next.message.id) return false;
  if (prev.isStreaming !== next.isStreaming) return false;

  if (next.isStreaming) {
    const prevParts = prev.message.parts || [];
    const nextParts = next.message.parts || [];
    if (prevParts.length !== nextParts.length) return false;

    const prevLast = prevParts[prevParts.length - 1];
    const nextLast = nextParts[nextParts.length - 1];
    return JSON.stringify(prevLast) === JSON.stringify(nextLast);
  }

  return JSON.stringify(prev.message.parts) === JSON.stringify(next.message.parts);
});

ChatMessageBubble.displayName = 'ChatMessageBubble';
