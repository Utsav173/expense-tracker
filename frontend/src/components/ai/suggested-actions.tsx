import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAiChat } from '@/hooks/useAiChat';
import {
  ArrowRight,
  Wallet,
  Tag,
  BookOpen,
  PiggyBank,
  BarChart3,
  Coins,
  ArrowLeftRight,
  Check,
  X,
  HelpCircle
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

interface ConfirmationDetails {
  type: 'confirm';
  id: string;
  details: string;
  message: string;
  actionPrompt: string;
  cancelPrompt: string;
}

interface ClarificationDetails {
  type: 'clarify';
  message: string;
  options: { id: string; label: string }[];
}

interface ActionDefinition {
  keywords: (string | RegExp)[];
  entities: string[];
  label: string;
  icon: React.ElementType;
  path: string;
}

const ACTION_DEFINITIONS: ActionDefinition[] = [
  {
    keywords: [/ok.* created/, /added.* new/, 'new account'],
    entities: ['account'],
    label: 'View Accounts',
    icon: Wallet,
    path: '/'
  },
  {
    keywords: ['listed', 'showed', 'found', /here are your account/i],
    entities: ['accounts', 'account'],
    label: 'View Accounts',
    icon: Wallet,
    path: '/'
  },
  {
    keywords: [/ok.* created/, /added.* new/, /transaction added/i],
    entities: ['transaction', 'expense', 'income'],
    label: 'View Transactions',
    icon: ArrowLeftRight,
    path: '/transactions'
  },
  {
    keywords: ['listed', 'showed', 'found', /here are your transaction/i],
    entities: ['transactions', 'expenses', 'income'],
    label: 'View Transactions',
    icon: ArrowLeftRight,
    path: '/transactions'
  },
  {
    keywords: [/ok.* created/, /added.* new/],
    entities: ['category'],
    label: 'View Categories',
    icon: Tag,
    path: '/category'
  },
  {
    keywords: ['listed', 'showed', 'found', /here are your categor/i],
    entities: ['categories', 'category'],
    label: 'View Categories',
    icon: Tag,
    path: '/category'
  },
  {
    keywords: [/ok.* created/, /added.* new/, /set budget/i],
    entities: ['budget'],
    label: 'View Budgets',
    icon: BookOpen,
    path: '/budget'
  },
  {
    keywords: ['listed', 'showed', 'found', /here are your budget/i],
    entities: ['budgets', 'budget'],
    label: 'View Budgets',
    icon: BookOpen,
    path: '/budget'
  },
  {
    keywords: [/ok.* created/, /added.* new/, /goal created/i],
    entities: ['goal', 'saving goal'],
    label: 'View Goals',
    icon: PiggyBank,
    path: '/goal'
  },
  {
    keywords: ['listed', 'showed', 'found', /your saving goal/i],
    entities: ['goals', 'goal'],
    label: 'View Goals',
    icon: PiggyBank,
    path: '/goal'
  },
  {
    keywords: [/ok.* created/, /added.* new/, /added.* holding/i],
    entities: ['investment', 'holding', 'investment account'],
    label: 'View Investments',
    icon: BarChart3,
    path: '/investment'
  },
  {
    keywords: ['listed', 'showed', 'found', /your investment/i],
    entities: ['investments', 'holdings', 'investment accounts'],
    label: 'View Investments',
    icon: BarChart3,
    path: '/investment'
  },
  {
    keywords: [/ok.* created/, /added.* new/, /recorded debt/i],
    entities: ['debt', 'loan'],
    label: 'View Debts',
    icon: Coins,
    path: '/debts'
  },
  {
    keywords: ['listed', 'showed', 'found', /your debt/i],
    entities: ['debts', 'loans'],
    label: 'View Debts',
    icon: Coins,
    path: '/debts'
  }
];

const confirmationActionDescriptions: Record<string, string> = {
  executeConfirmedDeleteAccount: 'delete account',
  executeConfirmedUpdateAccountName: 'update account name',
  executeConfirmedDeleteCategory: 'delete category',
  executeConfirmedUpdateCategoryName: 'update category name',
  executeConfirmedUpdateTransaction: 'update transaction',
  executeConfirmedDeleteTransaction: 'delete transaction',
  executeConfirmedUpdateBudget: 'update budget',
  executeConfirmedDeleteBudget: 'delete budget',
  executeConfirmedUpdateGoal: 'update goal',
  executeAddAmountToGoalById: 'add amount to goal',
  executeWithdrawAmountFromGoalById: 'withdraw amount from goal',
  executeConfirmedDeleteGoal: 'delete goal',
  executeConfirmedUpdateInvestmentAccount: 'update investment account',
  executeConfirmedDeleteInvestmentAccount: 'delete investment account',
  executeConfirmedUpdateInvestment: 'update investment details',
  executeConfirmedUpdateDividend: 'update investment dividend',
  executeConfirmedDeleteInvestment: 'delete investment',
  executeConfirmedMarkDebtPaid: 'mark debt as paid',
  executeConfirmedUpdateDebt: 'update debt',
  executeConfirmedDeleteDebt: 'delete debt'
};

interface SuggestedActionsProps {
  latestAssistantMessage: any;
}

export const SuggestedActions: React.FC<SuggestedActionsProps> = ({ latestAssistantMessage }) => {
  const router = useRouter();
  const { sendMessage } = useAiChat();

  const actionContext = useMemo((): ConfirmationDetails | ClarificationDetails | null => {
    if (!latestAssistantMessage?.toolResults || latestAssistantMessage.toolResults.length === 0) {
      return null;
    }

    for (const toolResult of latestAssistantMessage.toolResults) {
      try {
        const parsedResult =
          typeof toolResult.result === 'string' ? JSON.parse(toolResult.result) : toolResult.result;

        if (parsedResult && typeof parsedResult === 'object') {
          if (parsedResult.clarificationNeeded === true && Array.isArray(parsedResult.options)) {
            return {
              type: 'clarify',
              message: parsedResult.message || 'Please choose one of the following:',
              options: parsedResult.options.map((opt: any) => ({
                id: opt.id,
                label: opt.name || opt.description || opt.details || `Option ${opt.id}`
              }))
            };
          }

          if (parsedResult.confirmationNeeded === true && parsedResult.id) {
            const callingTool = latestAssistantMessage.toolCalls?.find(
              (tc: any) => tc.toolCallId === toolResult.toolCallId
            );
            const toolName = callingTool?.toolName || '';
            const actionDesc = confirmationActionDescriptions[toolName] || 'confirm action';

            return {
              type: 'confirm',
              id: parsedResult.id,
              details: parsedResult.details || `ID: ${parsedResult.id}`,
              message:
                parsedResult.message ||
                `Please confirm the action for ${parsedResult.details || `ID ${parsedResult.id}`}.`,
              actionPrompt: `Yes, ${actionDesc} ${parsedResult.id}`,
              cancelPrompt: `Cancel action for ${parsedResult.id}`
            };
          }
        }
      } catch (e) {
        console.warn('Failed to parse tool result for suggested actions:', toolResult.result, e);
      }
    }

    return null;
  }, [latestAssistantMessage]);

  const suggestedNavigations = useMemo(() => {
    if (actionContext) return [];

    if (!latestAssistantMessage?.content) return [];

    const contentLower = latestAssistantMessage.content.toLowerCase();
    const detectedPaths = new Set<string>();

    ACTION_DEFINITIONS.forEach((action) => {
      const keywordMatch = action.keywords.some((kw) =>
        kw instanceof RegExp ? kw.test(contentLower) : contentLower.includes(kw)
      );
      const entityMatch = action.entities.some((entity) => contentLower.includes(entity));
      if (keywordMatch && entityMatch) {
        detectedPaths.add(action.path);
      }
    });

    latestAssistantMessage.toolResults?.forEach((result: any) => {
      try {
        const parsed =
          typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
        if (parsed?.success === true && parsed?.message) {
          const messageLower = parsed.message.toLowerCase();
          ACTION_DEFINITIONS.forEach((action) => {
            const keywordMatch = action.keywords.some((kw) =>
              kw instanceof RegExp ? kw.test(messageLower) : messageLower.includes(kw)
            );
            const entityMatch = action.entities.some((entity) => messageLower.includes(entity));
            if (keywordMatch && entityMatch) {
              detectedPaths.add(action.path);
            }
          });
        }
      } catch {}
    });

    return Array.from(detectedPaths)
      .map((path) => ACTION_DEFINITIONS.find((action) => action.path === path)!)
      .filter(Boolean);
  }, [latestAssistantMessage, actionContext]);

  const handleConfirm = () => {
    if (actionContext?.type === 'confirm') {
      sendMessage(actionContext.actionPrompt);
    }
  };

  const handleCancel = () => {
    if (actionContext?.type === 'confirm') {
      sendMessage(actionContext.cancelPrompt);
    }
  };

  const handleClarifyOption = (optionLabel: string, optionId: string) => {
    sendMessage(`Select option ID ${optionId} (${optionLabel})`);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (!actionContext && !suggestedNavigations.length) {
    return null;
  }

  return (
    <div className='mt-2 mb-1 px-4'>
      <p className='text-muted-foreground mb-2 text-xs font-medium'>
        {actionContext?.type === 'confirm'
          ? 'Confirmation Required:'
          : actionContext?.type === 'clarify'
            ? 'Clarification Needed:'
            : 'Suggested Actions:'}
      </p>
      {/* Use ScrollArea for potentially long lists of options/suggestions */}
      <ScrollArea className='w-full whitespace-nowrap'>
        <div className='flex w-max space-x-2 pb-2'>
          {actionContext?.type === 'confirm' && (
            <>
              <Button
                variant='default'
                size='sm'
                className='h-7 gap-1.5 rounded-full text-xs'
                onClick={handleConfirm}
              >
                <Check className='h-3.5 w-3.5' />
                Confirm {/* Potentially make label dynamic later */}
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-7 gap-1.5 rounded-full text-xs'
                onClick={handleCancel}
              >
                <X className='h-3.5 w-3.5' />
                Cancel
              </Button>
            </>
          )}

          {actionContext?.type === 'clarify' && (
            <>
              {actionContext.options.map((option) => (
                <Button
                  key={option.id}
                  variant='outline'
                  size='sm'
                  className='h-7 gap-1.5 rounded-full px-3 text-xs'
                  onClick={() => handleClarifyOption(option.label, option.id)}
                >
                  {/* Icon can be generic or based on entity type if passed */}
                  <HelpCircle className='h-3.5 w-3.5' />
                  <span className='max-w-[150px] truncate'>{option.label}</span>
                </Button>
              ))}
              <Button
                variant='ghost'
                size='sm'
                className='h-7 gap-1.5 rounded-full px-3 text-xs'
                onClick={handleCancel}
              >
                <X className='h-3.5 w-3.5' />
                Cancel
              </Button>
            </>
          )}

          {!actionContext &&
            suggestedNavigations.map((action) => (
              <Button
                key={action.path}
                variant='outline'
                size='sm'
                className='h-7 gap-1.5 rounded-full text-xs'
                onClick={() => handleNavigate(action.path)}
              >
                <action.icon className='h-3.5 w-3.5' />
                {action.label}
                <ArrowRight className='text-muted-foreground h-3.5 w-3.5' />
              </Button>
            ))}
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    </div>
  );
};
