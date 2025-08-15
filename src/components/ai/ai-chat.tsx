'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAiChat } from '@/components/ai/hooks/useAiChat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageBubble } from './chat-message-bubble';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useToast } from '@/lib/hooks/useToast';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const PromptSuggestion = ({ text, onClick }: { text: string; onClick: () => void }) => (
  <motion.button
    whileHover={{ x: 2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 600, damping: 15 }}
    onClick={onClick}
    className='group bg-background hover:bg-muted flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all hover:shadow-sm'
  >
    <Icon
      name='sparkles'
      className='text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0 transition-colors'
    />
    <span className='flex-1 text-purple-800 dark:text-indigo-300'>{text}</span>
    <Icon
      name='arrowRight'
      className='text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100'
    />
  </motion.button>
);

export const AiChat = ({ isFullPage = false }: { isFullPage?: boolean }) => {
  const { messages, sendMessage, isLoading, isStreaming, error, clearChat } = useAiChat();
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(scrollToBottom, [messages, isStreaming, isLoading]);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  const resetFileInput = useCallback(() => {
    setAttachedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [filePreview]);

  const handleSendMessage = useCallback(
    async (promptText?: string) => {
      const messageToSend = promptText || input;
      if ((!messageToSend.trim() && !attachedFile) || isLoading || isStreaming) return;

      setInput('');
      if (textAreaRef.current) textAreaRef.current.style.height = 'auto';

      if (attachedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          const fileType = attachedFile.type;
          const payload: Parameters<typeof sendMessage>[0] = {
            prompt: messageToSend || `Analyze this file and extract financial data.`,
            documentName: attachedFile.name
          };

          if (fileType.startsWith('image/')) {
            payload.base64Image = base64String;
          } else if (fileType === 'application/pdf') {
            payload.documentContent = base64String;
            payload.documentType = 'pdf';
          } else if (
            fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ) {
            payload.documentContent = base64String;
            payload.documentType = 'xlsx';
          }
          sendMessage(payload);
          resetFileInput();
        };
        reader.onerror = () => {
          showError('Failed to read the file.');
          resetFileInput();
        };
        reader.readAsDataURL(attachedFile);
      } else {
        await sendMessage({ prompt: messageToSend });
      }
    },
    [input, attachedFile, isLoading, isStreaming, sendMessage, resetFileInput, showError]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('File is too large. Please select a file smaller than 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAttachedFile(file);
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const suggestions = [
    'Add an expense of 500 for groceries',
    'What was my total spending last month?',
    "Show me all transactions in my 'Travel' budget"
  ];

  const isInputDisabled = isLoading || isStreaming;
  const lastMessage = messages[messages.length - 1];
  const showFollowUps =
    lastMessage?.role === 'assistant' &&
    !isStreaming &&
    lastMessage.followUpPrompts &&
    lastMessage.followUpPrompts.length > 0;

  return (
    <div
      className={cn(
        'relative flex h-full max-h-full w-full flex-col overflow-hidden',
        isFullPage ? 'bg-transparent' : 'bg-card/80 rounded-2xl border shadow-xl backdrop-blur-sm'
      )}
    >
      {messages.length > 0 && (
        <div className='absolute top-3 right-3 z-10'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={clearChat}
                  disabled={isInputDisabled}
                  className='h-8 w-8'
                >
                  <Icon name='history' className='h-4 w-4' />
                  <span className='sr-only'>Reset Chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset Chat & Start New Session</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <div className='min-h-0 flex-1 [mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]'>
        <ScrollArea className='scrollbar h-full w-full'>
          <div className='mx-auto w-full max-w-5xl space-y-8 px-4 py-6'>
            <AnimatePresence initial={false}>
              {messages.length === 0 && !isInputDisabled && !error && (
                <motion.div
                  key='welcome'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className='text-muted-foreground flex h-full flex-col items-center justify-center p-8 text-center'
                >
                  <div className='bg-primary/10 mb-4 rounded-full p-3'>
                    <Icon name='wand2' className='text-primary h-8 w-8' />
                  </div>
                  <h3 className='text-foreground text-xl font-semibold'>
                    How can I help you today?
                  </h3>
                  <p className='mt-2 mb-6 text-sm'>
                    You can ask me to add transactions, check your budget, or upload a receipt, PDF,
                    or XLSX file.
                  </p>
                  <div className='w-full max-w-md space-y-2'>
                    {suggestions.map((s, i) => (
                      <motion.div
                        key={s}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                      >
                        <PromptSuggestion text={s} onClick={() => handleSendMessage(s)} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  <ChatMessageBubble
                    message={message}
                    isStreaming={isStreaming && index === messages.length - 1}
                  />
                </motion.div>
              ))}

              {isLoading && !isStreaming && (
                <motion.div
                  key='thinking-indicator'
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className='flex items-end justify-start space-x-3'>
                    <Avatar className='h-8 w-8 shrink-0 border'>
                      <AvatarFallback className='bg-muted'>
                        <Icon name='ai' className='h-4 w-4' />
                      </AvatarFallback>
                    </Avatar>
                    <div className='bg-muted flex items-center space-x-1.5 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm'>
                      <div className='bg-muted-foreground h-2 w-2 animate-pulse rounded-full [animation-delay:-0.3s]'></div>
                      <div className='bg-muted-foreground h-2 w-2 animate-pulse rounded-full [animation-delay:-0.15s]'></div>
                      <div className='bg-muted-foreground h-2 w-2 animate-pulse rounded-full'></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {error && !isLoading && (
                <motion.div
                  key='error-message'
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChatMessageBubble
                    message={{
                      id: 'error',
                      role: 'assistant',
                      content: `**Assistant Error:**\n\n${error.message}\n\n*Please try rephrasing your request or check your API key settings.*`,
                      message: `**Assistant Error:**\n\n${error.message}\n\n*Please try rephrasing your request or check your API key settings.*`
                    }}
                  />
                </motion.div>
              )}

              {showFollowUps && (
                <motion.div
                  key='follow-ups'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className='flex flex-col items-end'
                >
                  <div className='w-full max-w-[85%] space-y-2'>
                    {lastMessage.followUpPrompts?.map((prompt: string, index: number) => (
                      <motion.div
                        key={`follow-up-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.1 + index * 0.1,
                          ease: 'easeOut'
                        }}
                      >
                        <PromptSuggestion text={prompt} onClick={() => handleSendMessage(prompt)} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      <div className='mx-auto w-full max-w-4xl p-4'>
        {attachedFile && (
          <div className='bg-muted/50 relative mb-2 rounded-lg border p-2 pr-8'>
            <Button
              variant='ghost'
              size='icon'
              className='absolute top-1 right-1 h-6 w-6 rounded-full'
              onClick={resetFileInput}
            >
              <Icon name='x' className='h-4 w-4' />
            </Button>
            {filePreview ? (
              <Image
                src={filePreview}
                alt='File preview'
                width={80}
                height={80}
                className='h-16 w-16 rounded-md object-cover'
              />
            ) : (
              <div className='flex items-center gap-3'>
                <Icon name='fileText' className='text-muted-foreground h-8 w-8 shrink-0' />
                <p className='truncate text-sm font-medium'>{attachedFile.name}</p>
              </div>
            )}
          </div>
        )}
        <div
          className={cn(
            'bg-background relative flex w-full items-end rounded-xl border p-2 shadow-sm transition-colors',
            attachedFile && 'border-primary'
          )}
        >
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8 shrink-0 rounded-full'
            aria-label='Upload file'
            onClick={() => fileInputRef.current?.click()}
            disabled={isInputDisabled}
          >
            <Icon name='paperclip' className='h-4 w-4' />
          </Button>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileChange}
            accept='image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            className='hidden'
          />
          <textarea
            ref={textAreaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              attachedFile
                ? 'Add a comment... (optional)'
                : 'Ask about finances or upload a file...'
            }
            className='placeholder:text-muted-foreground no-scrollbar flex-1 resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-sm focus:outline-none'
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={isInputDisabled}
            aria-label='Chat input'
            style={{ maxHeight: '150px' }}
          />
          <Button
            type='button'
            size='icon'
            disabled={isInputDisabled || (!input.trim() && !attachedFile)}
            className='h-8 w-8 shrink-0 rounded-full'
            aria-label='Send message'
            onClick={() => handleSendMessage()}
          >
            {isLoading || isStreaming ? (
              <Icon name='loader2' className='h-4 w-4 animate-spin' />
            ) : (
              <Icon name='send' className='h-4 w-4' />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
