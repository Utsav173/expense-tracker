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
  Info,
  Database,
  MessageSquareWarning,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useToast } from '@/lib/hooks/useToast';
import {
  Collapsible, // Import Collapsible components
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

interface ChatMessageBubbleProps {
  message: ChatMessage;
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
        {data.slice(0, 3).map((item, index) => (
          <pre key={index} className='bg-muted/50 rounded p-1 text-[9px]'>
            {JSON.stringify(item, null, 1)}
          </pre>
        ))}
        {data.length > 3 && (
          <p className='text-[9px] italic opacity-70'>... and {data.length - 3} more</p>
        )}
      </div>
    );
  }
  if (typeof data === 'object') {
    return (
      <pre className='bg-muted/50 mt-1 rounded p-1 text-[9px]'>{JSON.stringify(data, null, 1)}</pre>
    );
  }
  return <span className='italic opacity-70'>[Unsupported Data Type]</span>;
};

const ToolInfo: React.FC<{
  toolCalls?: ChatMessage['toolCalls'];
  toolResults?: ChatMessage['toolResults'];
}> = ({ toolCalls, toolResults }) => {
  if (!toolCalls && !toolResults) return null;
  const hasError = toolResults?.some((r) => {
    try {
      const p = typeof r.result === 'string' ? JSON.parse(r.result) : r.result;
      return p?.error || p?.success === false;
    } catch {
      return false;
    }
  });
  const cardBorderColor = hasError ? 'border-destructive/40' : 'border-primary/40';
  const cardBgColor = hasError ? 'bg-destructive/5' : 'bg-primary/5';
  const [isOpen, setIsOpen] = useState(false); // State for collapsible

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
            {hasError && <XCircle className='text-destructive h-3.5 w-3.5' />}
          </div>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent className='max-h-60 overflow-y-auto p-2 pt-0 text-[11px]'>
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
          {toolResults?.map((result) => {
            let isErrorResult = false;
            let displayContent: string | React.ReactNode = '';
            let resultType: 'success' | 'error' | 'info' | 'confirm' = 'info';
            let dataContent: React.ReactNode = null;
            try {
              const parsed =
                typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
              if (parsed && typeof parsed === 'object') {
                if (parsed.error) {
                  displayContent = parsed.error;
                  isErrorResult = true;
                  resultType = 'error';
                } else if (parsed.message && parsed.success === false) {
                  displayContent = parsed.message;
                  isErrorResult = true;
                  resultType = 'error';
                } else if (parsed.message && parsed.confirmationNeeded) {
                  displayContent = parsed.message;
                  resultType = 'confirm';
                } else if (parsed.message) {
                  displayContent = parsed.message;
                  resultType = 'success';
                } else {
                  displayContent = 'Operation completed.';
                  resultType = 'success';
                }
                if (parsed.data) {
                  dataContent = renderResultData(parsed.data);
                } else if (
                  parsed.accounts ||
                  parsed.categories ||
                  parsed.transactions ||
                  parsed.budgets ||
                  parsed.goals ||
                  parsed.investments ||
                  parsed.debts
                ) {
                  dataContent = renderResultData(
                    parsed.accounts ||
                      parsed.categories ||
                      parsed.transactions ||
                      parsed.budgets ||
                      parsed.goals ||
                      parsed.investments ||
                      parsed.debts
                  );
                }
              } else {
                displayContent = String(result.result);
                resultType = 'info';
              }
            } catch (e) {
              displayContent = String(result.result);
              resultType = 'info';
            }
            const ResultIcon = isErrorResult
              ? XCircle
              : resultType === 'confirm'
                ? MessageSquareWarning
                : resultType === 'success'
                  ? CheckCircle
                  : Info;
            const resultColorClass = isErrorResult
              ? 'text-destructive'
              : resultType === 'confirm'
                ? 'text-amber-600 dark:text-amber-400'
                : resultType === 'success'
                  ? 'text-success'
                  : 'text-info';
            const resultBgClass = isErrorResult
              ? 'bg-destructive/10 border-destructive/30'
              : resultType === 'confirm'
                ? 'bg-amber-500/10 border-amber-500/30'
                : resultType === 'success'
                  ? 'bg-success/10 border-success/30'
                  : 'bg-info/10 border-info/30';
            const resultBadgeVariant = isErrorResult
              ? 'destructive'
              : resultType === 'confirm'
                ? 'outline'
                : resultType === 'success'
                  ? 'default'
                  : 'secondary';
            return (
              <div
                key={result.toolCallId}
                className={cn('mt-1.5 rounded border p-1.5 shadow-sm', resultBgClass)}
              >
                <p
                  className={cn('mb-1 flex items-center gap-1 font-mono text-xs', resultColorClass)}
                >
                  <ResultIcon className='h-3 w-3 shrink-0' /> Result:
                  {resultType !== 'info' && (
                    <Badge
                      variant={resultBadgeVariant}
                      className='ml-auto scale-75 px-1 py-0 text-[9px]'
                    >
                      {resultType}
                    </Badge>
                  )}
                </p>
                <ScrollArea className='max-h-24 w-full'>
                  <div className='bg-background/60 text-foreground/80 rounded p-1 font-mono text-[10px] break-words whitespace-pre-wrap'>
                    {displayContent}
                    {dataContent && (
                      <div className='border-border/50 mt-1 border-t pt-1'>{dataContent}</div>
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
          isUser ? 'bg-primary text-primary-foreground' : 'bg-background'
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
        <div className='prose prose-sm dark:prose-invert prose-p:before:content-none prose-p:after:content-none max-w-none pt-1 break-words'>
          <ReactMarkdown components={{}}>{message.content}</ReactMarkdown>
        </div>
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
