import React, { useState } from 'react';
import { cn, formatCurrency, safeJsonParse } from '@/lib/utils';
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
  Loader2,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
  Tag,
  CalendarDays
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // Or any other theme you prefer
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useToast } from '@/lib/hooks/useToast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '../ui/separator';
import { Transaction } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ChartRenderer from './ChartRenderer';

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

  if (lowerToolName.startsWith('list')) return toolIcons.list;
  if (lowerToolName.startsWith('get')) return toolIcons.get;
  if (lowerToolName.startsWith('create')) return toolIcons.create;
  if (lowerToolName.startsWith('add')) return toolIcons.add;
  if (lowerToolName.startsWith('update')) return toolIcons.update;
  if (lowerToolName.startsWith('delete')) return toolIcons.delete;
  if (lowerToolName.startsWith('identify')) return toolIcons.identify;
  if (lowerToolName.startsWith('find')) return toolIcons.find;
  if (lowerToolName.startsWith('execute')) return toolIcons.execute;
  if (lowerToolName.startsWith('mark')) return toolIcons.mark;
  if (lowerToolName.startsWith('calculate')) return toolIcons.calculate;

  for (const prefix in toolIcons) {
    if (lowerToolName.includes(prefix)) {
      return toolIcons[prefix];
    }
  }
  return toolIcons.default;
};

const ToolDataSummary: React.FC<{ toolData: ChatMessage['toolData'] }> = ({ toolData }) => {
  if (!toolData || !toolData.data) return null;

  const { toolName, data } = toolData;

  if (toolName === 'listTransactions' && Array.isArray(data) && data.length > 0) {
    const transactions = data as Transaction[];
    const MAX_INITIAL_DISPLAY = 5;
    const [showAll, setShowAll] = useState(transactions.length <= MAX_INITIAL_DISPLAY);
    const displayedTransactions = showAll
      ? transactions
      : transactions.slice(0, MAX_INITIAL_DISPLAY);

    return (
      <div className='border-border/50 mt-2 space-y-1 border-t pt-2'>
        <p className='mb-1.5 text-[11px] font-semibold opacity-80'>
          Found {transactions.length} Transaction{transactions.length > 1 ? 's' : ''}:
        </p>
        <ScrollArea className='max-h-[180px] pr-2'>
          <div className='space-y-2'>
            {displayedTransactions.map((tx) => {
              const dateFormatted = tx.createdAt
                ? format(parseISO(tx.createdAt), 'MMM d, yy')
                : 'N/A';
              const amountColor = tx.isIncome ? 'text-success' : 'text-destructive';
              const AmountIcon = tx.isIncome ? ArrowUpCircle : ArrowDownCircle;

              return (
                <TooltipProvider key={tx.id} delayDuration={150}>
                  <div className='bg-muted/50 border-border/30 flex flex-col gap-1 rounded border p-2 text-xs shadow-sm'>
                    {/* Line 1: Description & Amount */}
                    <div className='flex items-start justify-between gap-2'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className='flex-1 cursor-default truncate font-medium break-words'
                            title={tx.text}
                          >
                            {tx.text}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent align='start'>
                          <p>{tx.text}</p>
                        </TooltipContent>
                      </Tooltip>

                      <span className={cn('font-semibold whitespace-nowrap', amountColor)}>
                        <AmountIcon className='mr-0.5 inline-block h-3 w-3' />
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </div>
                    {/* Line 2: Category & Date */}
                    <div className='text-muted-foreground flex items-center justify-between gap-2 text-[10px]'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className='flex cursor-default items-center gap-1 truncate'>
                            <Tag className='h-2.5 w-2.5 shrink-0' />
                            <span className='truncate'>{tx.category?.name ?? 'Uncategorized'}</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent align='start'>
                          <p>{tx.category?.name ?? 'Uncategorized'}</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className='flex items-center gap-1 whitespace-nowrap'>
                        <CalendarDays className='h-2.5 w-2.5' />
                        {dateFormatted}
                      </span>
                    </div>
                  </div>
                </TooltipProvider>
              );
            })}
            {!showAll && transactions.length > MAX_INITIAL_DISPLAY && (
              <Button
                variant='link'
                size='sm'
                className='h-auto p-0 text-xs'
                onClick={() => setShowAll(true)}
              >
                Show {transactions.length - MAX_INITIAL_DISPLAY} more...
              </Button>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (toolName === 'getSpendingByCategory' && data.name && data.totalExpense) {
    const spending = data.name
      .map((name: string, index: number) => ({
        name: name,
        amount: data.totalExpense[index] || 0
      }))
      .filter((item: { amount: number }) => item.amount > 0)
      .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount);

    if (spending.length === 0) return null;

    return (
      <div className='border-border/50 mt-2 space-y-1 border-t pt-2'>
        <p className='text-[11px] font-semibold opacity-80'>Spending Summary:</p>
        <ul className='list-disc space-y-0.5 pl-4 text-[10px] opacity-90'>
          {spending.slice(0, 3).map((item: { name: string; amount: number }, i: number) => (
            <li key={i}>
              {item.name}: {formatCurrency(item.amount, 'INR')}
            </li>
          ))}
          {spending.length > 3 && <li>...and more</li>}
        </ul>
      </div>
    );
  }

  if (toolName === 'getIncomeExpenseTrends') {
    const firstBalance = data.balance?.[0];
    const lastBalance = data.balance?.[data.balance.length - 1];
    const trendMessage =
      typeof firstBalance === 'number' && typeof lastBalance === 'number'
        ? `Balance trend from ${formatCurrency(firstBalance)} to ${formatCurrency(lastBalance)}`
        : 'Trend data retrieved';

    return (
      <div className='border-border/50 mt-2 space-y-1 border-t pt-2'>
        <p className='flex items-center gap-1 text-[11px] font-semibold opacity-80'>
          <BarChart3 className='h-3 w-3' /> {trendMessage}
        </p>
        <p className='text-[10px] italic opacity-70'>(Chart visualization available on frontend)</p>
      </div>
    );
  }

  if (toolName === 'getAccountAnalyticsSummary') {
    return (
      <div className='border-border/50 mt-2 space-y-1 border-t pt-2 text-[10px] opacity-90'>
        <p className='mb-1 text-[11px] font-semibold opacity-80'>Period Summary:</p>
        <p>
          Income: {formatCurrency(data.income)} ({data.IncomePercentageChange?.toFixed(1)}%)
        </p>
        <p>
          Expenses: {formatCurrency(data.expense)} ({data.ExpensePercentageChange?.toFixed(1)}%)
        </p>
        <p>
          Net Balance: {formatCurrency(data.balance)} ({data.BalancePercentageChange?.toFixed(1)}%)
        </p>
      </div>
    );
  }

  if (toolName === 'getExtremeTransaction' && data.id) {
    const typeLabel = data.isIncome ? 'Income' : 'Expense';
    const dateFormatted = data.createdAt ? format(parseISO(data.createdAt), 'MMM d, yyyy') : 'N/A';
    return (
      <div className='border-border/50 mt-2 space-y-1 border-t pt-2'>
        <p className='text-[11px] font-semibold opacity-80'>Found Transaction:</p>
        <p className='text-[10px] opacity-90'>
          "{data.text}" ({typeLabel}) - {formatCurrency(data.amount, data.currency)} on{' '}
          {dateFormatted}
        </p>
      </div>
    );
  }

  if (toolData.message) {
    return (
      <div className='border-border/50 mt-2 border-t pt-2'>
        <p className='text-[11px] italic opacity-70'>{toolData.message}</p>
      </div>
    );
  }

  return null;
};

const ToolInfo: React.FC<{
  toolCalls?: ChatMessage['toolCalls'];
  toolResults?: ChatMessage['toolResults'];
}> = ({ toolCalls, toolResults }) => {
  const hasMeaningfulContent =
    (toolCalls && toolCalls.length > 0) || (toolResults && toolResults.length > 0);
  if (!hasMeaningfulContent) return null;

  const [isOpen, setIsOpen] = useState(false);

  let overallStatus: 'error' | 'pending' | 'success' | 'info' | 'confirm' | 'clarify' = 'info';

  if (toolResults && toolResults.length > 0) {
    const firstResultParsed = safeJsonParse(toolResults[0].result);
    if (firstResultParsed?.success === false || !!firstResultParsed?.error) overallStatus = 'error';
    else if (firstResultParsed?.confirmationNeeded === true) overallStatus = 'confirm';
    else if (firstResultParsed?.clarificationNeeded === true) overallStatus = 'clarify';
    else overallStatus = 'success';
  } else if (toolCalls && toolCalls.length > 0) {
    overallStatus = 'pending';
  }

  const cardBorderColor = {
    error: 'border-destructive/40',
    pending: 'border-blue-500/40',
    success: 'border-success/40',
    info: 'border-muted-foreground/30',
    confirm: 'border-amber-500/40',
    clarify: 'border-purple-500/40'
  }[overallStatus];

  const cardBgColor = {
    error: 'bg-destructive/5',
    pending: 'bg-blue-500/5',
    success: 'bg-success/5',
    info: 'bg-muted/20',
    confirm: 'bg-amber-500/5',
    clarify: 'bg-purple-500/5'
  }[overallStatus];

  const StatusIcon = {
    error: XCircle,
    pending: Loader2,
    success: CheckCircle,
    info: Cog,
    confirm: AlertTriangle,
    clarify: HelpCircle
  }[overallStatus];

  const iconColor = {
    error: 'text-destructive',
    pending: 'text-blue-500 animate-spin',
    success: 'text-success',
    info: 'text-muted-foreground',
    confirm: 'text-amber-600 dark:text-amber-400',
    clarify: 'text-purple-600 dark:text-purple-400'
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
            <span>Tool Activity</span>
            <StatusIcon className={cn('h-3.5 w-3.5', iconColor)} />
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
          {/* Separator if both calls and results exist */}
          {toolCalls && toolCalls.length > 0 && toolResults && toolResults.length > 0 && (
            <Separator className='my-1.5' />
          )}

          {/* Display Tool Results */}
          {toolResults?.map((result, idx) => {
            const parsedResult = safeJsonParse(result.result);
            const isError = parsedResult?.success === false || !!parsedResult?.error;
            const isConfirm = parsedResult?.confirmationNeeded === true;
            const isClarify = parsedResult?.clarificationNeeded === true;
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
            const resultStatusText = isError
              ? 'Error'
              : isConfirm
                ? 'Confirm?'
                : isClarify
                  ? 'Clarify?'
                  : 'Success';

            return (
              <div
                key={idx}
                className={cn(
                  'mt-1.5 rounded border p-1.5 shadow-sm',
                  'bg-background/30 border-border/50'
                )}
              >
                <p
                  className={cn('mb-1 flex items-center gap-1 font-mono text-xs', resultColorClass)}
                >
                  <ResultIcon className='h-3 w-3 shrink-0' /> Result ({resultStatusText}):
                </p>
                <ScrollArea className='max-h-24 w-full'>
                  <div className='bg-muted/50 text-foreground/80 rounded p-1 font-mono text-[10px] break-words whitespace-pre-wrap'>
                    {parsedResult?.message && (
                      <p className='mb-1 text-xs font-medium'>{parsedResult.message}</p>
                    )}
                    {parsedResult?.error && (
                      <p className='text-destructive mb-1 text-xs font-medium'>
                        {parsedResult.error}
                      </p>
                    )}
                    {isClarify && parsedResult?.options && Array.isArray(parsedResult.options) && (
                      <ul className='list-disc space-y-0.5 pl-3 text-[10px]'>
                        {parsedResult.options.map((opt: any, optIdx: number) => (
                          <li key={opt.id || optIdx}>
                            ID: {opt.id} - {opt.name || opt.description || opt.details || 'Option'}
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* Only show raw data if it exists and isn't covered by message/error/options */}
                    {parsedResult?.data && !isError && !isConfirm && !isClarify && (
                      <pre className='mt-1 text-[9px]'>
                        {JSON.stringify(parsedResult.data, null, 1)}
                      </pre>
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
    <TooltipProvider>
      {' '}
      {/* Add TooltipProvider at the root */}
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
            'relative w-auto max-w-[85%] space-y-1 rounded-lg px-3 py-2 shadow-sm sm:max-w-[80%]',
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
          {/* Render AI's text content */}
          <div className='prose prose-sm dark:prose-invert prose-p:before:content-none prose-p:after:content-none prose-p:my-1 max-w-none pt-1 break-words'>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.content || ''}
            </ReactMarkdown>
          </div>

          {/* Render Tool Data Summary */}
          {!isUser && <ToolDataSummary toolData={message.toolData} />}

          {/* Render Chart if available */}
          {!isUser && message.chart && <ChartRenderer chartData={message.chart} />}

          {/* Render Raw Tool Calls/Results Collapsible */}
          {!isUser && (message.toolCalls || message.toolResults) && (
            <ToolInfo toolCalls={message.toolCalls} toolResults={message.toolResults} />
          )}

          {/* Timestamp */}
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
    </TooltipProvider>
  );
};
