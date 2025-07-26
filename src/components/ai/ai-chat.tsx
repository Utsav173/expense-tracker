'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAiChat } from '@/components/ai/hooks/useAiChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, RefreshCcw, Bot, AlertTriangle, X, BrainCircuit } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { AnimatePresence, motion } from 'framer-motion';

export const AiChat = ({
  handleClose,
  shouldFullHeight = false
}: {
  handleClose?: () => void;
  shouldFullHeight?: boolean;
}) => {
  const { messages, sendMessage, isLoading, error, clearChat } = useAiChat();
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  useEffect(() => {
    if (Array.isArray(messages)) {
      setIsInitialized(true);
    }
  }, [messages]);

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
    <div
      className={cn(
        'bg-background m-auto flex h-full w-full flex-col rounded-2xl max-sm:max-h-[85dvh]',
        {
          'max-h-screen': shouldFullHeight,
          'max-h-[85dvh]': !shouldFullHeight
        }
      )}
    >
      {/* Header */}
      <div className='flex flex-shrink-0 items-center justify-between border-b p-4'>
        <div className='flex items-center space-x-3'>
          <Bot className='text-primary h-6 w-6' />
          <h2 className='text-lg font-semibold'>AI Financial Assistant</h2>
        </div>
        <div className='flex items-center space-x-1'>
          <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                disabled={isLoading || messages.length === 0}
                className={cn('h-8 w-8', messages.length === 0 && 'cursor-not-allowed opacity-50')}
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
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={handleClose}
              aria-label='Close chat'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>

      {/* Chat Message Area */}
      <ScrollArea ref={scrollAreaRef} className='flex-1 overflow-y-auto p-4'>
        <AnimatePresence initial={false}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='space-y-4 pb-4'
          >
            {/* Initializing State */}
            {!isInitialized && (
              <div className='flex h-40 items-center justify-center'>
                <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
              </div>
            )}

            {/* Empty State */}
            {isInitialized && messages.length === 0 && !isLoading && !error && (
              <div className='text-muted-foreground flex h-full flex-col items-center justify-center p-8 text-center'>
                <BrainCircuit className='mb-4 h-12 w-12' />
                <p>Ask me anything about your finances!</p>
                <p className='mt-1 text-xs'>
                  E.g., &quot;Add 500 expense for groceries&quot;, &quot;Show my budget for
                  travel&quot;, &quot;List my savings accounts&quot;
                </p>
              </div>
            )}

            {/* Messages */}
            {isInitialized &&
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  <ChatMessageBubble message={message} />
                </motion.div>
              ))}

            {/* Loading Indicator */}
            {isLoading && isInitialized && (
              <motion.div
                key='loading'
                layout
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

            {/* Error Display */}
            {error && !isLoading && (
              <motion.div
                key='error'
                layout
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
                  <div className='bg-destructive/10 text-destructive border-destructive/30 max-w-[80%] space-y-1 rounded-lg border px-3 py-2 shadow-sm'>
                    <p className='text-sm font-semibold'>Assistant Error</p>
                    <p className='text-xs leading-relaxed whitespace-pre-wrap'>{error.message}</p>
                    <p className='pt-1 text-[10px] opacity-80'>
                      Try rephrasing your request or contact support if the issue persists.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </ScrollArea>

      {/* Input Area */}
      <div className='flex-shrink-0 border-t p-4'>
        <form onSubmit={handleSendMessage} className='relative flex w-full items-center'>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask about finances or request actions...'
            className='focus-visible:ring-ring flex-1 resize-none rounded-lg border p-2.5 pr-12 shadow-sm focus-visible:ring-1'
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-label='Chat input'
            style={{ maxHeight: '150px', overflowY: 'auto' }}
          />
          <Button
            type='submit'
            size='icon'
            disabled={isLoading || !input.trim()}
            className='absolute right-2.5 bottom-2.5 h-8 w-8 shrink-0 rounded-full'
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
