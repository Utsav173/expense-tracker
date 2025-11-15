'use client';

import React, { useState, memo, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Icon } from '@/components/ui/icon';
import type { MyUIMessage, MyCustomData } from '@/lib/ai-types';
import type { UIMessagePart, ToolUIPart } from 'ai';
import { Response } from '@/components/ai-elements/response';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { AiToolDisplay, getToolName } from './ai-tool-display';
import AiChartRenderer from './ai-chart-renderer';
import AiTransactionPreview from '@/components/transactions/ai-transaction-preview';
import AiRecordsTable from './ai-records-table';
import AiMetricsDisplay from './ai-metrics-display';
import AiFinancialHealthDisplay from './ai-financial-health-display';
import AiSubscriptionDisplay from './ai-subscription-display';
import AiClarificationOptionsDisplay from './ai-clarification-options-display';
import AiStockSearchResultsDisplay from './ai-stock-search-results-display';
import AiIpoLinkDisplay from './ai-ipo-link-display';
import AiCreatedEntitySummaryDisplay from './ai-created-entity-summary-display';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { IconName } from '../ui/icon-map';
import { MyToolTypes } from '@/lib/ai-tool-types';

export interface ChatMessageConfig {
  showToolExecution?: boolean;
  showToolExecutionOnErrorOnly?: boolean;
  showEmptyState?: boolean;
}

const DEFAULT_CONFIG: Required<ChatMessageConfig> = {
  showToolExecution: true,
  showToolExecutionOnErrorOnly: false,
  showEmptyState: true
};

type FilePart = Extract<UIMessagePart<MyCustomData, MyToolTypes>, { type: 'file' }>;
type ToolPart = ToolUIPart<MyToolTypes>;
type DataPart = (Extract<
  UIMessagePart<MyCustomData, MyToolTypes>,
  | { type: 'data-chart' }
  | { type: 'data-records' }
  | { type: 'data-metrics' }
  | { type: 'data-imageAnalysisData' }
  | { type: 'data-financialHealthAnalysis' }
  | { type: 'data-subscriptionAnalysis' }
  | { type: 'data-clarificationOptions' }
  | { type: 'data-stockSearchResults' }
  | { type: 'data-ipoLink' }
  | { type: 'data-createdEntitySummary' }
>) & { toolName?: string };
type SourceUrlPart = Extract<UIMessagePart<MyCustomData, MyToolTypes>, { type: 'source-url' }>;
type ReasoningPart = Extract<UIMessagePart<MyCustomData, MyToolTypes>, { type: 'reasoning' }>;

const getFileIcon = (mediaType: string): IconName => {
  if (mediaType?.startsWith('image/')) return 'image';
  if (mediaType?.includes('pdf')) return 'fileText';
  if (mediaType?.includes('spreadsheet') || mediaType?.includes('excel')) return 'fileSpreadsheet';
  return 'file';
};

const isToolPart = (part: UIMessagePart<MyCustomData, MyToolTypes>): part is ToolPart => {
  return part.type.startsWith('tool-') || part.type === 'dynamic-tool';
};

const isDataPart = (part: UIMessagePart<MyCustomData, MyToolTypes>): part is DataPart => {
  return part.type.startsWith('data-');
};

const isSourceUrlPart = (part: UIMessagePart<MyCustomData, MyToolTypes>): part is SourceUrlPart => {
  return part.type === 'source-url';
};

type RenderableDataType = 'data-records' | 'data-chart' | 'data-metrics' | 'data-imageAnalysisData' | 'data-financialHealthAnalysis' | 'data-subscriptionAnalysis' | 'data-clarificationOptions' | 'data-stockSearchResults' | 'data-ipoLink' | 'data-createdEntitySummary';

const getRenderableDataType = (part: UIMessagePart<MyCustomData, MyToolTypes>): RenderableDataType | null => {
  if (isToolPart(part) && part.state === 'output-available' && part.output?.success) {
    if (typeof part.output === 'object' && part.output !== null && 'data' in part.output && part.output.data !== undefined) {
      const data = part.output.data;
      if (data && typeof data === 'object') {
        if ('records' in data && Array.isArray(data.records)) return 'data-records';
        if ('chart' in data && typeof data.chart === 'object') return 'data-chart';
        if ('metrics' in data && typeof data.metrics === 'object') return 'data-metrics';
        if ('transactions' in data && Array.isArray(data.transactions)) return 'data-imageAnalysisData';
        if ('analysis' in data && typeof data.analysis === 'object') return 'data-financialHealthAnalysis';
        if ('subscriptions' in data && Array.isArray(data.subscriptions)) return 'data-subscriptionAnalysis';
        if ('options' in data && Array.isArray(data.options)) return 'data-clarificationOptions';
        if ('results' in data && Array.isArray(data.results)) return 'data-stockSearchResults';
        if ('url' in data && typeof data.url === 'string' && data.url.startsWith('http')) return 'data-ipoLink';
        if ('entity' in data && typeof data.entity === 'object') return 'data-createdEntitySummary';
      }
    }
  }
  return null;
};

const hasVisibleContent = (parts: MyUIMessage['parts']): boolean => {

  return parts.some(

    (part) =>

      part.type === 'text' ||

      part.type === 'file' ||

      part.type === 'reasoning' ||

      isDataPart(part) ||

      getRenderableDataType(part) !== null ||

      (isToolPart(part) && part.state === 'output-available' && part.output?.success === false)

  );

};

const groupParts = (parts: MyUIMessage['parts']) => {
  if (!parts.length) return [];

  const grouped: Array<{
    type: string;
    content?: string[];
    part?: UIMessagePart<MyCustomData, MyToolTypes>;
    originalIndex: number;
  }> = [];

  let textBuffer: string[] = [];
  let textStartIndex = -1;

  const flushTextBuffer = () => {
    if (textBuffer.length > 0) {
      grouped.push({
        type: 'text',
        content: [...textBuffer],
        originalIndex: textStartIndex
      });
      textBuffer = [];
      textStartIndex = -1;
    }
  };

  parts.forEach((part, index) => {
    if (part.type === 'text') {
      if (textBuffer.length === 0) {
        textStartIndex = index;
      }
      textBuffer.push((part as { type: 'text'; text: string }).text);
    } else {
      flushTextBuffer();
      const renderableType = getRenderableDataType(part);
      if (renderableType) {
        // Re-narrow 'part' here to safely access output.data
        const toolOutputPart = part as ToolUIPart<MyToolTypes> & { state: 'output-available'; output: { success: true; data: MyCustomData } };

        const syntheticDataPart: DataPart = {
          type: renderableType,
          data: toolOutputPart.output.data,
          toolName: getToolName(toolOutputPart)
        };
        grouped.push({ type: renderableType, part: syntheticDataPart, originalIndex: index });
      } else {
        grouped.push({ type: part.type, part, originalIndex: index });
      }
    }
  });

  flushTextBuffer();
  return grouped;
};

const TextPartBubble: React.FC<{
  content: string[];
  isUser: boolean;
  isStreaming: boolean;
}> = memo(({ content, isUser, isStreaming }) => {
  const { showSuccess, showError } = useToast();
  const [copied, setCopied] = useState(false);
  const fullText = content.join('');

  if (!fullText.trim()) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      showSuccess('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Failed to copy');
    }
  };

  return (
    <div
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
      <Response>{`${fullText}${isStreaming ? '▍' : ''}`}</Response>
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

const CustomToolResult: React.FC<{ part: DataPart }> = memo(({ part }) => {
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
        <AiClarificationOptionsDisplay options={part.data} message={'Please select an option:'} />
      );
    case 'data-stockSearchResults':
      return <AiStockSearchResultsDisplay results={part.data} />;
    case 'data-ipoLink':
      return <AiIpoLinkDisplay url={part.data} />;
    case 'data-createdEntitySummary':
      return <AiCreatedEntitySummaryDisplay entity={part.data} />;
    default:
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unknown data part type:', part);
      }
      return null;
  }
});
CustomToolResult.displayName = 'CustomToolResult';

interface ChatMessageBubbleProps {
  message: MyUIMessage;
  isStreaming?: boolean;
  user: any;
  config?: ChatMessageConfig;
}

const ChatMessageBubbleImpl: React.FC<ChatMessageBubbleProps> = ({
  message,
  isStreaming = false,
  user,
  config
}) => {
  const isUser = message.role === 'user';
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const toolsWithCustomResults = useMemo(() => {
    const map = new Map<string, DataPart>();
    message.parts.forEach((part) => {
      if (isDataPart(part)) {
        const toolName =
          (part as { type: string; data: unknown; toolName?: string }).toolName ||
          part.type.replace('data-', '');
        map.set(toolName, part);
      }
    });
    return map;
  }, [message.parts]);

  const genericToolDisplays = useMemo(() => {
    if (!mergedConfig.showToolExecution) {
      return [];
    }

    const toolParts = message.parts.filter(isToolPart);

    return toolParts.filter((toolPart) => {
      const toolName = getToolName(toolPart);
      const hasCustomDataPart = toolsWithCustomResults.has(toolName);
      const renderableType = getRenderableDataType(toolPart);

      if (mergedConfig.showToolExecutionOnErrorOnly) {
        return toolPart.state === 'output-error';
      }

      if (toolPart.state === 'input-streaming') {
        return true;
      }

      if (toolPart.state === 'output-error') {
        return true;
      }

      if (toolPart.state === 'output-available') {
        // If the tool output is available and successful, we don't show generic display.
        // If it's available but NOT successful (i.e., an error), we DO show generic display.
        if (toolPart.output?.success) {
          return false;
        } else {
          return true;
        }
      }

      return true;
    });
  }, [message.parts, toolsWithCustomResults, mergedConfig]);

  const sources = useMemo(() => message.parts.filter(isSourceUrlPart), [message.parts]);
  const groupedParts = useMemo(() => groupParts(message.parts), [message.parts]);
  const hasContent = useMemo(() => hasVisibleContent(message.parts), [message.parts]);

  const shouldShowEmptyState =
    !isUser &&
    !hasContent &&
    genericToolDisplays.length === 0 &&
    !isStreaming &&
    mergedConfig.showEmptyState;

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
        {isUser && user?.image && <AvatarImage src={user.image} alt={user.name || 'User'} />}
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
        {groupedParts.map((group, groupIndex) => {
          const key = `${message.id}-${group.type}-${group.originalIndex}`;
          const isLastGroup = groupIndex === groupedParts.length - 1;

          switch (group.type) {
            case 'text':
              return (
                <TextPartBubble
                  key={key}
                  content={group.content!}
                  isUser={isUser}
                  isStreaming={isStreaming && isLastGroup}
                />
              );

            case 'file':
              return <FilePartBubble key={key} part={group.part as FilePart} />;

            case 'reasoning':
              return (
                <Reasoning
                  key={key}
                  isStreaming={isStreaming && isLastGroup}
                  className='w-full max-w-2xl'
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{(group.part as ReasoningPart).text}</ReasoningContent>
                </Reasoning>
              );

            case 'step-start':
              return groupIndex > 0 ? (
                <div key={key} className='w-full max-w-2xl'>
                  <hr className='border-border/50 my-3' />
                </div>
              ) : null;

            case 'data-chart':
            case 'data-records':
            case 'data-metrics':
            case 'data-imageAnalysisData':
            case 'data-financialHealthAnalysis':
            case 'data-subscriptionAnalysis':
              return (
                <div key={key} className='w-full max-w-4xl'>
                  <CustomToolResult part={group.part as DataPart} />
                </div>
              );

            default:
              if (group.part && (isToolPart(group.part) || isSourceUrlPart(group.part))) {
                return null;
              }
              return null;
          }
        })}

        {genericToolDisplays.length > 0 && (
          <div className='w-full max-w-2xl space-y-2'>
            {genericToolDisplays.map((toolPart, idx) => (
              <AiToolDisplay
                key={`${message.id}-tool-${getToolName(toolPart)}-${idx}`}
                tool={toolPart}
              />
            ))}
          </div>
        )}

        {shouldShowEmptyState && (
          <div
            className={cn(
              'w-fit max-w-[85%] rounded-2xl rounded-tl-sm border px-4 py-3 text-sm',
              'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900/50'
            )}
          >
            <div className='flex items-center gap-2'>
              <Icon name='loader2' className='h-3.5 w-3.5 animate-spin' />
              <span>Processing...</span>
            </div>
          </div>
        )}

        {sources.length > 0 && !isUser && (
          <div className='w-full max-w-2xl'>
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
          </div>
        )}
      </div>
    </div>
  );
};

export const ChatMessageBubble = memo(ChatMessageBubbleImpl, (prev, next) => {
  if (prev.message.id !== next.message.id) return false;
  if (prev.isStreaming !== next.isStreaming) return false;
  if (prev.message.parts.length !== next.message.parts.length) return false;

  if (JSON.stringify(prev.config) !== JSON.stringify(next.config)) return false;

  if (next.isStreaming) {
    const prevLast = prev.message.parts[prev.message.parts.length - 1];
    const nextLast = next.message.parts[next.message.parts.length - 1];
    return JSON.stringify(prevLast) === JSON.stringify(nextLast);
  }

  return JSON.stringify(prev.message.parts) === JSON.stringify(next.message.parts);
});

ChatMessageBubble.displayName = 'ChatMessageBubble';
