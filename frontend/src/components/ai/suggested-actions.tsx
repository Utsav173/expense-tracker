import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChatMessage, useAiChat } from '@/hooks/useAiChat'; // Import useAiChat
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
  X // Icons for confirmation
} from 'lucide-react';

interface SuggestedActionsProps {
  latestAssistantMessage: ChatMessage | null;
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
    entities: ['investment', 'holding'],
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

// Simple mapping from entity type (guessed from tool name) to confirmation action prefix
const confirmationActionMap: Record<string, string> = {
  account: 'confirm delete account',
  category: 'confirm delete category',
  transaction: 'confirm delete transaction', // Or update
  budget: 'confirm delete budget', // Or update
  goal: 'confirm delete goal', // Or update/add/withdraw
  debt: 'confirm mark debt paid', // Or delete/update
  investment: 'confirm delete investment' // Or update
  // Add more mappings as needed based on your tool names
};

export const SuggestedActions: React.FC<SuggestedActionsProps> = ({ latestAssistantMessage }) => {
  const router = useRouter();
  const { sendMessage } = useAiChat(); // Get sendMessage from the hook

  const confirmationDetails = useMemo(() => {
    if (!latestAssistantMessage?.toolResults || latestAssistantMessage.toolResults.length === 0) {
      return null;
    }

    // Find the first tool result that requires confirmation
    const confirmationResult = latestAssistantMessage.toolResults.find((res) => {
      try {
        const parsed = typeof res.result === 'string' ? JSON.parse(res.result) : res.result;
        return parsed?.confirmationNeeded === true && parsed?.id;
      } catch {
        return false;
      }
    });

    if (confirmationResult) {
      try {
        const parsed =
          typeof confirmationResult.result === 'string'
            ? JSON.parse(confirmationResult.result)
            : confirmationResult.result;
        // Try to determine the entity type from the tool name that was called
        const callingTool = latestAssistantMessage.toolCalls?.find(
          (tc) => tc.toolCallId === confirmationResult.toolCallId
        );
        let entityType = 'item'; // Default
        if (callingTool?.toolName) {
          const nameLower = callingTool.toolName.toLowerCase();
          if (nameLower.includes('account')) entityType = 'account';
          else if (nameLower.includes('category')) entityType = 'category';
          else if (nameLower.includes('transaction')) entityType = 'transaction';
          else if (nameLower.includes('budget')) entityType = 'budget';
          else if (nameLower.includes('goal')) entityType = 'goal';
          else if (nameLower.includes('debt')) entityType = 'debt';
          else if (nameLower.includes('investment')) entityType = 'investment';
        }
        const actionPrefix =
          confirmationActionMap[entityType] || `confirm action for ${entityType}`;

        return {
          id: parsed.id,
          details: parsed.details || `ID: ${parsed.id}`,
          actionPrompt: `${actionPrefix} ${parsed.id}`, // Construct the prompt
          cancelPrompt: `cancel action for ${entityType} ${parsed.id}`
        };
      } catch {
        return null;
      }
    }

    return null;
  }, [latestAssistantMessage]);

  const suggestedNavigations = useMemo(() => {
    if (confirmationDetails) return []; // Don't show navigation if confirmation is pending

    if (!latestAssistantMessage?.content) {
      return [];
    }

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

    latestAssistantMessage.toolResults?.forEach((result) => {
      try {
        const parsed =
          typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
        if (parsed?.message) {
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
  }, [latestAssistantMessage, confirmationDetails]);

  const handleConfirm = () => {
    if (confirmationDetails?.actionPrompt) {
      sendMessage(confirmationDetails.actionPrompt);
    }
  };

  const handleCancel = () => {
    if (confirmationDetails?.cancelPrompt) {
      sendMessage(confirmationDetails.cancelPrompt); // Optionally send a cancel message
    }
    // Or simply do nothing client-side to dismiss the options
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (!confirmationDetails && !suggestedNavigations.length) {
    return null;
  }

  return (
    <div className='mt-2 mb-1 px-4'>
      <p className='text-muted-foreground mb-2 text-xs font-medium'>
        {confirmationDetails ? 'Confirmation Required:' : 'Suggested Actions:'}
      </p>
      <div className='flex flex-wrap gap-2'>
        {confirmationDetails ? (
          <>
            <Button
              variant='default' // Or maybe destructive depending on action
              size='sm'
              className='h-7 gap-1.5 rounded-full text-xs'
              onClick={handleConfirm}
            >
              <Check className='h-3.5 w-3.5' />
              Confirm {/* You could make label dynamic based on actionPrefix */}
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
        ) : (
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
          ))
        )}
      </div>
    </div>
  );
};
