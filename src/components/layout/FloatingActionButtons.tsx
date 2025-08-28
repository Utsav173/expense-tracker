'use client';

import { AiChatWrapper } from '@/components/ai/ai-chat-wrapper';
import { HelpTrigger } from '@/components/help/HelpTrigger';

/**
 * A container component that manages the layout of all floating action buttons
 * in the application to prevent them from overlapping.
 */
export const FloatingActionButtons = () => {
  return (
    // This container is the only element with fixed positioning.
    // It uses flexbox to stack the buttons vertically with a gap.
    <div className='fixed right-6 bottom-6 z-50 flex flex-col-reverse items-center gap-4'>
      <AiChatWrapper />
      <HelpTrigger />
    </div>
  );
};
