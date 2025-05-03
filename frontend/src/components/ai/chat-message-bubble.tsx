import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/hooks/useAiChat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Bot,
  User,
  Cog,
  CheckCircle,
  XCircle,
  List,
  PlusCircle,
  Trash2,
  Pencil,
  Search,
  Calculator,
  Sparkles,
  ClipboardCopy,
  Check,
  ChevronDown,
  HelpCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useToast } from '@/lib/hooks/useToast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

interface ToolResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  confirmationNeeded?: boolean;
  id?: string;
  details?: string;
  clarificationNeeded?: boolean;
  options?: { id: string; name?: string; description?: string; details?: string }[];
}

const toolIcons: Record<string, React.ElementType> = {
  list: List,
  get: List,
  create: PlusCircle,
  add: PlusCircle,
  update: Pencil,
  delete: Trash2,
  identify: Search,
  find: Search,
  execute: CheckCircle,
  mark: Pencil,
  calculate: Calculator,
  default: Cog
};

const getToolIcon = (toolName: string): React.ElementType => {
  if (!toolName) return toolIcons.default;
  const lowerToolName = toolName.toLowerCase();
  for (const prefix in toolIcons) {
    if (lowerToolName.startsWith(prefix)) {
      return toolIcons[prefix];
    }
  }
  return toolIcons.default;
};

const renderResultData = (data: any): React.ReactNode => {
  if (data === null || data === undefined) return <span className='italic opacity-70'>null</span>;
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className='italic opacity-70'>Empty list</span>;
    return (
      <div className='mt-1 space-y-1'>
        {data.slice(0, 5).map((item, index) => (
          <pre key={index} className='bg-muted/50 rounded p-1 text-[9px] leading-tight'>
            {JSON.stringify(item, null, 1)}
          </pre>
        ))}
        {data.length > 5 && (
          <p className='text-[9px] italic opacity-70'>... and {data.length - 5} more</p>
        )}
      </div>
    );
  }
  if (typeof data === 'object') {
    return (
      <pre className='bg-muted/50 mt-1 rounded p-1 text-[9px] leading-tight'>
        {JSON.stringify(data, null, 1)}
      </pre>
    );
  }
  return <span className='italic opacity-70'>[Unsupported Data Type]</span>;
};

const ToolInfo: React.FC<{
  toolCalls?: ChatMessage['toolCalls'];
  toolResults?: ChatMessage['toolResults'];
}> = ({ toolCalls, toolResults }) => {
  const hasMeaningfulContent =
    (toolCalls && toolCalls.length > 0) || (toolResults && toolResults.length > 0);
  if (!hasMeaningfulContent) return null;

  const [isOpen, setIsOpen] = useState(true);

  let overallStatus: 'error' | 'pending' | 'success' | 'info' | 'confirm' | 'clarify' = 'info';
  if (
    toolResults?.some((res) => {
      try {
        const p = typeof res.result === 'string' ? JSON.parse(res.result) : res.result;
        return p?.success === false || !!p?.error;
      } catch {
        return false;
      }
    })
  ) {
    overallStatus = 'error';
  } else if (
    toolResults?.some((res) => {
      try {
        const p = typeof res.result === 'string' ? JSON.parse(res.result) : res.result;
        return p?.confirmationNeeded === true;
      } catch {
        return false;
      }
    })
  ) {
    overallStatus = 'confirm';
  } else if (
    toolResults?.some((res) => {
      try {
        const p = typeof res.result === 'string' ? JSON.parse(res.result) : res.result;
        return p?.clarificationNeeded === true;
      } catch {
        return false;
      }
    })
  ) {
    overallStatus = 'clarify';
  } else if (toolCalls && (!toolResults || toolResults.length < toolCalls.length)) {
    overallStatus = 'pending';
  } else if (toolResults && toolResults.length > 0) {
    overallStatus = 'success';
  }

  const cardBorderColor = {
    error: 'border-destructive/40',
    pending: 'border-blue-500/40',
    success: 'border-success/40',
    info: 'border-info/40',
    confirm: 'border-amber-500/40',
    clarify: 'border-purple-500/40'
  }[overallStatus];

  const cardBgColor = {
    error: 'bg-destructive/5',
    pending: 'bg-blue-500/5',
    success: 'bg-success/5',
    info: 'bg-info/5',
    confirm: 'bg-amber-500/5',
    clarify: 'bg-purple-500/5'
  }[overallStatus];

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('mt-2 rounded-md border', cardBorderColor, cardBgColor)}
    >
      <CollapsibleTrigger asChild>
        <button className='flex w-full items-center justify-between p-2 text-left'>
          <div className='text-foreground/80 flex items-center gap-1.5 text-xs font-medium'>
            <Sparkles className='text-primary h-3.5 w-3.5' />
            <span>AI Tool Activity</span>
            {overallStatus === 'error' && <XCircle className='text-destructive h-3.5 w-3.5' />}
            {overallStatus === 'confirm' && (
              <AlertTriangle className='h-3.5 w-3.5 text-amber-600 dark:text-amber-400' />
            )}
            {overallStatus === 'clarify' && (
              <HelpCircle className='h-3.5 w-3.5 text-purple-600 dark:text-purple-400' />
            )}
            {overallStatus === 'pending' && (
              <Loader2 className='h-3.5 w-3.5 animate-spin text-blue-500' />
            )}
          </div>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent className='max-h-60 overflow-y-auto p-2 pt-0 text-[11px]'>
          {/* Display Tool Calls */}
          {toolCalls?.map((call) => {
            const Icon = getToolIcon(call.toolName);
            return (
              <div
                key={call.toolCallId}
                className='border-border/50 bg-background/50 mb-1.5 rounded border p-1.5 shadow-sm'
              >
                <p className='text-foreground/90 mb-1 flex items-center gap-1 font-mono text-xs'>
                  <Icon className='text-muted-foreground h-3 w-3 shrink-0' />
                  <span className='font-semibold'>{call.toolName}</span>
                  <Badge variant='secondary' className='ml-auto text-[9px]'>
                    Calling
                  </Badge>
                </p>
                <ScrollArea className='max-h-20 w-full'>
                  <pre className='bg-muted/50 text-muted-foreground rounded p-1 font-mono text-[10px] break-words whitespace-pre-wrap'>
                    {JSON.stringify(call.args, null, 1)}
                  </pre>
                </ScrollArea>
              </div>
            );
          })}

          {/* Display Tool Results with Interpretation */}
          {toolResults?.map((result) => {
            let parsedResult: ToolResponse | null = null;
            let rawResultString: string = '';
            let parseError = false;

            try {
              rawResultString =
                typeof result.result === 'string' ? result.result : JSON.stringify(result.result);
              parsedResult = JSON.parse(rawResultString) as ToolResponse;
              if (typeof parsedResult !== 'object' || parsedResult === null) {
                throw new Error('Parsed result is not an object');
              }
            } catch (e) {
              console.warn('Could not parse tool result as JSON:', rawResultString, e);
              parseError = true;
            }

            const isError =
              !parseError && (parsedResult?.success === false || !!parsedResult?.error);
            const isConfirm = !parseError && parsedResult?.confirmationNeeded === true;
            const isClarify = !parseError && parsedResult?.clarificationNeeded === true;
            const isSuccess = !parseError && !isError && !isConfirm && !isClarify;

            const ResultIcon = isError
              ? XCircle
              : isConfirm
                ? AlertTriangle
                : isClarify
                  ? HelpCircle
                  : CheckCircle;
            const resultColorClass = isError
              ? 'text-destructive'
              : isConfirm
                ? 'text-amber-600 dark:text-amber-400'
                : isClarify
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-success';
            const resultBgClass = isError
              ? 'bg-destructive/10 border-destructive/30'
              : isConfirm
                ? 'bg-amber-500/10 border-amber-500/30'
                : isClarify
                  ? 'bg-purple-500/10 border-purple-500/30'
                  : 'bg-success/10 border-success/30';
            const resultBadgeVariant = isError
              ? 'destructive'
              : isConfirm
                ? 'outline'
                : isClarify
                  ? 'outline'
                  : 'default';
            const resultStatusText = isError
              ? 'Error'
              : isConfirm
                ? 'Confirm?'
                : isClarify
                  ? 'Clarify?'
                  : 'Success';

            return (
              <div
                key={result.toolCallId}
                className={cn('mt-1.5 rounded border p-1.5 shadow-sm', resultBgClass)}
              >
                <p
                  className={cn('mb-1 flex items-center gap-1 font-mono text-xs', resultColorClass)}
                >
                  <ResultIcon className='h-3 w-3 shrink-0' /> Result:
                  <Badge
                    variant={resultBadgeVariant}
                    className='ml-auto scale-75 px-1 py-0 text-[9px]'
                    style={
                      isClarify
                        ? { borderColor: 'hsl(var(--purple))', color: 'hsl(var(--purple))' }
                        : isConfirm
                          ? { borderColor: 'hsl(var(--amber))', color: 'hsl(var(--amber))' }
                          : {}
                    }
                  >
                    {resultStatusText}
                  </Badge>
                </p>
                <ScrollArea className='max-h-24 w-full'>
                  <div className='bg-background/60 text-foreground/80 rounded p-1 font-mono text-[10px] break-words whitespace-pre-wrap'>
                    {parseError ? (
                      <>
                        <span className='font-semibold'>Raw Result:</span>
                        <pre className='mt-1 text-[9px]'>{rawResultString}</pre>
                      </>
                    ) : isConfirm ? (
                      <span className='italic opacity-80'>
                        {parsedResult?.message || 'Confirmation required.'}
                      </span>
                    ) : isClarify ? (
                      <span className='italic opacity-80'>
                        {parsedResult?.message || 'Clarification needed.'}
                      </span>
                    ) : (
                      <>
                        {(parsedResult?.message || parsedResult?.error) && (
                          <p className={`mb-1 font-semibold ${isError ? 'text-destructive' : ''}`}>
                            {parsedResult?.message || parsedResult?.error}
                          </p>
                        )}
                        {(parsedResult?.data || (isError && !parsedResult?.message)) &&
                          renderResultData(
                            parsedResult?.data ?? (isError ? 'Details unavailable' : null)
                          )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const Icon = isUser ? User : Bot;
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
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div
      className={cn(
        'group relative flex items-start space-x-3',
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
          'relative w-auto max-w-[80%] space-y-1 rounded-lg px-3 py-2 shadow-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-background border'
        )}
      >
        {!isUser && message.content && (
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
        {/* Ensure content is rendered even if empty for spacing */}
        <div className='prose prose-sm dark:prose-invert prose-p:before:content-none prose-p:after:content-none max-w-none pt-1 break-words'>
          <ReactMarkdown components={{}}>{message.content || ''}</ReactMarkdown>
        </div>
        {/* Pass potentially undefined toolCalls/Results */}
        <ToolInfo toolCalls={message.toolCalls} toolResults={message.toolResults} />
        {message.createdAt && (
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
