'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import 'highlight.js/styles/github-dark.css';
import { Button } from '../ui/button';
import { useToast } from '@/lib/hooks/useToast';
import AiChartRenderer from './ai-chart-renderer';
import AiTransactionPreview from '@/components/transactions/ai-transaction-preview';
import AiRecordsTable from './ai-records-table';
import AiMetricsDisplay from './ai-metrics-display';
import { Icon } from '@/components/ui/icon';
import type { MyUIMessage } from '@/lib/ai-types';

interface ChatMessageBubbleProps {
  message: MyUIMessage;
  isStreaming?: boolean;
}

// Helper to format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Helper to get file icon based on type
const getFileIcon = (mediaType: string) => {
  if (mediaType?.startsWith('image/')) return 'image';
  if (mediaType?.includes('pdf')) return 'fileText';
  if (mediaType?.includes('spreadsheet') || mediaType?.includes('excel')) return 'fileSpreadsheet';
  if (mediaType?.includes('document') || mediaType?.includes('word')) return 'fileText';
  return 'file';
};

// Enhanced code block with syntax highlighting
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');

  if (inline) {
    return (
      <code
        className={cn(
          'rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800',
          'text-slate-800 dark:text-slate-200',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  const lang = match?.[1]?.toUpperCase();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className='group relative my-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700'>
      {lang && (
        <div className='flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/50'>
          <span className='text-xs font-medium text-slate-600 dark:text-slate-400'>{lang}</span>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 opacity-60 hover:opacity-100'
            onClick={copy}
            aria-label='Copy code'
          >
            {copied ? (
              <Icon name='check' className='h-3.5 w-3.5 text-green-500' />
            ) : (
              <Icon name='clipboardCopy' className='h-3.5 w-3.5' />
            )}
          </Button>
        </div>
      )}
      <pre className={cn('overflow-x-auto p-4 text-sm', !lang && 'pt-2', className)} {...props}>
        <code>{children}</code>
      </pre>
      {!lang && (
        <Button
          variant='ghost'
          size='icon'
          className='absolute top-2 right-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100'
          onClick={copy}
          aria-label='Copy code'
        >
          {copied ? (
            <Icon name='check' className='h-3.5 w-3.5 text-green-500' />
          ) : (
            <Icon name='clipboardCopy' className='h-3.5 w-3.5' />
          )}
        </Button>
      )}
    </div>
  );
};

const ChatMessageBubbleImpl: React.FC<ChatMessageBubbleProps> = ({
  message,
  isStreaming = false
}) => {
  const isUser = message.role === 'user';
  const { showSuccess, showError } = useToast();
  const [copied, setCopied] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());

  const textParts = message.parts.filter((p) => p.type === 'text');
  const fileParts = message.parts.filter((p) => p.type === 'file');
  const dataParts = message.parts.filter((p) => p.type.startsWith('data-'));

  const textContent = textParts.map((p) => p.text).join('\n\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textContent);
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

  return (
    <div
      className={cn(
        'group relative flex w-full items-start gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
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

      {/* Message Content */}
      <div className={cn('relative flex-1 space-y-2', isUser ? 'items-end' : 'items-start')}>
        {/* File Attachments (if user message) */}
        {isUser && fileParts.length > 0 && (
          <div
            className={cn(
              'grid gap-2',
              fileParts.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3',
              'mb-2'
            )}
          >
            {fileParts.map((part, index) => {
              const isImage = part.mediaType?.startsWith('image/');
              const hasError = imageLoadErrors.has(index);

              return (
                <div
                  key={index}
                  className={cn(
                    'relative overflow-hidden rounded-lg border bg-white dark:bg-slate-900',
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
                      {part.filename && (
                        <div className='absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-2'>
                          <p className='truncate text-xs text-white'>{part.filename}</p>
                        </div>
                      )}
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
            })}
          </div>
        )}

        {/* Text Content */}
        {textContent && (
          <div
            className={cn(
              'relative w-fit max-w-[85%] rounded-2xl px-4 py-3 shadow-sm max-sm:px-2 max-sm:py-1.5',
              isUser
                ? 'bg-primary/80 ml-auto rounded-tr-sm'
                : 'rounded-tl-sm border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
              (fileParts.length > 0 || dataParts.length > 0) && 'w-full max-w-full'
            )}
          >
            {/* Copy button for assistant messages */}
            {!isUser && !isStreaming && (
              <Button
                variant='ghost'
                size='icon'
                className={cn(
                  'absolute -top-1 -right-1 h-7 w-7 rounded-full',
                  'border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
                  'opacity-0 shadow-sm transition-all group-hover:opacity-100',
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

            <div
              className={cn(
                'prose prose-sm max-w-none',
                isUser
                  ? 'prose-invert prose-p:text-primary-foreground prose-headings:text-primary-foreground prose-strong:text-primary-foreground prose-a:text-primary-foreground prose-code:text-primary-foreground'
                  : 'prose-slate dark:prose-invert',
                'prose-p:leading-relaxed prose-pre:my-0 prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2',
                'prose-code:text-xs prose-code:font-medium',
                'prose-ul:my-2 prose-ol:my-2 prose-li:my-0'
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeSanitize]}
                components={{
                  code: CodeBlock,
                  a: (props: any) => (
                    <a
                      {...props}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={cn(
                        'underline decoration-1 underline-offset-2 transition-colors',
                        isUser ? 'hover:text-primary-foreground/80' : 'hover:text-primary'
                      )}
                    />
                  )
                }}
              >
                {textContent}
              </ReactMarkdown>
              {isStreaming && (
                <span className='ml-0.5 inline-block h-4 w-1 animate-pulse bg-current' />
              )}
            </div>
          </div>
        )}

        {/* File Attachments (if assistant message) */}
        {!isUser && fileParts.length > 0 && (
          <div className='mt-3 space-y-2'>
            {fileParts.map((part, index) => {
              const isImage = part.mediaType?.startsWith('image/');
              const hasError = imageLoadErrors.has(index);

              return (
                <div
                  key={index}
                  className={cn(
                    'overflow-hidden rounded-xl border bg-white dark:bg-slate-900',
                    'border-slate-200 dark:border-slate-700',
                    'shadow-sm transition-all hover:shadow-md'
                  )}
                >
                  {isImage && !hasError ? (
                    <div className='relative aspect-video w-full max-w-md bg-slate-50 dark:bg-slate-800/50'>
                      <Image
                        src={part.url}
                        alt={part.filename || 'Generated image'}
                        fill
                        className='object-contain'
                        onError={() => handleImageError(index)}
                      />
                    </div>
                  ) : (
                    <div className='flex items-center gap-4 p-4'>
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                          'bg-gradient-to-br from-slate-50 to-slate-100',
                          'dark:from-slate-800 dark:to-slate-700'
                        )}
                      >
                        <Icon
                          name={getFileIcon(part.mediaType || '')}
                          className='h-6 w-6 text-slate-600 dark:text-slate-400'
                        />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='font-medium text-slate-900 dark:text-slate-100'>
                          {part.filename || 'Generated file'}
                        </p>
                        <p className='text-sm text-slate-500 dark:text-slate-400'>
                          {part.mediaType || 'Unknown type'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Data visualizations */}
        {dataParts.map((part, index) => (
          <div key={index} className='mt-3'>
            {part.type === 'data-chart' && <AiChartRenderer chart={part.data} />}
            {part.type === 'data-records' && <AiRecordsTable records={part.data} />}
            {part.type === 'data-metrics' && <AiMetricsDisplay metrics={part.data} />}
            {part.type === 'data-imageAnalysisData' && (
              <AiTransactionPreview transactions={part.data} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Memoize to prevent re-renders
export const ChatMessageBubble = memo(ChatMessageBubbleImpl, (prev, next) => {
  return (
    prev.isStreaming === next.isStreaming &&
    prev.message.id === next.message.id &&
    prev.message === next.message
  );
});
