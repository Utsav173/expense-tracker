'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAiChat } from '@/hooks/useAiChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, RefreshCcw, Bot, User, AlertTriangle, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { ChatMessageBubble } from './chat-message-bubble';
import { SuggestedActions } from './suggested-actions';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { AnimatePresence, motion } from 'framer-motion';

export const AiChat = ({ handleClose }: { handleClose?: () => void }) => {
  const { messages, sendMessage, isLoading, error, clearChat, sessionId, latestAssistantMessage } =
    useAiChat();
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const confirmClearChat = () => {
    clearChat();
    setIsClearConfirmOpen(false);
  };

  return (
    <div className='bg-background m-auto flex h-full max-h-[82dvh] w-[70dvw] flex-col rounded-2xl max-sm:max-h-[85dvh] max-sm:w-full'>
      {/* Header remains similar but not using CardHeader */}
      <div className='flex flex-shrink-0 items-center justify-between border-b p-4'>
        <div className='flex items-center space-x-3'>
          <Bot className='text-primary h-6 w-6' />
          <h2 className='text-lg font-semibold'>AI Financial Assistant</h2>
        </div>
        <div className='flex items-center space-x-2'>
          <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                disabled={isLoading || messages.length === 0}
                className={cn('h-8 w-8', messages.length === 0 && 'cursor-not-allowed opacity-50')} // Slightly smaller
                aria-label='Clear chat'
              >
                <RefreshCcw className='h-4 w-4' />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all messages from the current session. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmClearChat}>Clear Chat</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {handleClose && (
            <Button variant='ghost' size='icon' onClick={handleClose}>
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>

      {/* Main chat message area */}
      <ScrollArea ref={scrollAreaRef} className='flex-1 overflow-y-auto p-4'>
        <AnimatePresence initial={false}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='space-y-4 pb-4'
          >
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ChatMessageBubble message={message} />
              </motion.div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className='flex items-center justify-start space-x-3'>
                  <Avatar className='h-8 w-8 shrink-0 border'>
                    <AvatarFallback className='bg-muted'>
                      <Bot className='h-4 w-4' />
                    </AvatarFallback>
                  </Avatar>
                  <div className='bg-muted flex items-center space-x-1.5 rounded-lg px-3 py-2 shadow-sm'>
                    <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
                    <span className='text-muted-foreground text-sm'>Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            {error && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className='flex items-start justify-start space-x-3'>
                  <Avatar className='border-destructive/50 h-8 w-8 shrink-0 border'>
                    <AvatarFallback className='bg-destructive/10'>
                      <AlertTriangle className='text-destructive h-4 w-4' />
                    </AvatarFallback>
                  </Avatar>
                  <div className='bg-destructive/10 text-destructive border-destructive/30 max-w-[75%] space-y-1 rounded-lg border px-3 py-2 shadow-sm'>
                    <p className='text-sm font-medium'>An error occurred:</p>
                    <p className='text-xs leading-relaxed whitespace-pre-wrap'>{error.message}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </ScrollArea>

      {/* Suggested actions appear above the input */}
      <SuggestedActions latestAssistantMessage={latestAssistantMessage} />

      {/* Footer with input */}
      <div className='flex-shrink-0 border-t p-4'>
        <form onSubmit={handleSendMessage} className='relative flex w-full items-center'>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask about finances or request actions...'
            className='focus-visible:ring-ring flex-1 resize-none rounded-lg border p-2 pr-12 shadow-sm focus-visible:ring-1'
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-label='Chat input'
          />
          <Button
            type='submit'
            size='icon'
            disabled={isLoading || !input.trim()}
            className='absolute right-4 shrink-0 rounded-full'
            aria-label='Send message'
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Send className='h-4 w-4' />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
