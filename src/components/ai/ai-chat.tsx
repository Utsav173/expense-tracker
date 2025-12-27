'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageBubble } from './chat-message-bubble';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useToast } from '@/lib/hooks/useToast';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DefaultChatTransport } from 'ai';
import type { MyUIMessage } from '@/lib/ai-types';
import { SuggestionGroup } from './suggestion-group';
import { authClient } from '@/lib/auth-client';
import { aiGetSuggestions } from '@/lib/endpoints/ai';
import { PasswordDialog } from '@/components/transactions/import/password-dialog';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const;

interface FileUIPart {
  type: 'file';
  mediaType: string;
  url: string;
  filename?: string;
}

const convertFileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface AiChatProps {
  isFullPage?: boolean;
  pathname: string;
}

// PDF Helper function (copied/adapted from import page)
let pdfjsLibPromise: Promise<any> | null = null;
async function getPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsLibPromise;
}

async function extractTextFromPdf(file: File, password?: string) {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer, password });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText.trim();
  return fullText.trim();
}

interface Attachment {
  id: string;
  file: File;
  previewUrl?: string | null;
  extractedText?: string;
  isLocked?: boolean;
}

export const AiChat = ({ isFullPage = false, pathname }: AiChatProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const { showError, showSuccess, showInfo } = useToast();
  const { data: session } = authClient.useSession();
  const user = session?.user ?? null;

  const api = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    return base ? `${base}/ai/process` : '/api/ai/process';
  }, []);

  const transport = useMemo(() => new DefaultChatTransport({ api, credentials: 'include' }), [api]);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, setMessages, sendMessage, status, error, stop } = useChat<MyUIMessage>({
    id: sessionId,
    transport,
    onFinish: () => {
      setTimeout(() => textAreaRef.current?.focus(), 0);
    },
    onError: (err) => {
      const errorMessage = err?.message || 'Something went wrong.';
      if (errorMessage.includes('AI provider not configured')) {
        showInfo('Please set your AI provider in your profile settings to use the chat.');
      } else {
        showError(errorMessage);
      }
    }
  });

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [atBottom, setAtBottom] = useState(true);
  const [unread, setUnread] = useState(0);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isBusySubmitted = status === 'submitted';
  const isBusyStreaming = status === 'streaming';
  const isBusy = useMemo(
    () => isBusySubmitted || isBusyStreaming,
    [isBusySubmitted, isBusyStreaming]
  );

  const sendDisabled = useMemo(
    () =>
      isOffline ||
      isBusySubmitted ||
      (!isBusyStreaming && !input.trim() && attachments.length === 0),
    [isOffline, isBusySubmitted, isBusyStreaming, input, attachments]
  );

  const canClear = !isBusy;

  // Online/offline detection
  useEffect(() => {
    const handle = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handle);
    window.addEventListener('offline', handle);
    return () => {
      window.removeEventListener('online', handle);
      window.removeEventListener('offline', handle);
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  // Scroll tracking
  useEffect(() => {
    const root =
      (scrollAreaRef.current?.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement | null) || undefined;
    const target = messagesEndRef.current;
    if (!root || !target) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setAtBottom(visible);
        if (visible) setUnread(0);
      },
      { root, threshold: 1.0 }
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [scrollAreaRef, messagesEndRef]);

  // Auto scroll on new messages
  useEffect(() => {
    if (!atBottom) {
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant') setUnread((u) => u + 1);
      return;
    }
    messagesEndRef.current?.scrollIntoView({
      behavior: isBusyStreaming ? 'auto' : 'smooth',
      block: 'end'
    });
  }, [messages, atBottom, isBusyStreaming]);

  // Streaming timeout
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && status === 'streaming') {
      timer = setTimeout(() => {
        if (status === 'streaming') {
          stop();
        }
      }, 30000); // 30 seconds timeout
    }
    return () => {
      clearTimeout(timer);
    };
  }, [messages, status, stop]);

  // Cleanup attachment URLs
  useEffect(() => {
    return () => {
      attachments.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    };
  }, [attachments]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await aiGetSuggestions();
      if (res) {
        setDynamicSuggestions(res);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const getContextualSuggestions = useCallback((pathname: string): string[] => {
    if (pathname.includes('/budget')) {
      return [
        "What's my budget for this month?",
        'How am I doing on my budget?',
        'Show me my biggest expenses this month.'
      ];
    }
    if (pathname.includes('/transactions')) {
      return [
        'Show me my recent transactions.',
        'What was my biggest expense last week?',
        'How much did I spend on food this month?'
      ];
    }
    if (pathname.includes('/dashboard')) {
      return [
        'Give me a summary of my finances.',
        'What are my top spending categories?',
        'How much have I saved this year?'
      ];
    }
    return [];
  }, []);

  const { contextualSuggestions, generalSuggestions } = useMemo(() => {
    const contextual = getContextualSuggestions(pathname);
    const general = dynamicSuggestions.filter((s) => !contextual.includes(s));
    return {
      contextualSuggestions: contextual.slice(0, 3),
      generalSuggestions: general.slice(0, 3)
    };
  }, [pathname, dynamicSuggestions, getContextualSuggestions]);

  // Password Dialog State
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [filePassword, setFilePassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const processPdf = useCallback(async (file: File, password?: string): Promise<string | null> => {
    try {
      const text = await extractTextFromPdf(file, password);
      return text;
    } catch (error: any) {
      if (error?.name === 'PasswordException') {
        throw error; // Re-throw to handle in UI
      }
      console.error('PDF Parse Error:', error);
      return null;
    }
  }, []);

  const attachFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files) return;
      const arr = Array.from(files);
      const next: Attachment[] = [];

      for (const f of arr) {
        if (f.size > MAX_FILE_SIZE) {
          showError(`"${f.name}" is too large. Max 5MB.`);
          continue;
        }
        if (!ALLOWED_TYPES.includes(f.type as (typeof ALLOWED_TYPES)[number])) {
          showError(`Unsupported type: ${f.type || 'unknown'}`);
          continue;
        }

        const preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
        let attachment: Attachment = { id: crypto.randomUUID(), file: f, previewUrl: preview };

        if (f.type === 'application/pdf') {
          try {
            const text = await processPdf(f);
            if (text) {
              attachment.extractedText = text;
            }
          } catch (err: any) {
            if (err?.name === 'PasswordException') {
              attachment.isLocked = true;
              setPendingFile(f);
              setPasswordDialogOpen(true);
              return;
            }
          }
        }
        next.push(attachment);
      }
      if (next.length) setAttachments((prev) => [...prev, ...next]);
    },
    [showError, processPdf]
  );

  const handleUnlockSubmit = async () => {
    if (!pendingFile || !filePassword) return;
    setIsUnlocking(true);
    setPasswordError(null);
    try {
      const text = await processPdf(pendingFile, filePassword);
      if (text) {
        const attachment: Attachment = {
          id: crypto.randomUUID(),
          file: pendingFile,
          previewUrl: null,
          extractedText: text
        };
        setAttachments((prev) => [...prev, attachment]);
        setPasswordDialogOpen(false);
        setPendingFile(null);
        setFilePassword('');
      }
    } catch (err: any) {
      if (err?.name === 'PasswordException') {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        setPasswordError('Failed to unlock PDF.');
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const resetAttachments = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const toRemove = prev.find((a) => a.id === id);
      if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    attachFiles(e.target.files);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const file = event.clipboardData?.files?.[0];
    if (file) {
      event.preventDefault();
      attachFiles([file]);
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    attachFiles(event.dataTransfer?.files || null);
  };

  const handleSendMessage = useCallback(
    async (promptText?: string) => {
      const messageToSend = (promptText ?? input).trim();
      const isEmpty = !messageToSend && attachments.length === 0;
      const notReady = status !== 'ready' || isOffline;
      if (isEmpty || notReady) return;

      setInput('');
      if (textAreaRef.current) textAreaRef.current.style.height = 'auto';

      try {
        const fileParts: FileUIPart[] = [];
        let finalMessageText = messageToSend;

        if (attachments.length > 0) {
          const imageAttachments = attachments.filter((a) => a.file.type.startsWith('image/'));
          const pdfAttachments = attachments.filter((a) => a.file.type === 'application/pdf');

          // Process Images
          const imageParts = await Promise.all(
            imageAttachments.map(async (a) => ({
              type: 'file' as const,
              mediaType: a.file.type,
              url: await convertFileToDataURL(a.file),
              filename: a.file.name
            }))
          );
          fileParts.push(...imageParts);

          // Process Text-based files
          if (pdfAttachments.length > 0) {
            finalMessageText += '\n\n--- Attached Documents ---\n';
            for (const pdf of pdfAttachments) {
              if (pdf.extractedText) {
                finalMessageText += `\n[Document: ${pdf.file.name}]\n${pdf.extractedText}\n`;
              }
            }
          }
        }

        await sendMessage({
          text: finalMessageText || '(no message)',
          files: fileParts.length > 0 ? fileParts : undefined
        });
        fetchSuggestions();
      } finally {
        resetAttachments();
      }
    },
    [attachments, input, status, isOffline, sendMessage, resetAttachments, fetchSuggestions]
  );

  const handleStop = useCallback(() => {
    try {
      stop?.();
      showSuccess('Generation stopped.');
    } catch (err) {
      console.error('Stop error:', err);
    }
  }, [stop, showSuccess]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (status === 'streaming') {
        handleStop();
      } else {
        handleSendMessage();
      }
    } else if (event.key === 'Escape' && status === 'streaming') {
      handleStop();
    }
  };

  const regenerateLast = useCallback(() => {
    if (isBusy) return;
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    let textContent = '';
    const fileParts: FileUIPart[] = [];

    lastUserMessage.parts.forEach((part) => {
      if (part.type === 'text') {
        textContent += part.text;
      } else if (part.type === 'file') {
        fileParts.push({
          type: 'file',
          mediaType: part.mediaType || '',
          url: part.url,
          filename: part.filename
        });
      }
    });

    sendMessage({
      text: textContent,
      files: fileParts.length > 0 ? fileParts : undefined
    });
  }, [isBusy, messages, sendMessage]);

  const clearChat = useCallback(() => {
    const hasContent = messages.length > 0 || input.trim() || attachments.length > 0;
    if (isBusy || hasContent) {
      const confirmationMessage = isBusy
        ? 'A response is still generating. Stop and clear chat?'
        : 'Clear the chat and start a new session?';
      if (!window.confirm(confirmationMessage)) {
        return;
      }
      if (isBusy) stop?.();
    }
    resetAttachments();
    setInput('');
    setMessages([]);
    setSessionId(crypto.randomUUID());
    showSuccess('Chat session cleared.');
    setTimeout(() => textAreaRef.current?.focus(), 0);
  }, [
    isBusy,
    messages.length,
    input,
    attachments.length,
    stop,
    resetAttachments,
    setMessages,
    showSuccess
  ]);

  const handleConfirm = useCallback(
    (id: string) => {
      sendMessage({ text: `CONFIRM:${id}` });
    },
    [sendMessage]
  );

  const handleClarificationSelect = useCallback(
    (id: string) => {
      sendMessage({ text: `SELECT:${id}` });
    },
    [sendMessage]
  );

  const lastMessage = messages[messages.length - 1];
  const showSuggestions =
    messages.length > 0 &&
    lastMessage?.role === 'assistant' &&
    status === 'ready' &&
    dynamicSuggestions.length > 0;

  return (
    <div
      className={cn(
        'relative flex h-full max-h-full w-full flex-col overflow-hidden pt-4',
        isFullPage ? 'bg-transparent' : 'bg-card/80 rounded-2xl border shadow-xl backdrop-blur-sm'
      )}
    >
      {/* Messages Check */}
      {messages.length > 0 && (
        <div className='absolute top-1 right-3 z-10 flex items-center gap-1'>
          {isBusy && (
            <span className='text-muted-foreground text-xs select-none'>Generating...</span>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={regenerateLast}
                  disabled={isBusy || messages.length === 0}
                  className='h-8 w-8'
                >
                  <Icon name='reRun' className='h-4 w-4' />
                  <span className='sr-only'>Regenerate</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regenerate last answer</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={clearChat}
                  disabled={!canClear}
                  className='h-8 w-8'
                >
                  <Icon name='restart' className='h-4 w-4' />
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

      <div
        className='min-h-0 flex-1'
        onDragOver={(e) => {
          e.preventDefault();
          if (!isBusy && !isOffline) setIsDragging(true);
        }}
        onDragEnter={() => !isBusy && !isOffline && setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        aria-live='polite'
      >
        <ScrollArea ref={scrollAreaRef} className='scrollbar h-full w-full'>
          <div className='mx-auto w-full max-w-5xl space-y-8 px-4 py-6'>
            <AnimatePresence initial={false}>
              {messages.length === 0 && !isBusy && !error && !isOffline && (
                <motion.div
                  key='welcome'
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
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
                  <div className='w-full max-w-md space-y-4'>
                    <SuggestionGroup
                      icon='sparkles'
                      suggestions={generalSuggestions}
                      onSuggestionClick={handleSendMessage}
                    />
                  </div>
                </motion.div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  layout={!prefersReducedMotion}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className='relative w-full'
                >
                  <ChatMessageBubble
                    message={message}
                    isStreaming={isBusyStreaming && index === messages.length - 1}
                    user={user}
                    onConfirm={handleConfirm}
                    onClarificationSelect={handleClarificationSelect}
                  />
                </motion.div>
              ))}

              {status === 'submitted' && (
                <motion.div
                  key='thinking-indicator'
                  layout={!prefersReducedMotion}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  role='status'
                  aria-live='polite'
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

              {error && (
                <motion.div
                  key='error-message'
                  layout={!prefersReducedMotion}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChatMessageBubble
                    message={{
                      id: 'error',
                      role: 'assistant',
                      parts: [
                        {
                          type: 'text',
                          text: `Assistant Error:\n\n${error.message}`
                        }
                      ]
                    }}
                    user={user}
                  />
                  <div className='mt-2 flex gap-2 pl-11'>
                    <Button variant='secondary' size='sm' onClick={regenerateLast}>
                      Retry
                    </Button>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </AnimatePresence>
          </div>
        </ScrollArea>

        {isDragging && !isOffline && !isBusy && (
          <div className='border-primary/40 bg-background/70 pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed backdrop-blur'>
            <div className='bg-primary/10 text-primary flex items-center gap-2 rounded-full px-4 py-2 text-sm'>
              <Icon name='paperclip' className='h-4 w-4' />
              Drop files to attach
            </div>
          </div>
        )}
      </div>

      {!atBottom && (
        <Button
          onClick={() =>
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
          }
          className='absolute right-4 bottom-28 z-20 rounded-full px-3 py-1 text-xs shadow-lg'
          variant='secondary'
        >
          <Icon name='chevronDown' className='mr-1 h-4 w-4' />
          {unread > 0 ? `${unread} new` : 'Scroll to latest'}
        </Button>
      )}

      {isOffline && (
        <div className='mx-4 mb-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-center text-xs text-amber-800'>
          You're offline. Messages can't be sent until connection is restored.
        </div>
      )}

      <div className='mx-auto w-full max-w-4xl p-4'>
        {showSuggestions && (
          <div className='mb-4 space-y-4'>
            <SuggestionGroup
              title='Contextual Suggestions'
              icon='lightbulb'
              suggestions={contextualSuggestions}
              onSuggestionClick={handleSendMessage}
            />
          </div>
        )}
        {attachments.length > 0 && (
          <div className='mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4'>
            {attachments.map((a) => (
              <div key={a.id} className='relative rounded-lg border p-2'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute top-1 right-1 h-6 w-6 rounded-full'
                  onClick={() => removeAttachment(a.id)}
                  aria-label='Remove attachment'
                >
                  <Icon name='x' className='h-4 w-4' />
                </Button>
                {a.previewUrl ? (
                  <div className='relative aspect-video w-full overflow-hidden rounded-md'>
                    <Image src={a.previewUrl} alt={a.file.name} fill className='object-cover' />
                  </div>
                ) : (
                  <div className='flex items-center gap-3'>
                    <Icon name='fileText' className='text-muted-foreground h-8 w-8 shrink-0' />
                    <p className='truncate text-sm font-medium'>{a.file.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            'bg-background relative flex w-full items-end rounded-xl border p-2 shadow-sm transition-colors',
            attachments.length > 0 && 'border-primary',
            isDragging && 'ring-primary/40 ring-2'
          )}
        >
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8 shrink-0 rounded-full'
            aria-label='Upload files'
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy || isOffline}
            title={isOffline ? 'Offline' : undefined}
          >
            <Icon name='paperclip' className='h-4 w-4' />
          </Button>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept={ALLOWED_TYPES.join(',')}
            className='hidden'
          />
          <textarea
            ref={textAreaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            placeholder={
              attachments.length > 0
                ? 'Add a comment... (optional)'
                : isOffline
                  ? 'You are offline...'
                  : 'Ask about finances or upload files...'
            }
            className='placeholder:text-muted-foreground no-scrollbar flex-1 resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-sm focus:outline-none'
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={isBusySubmitted || isOffline}
            aria-label='Chat input'
            aria-disabled={isBusySubmitted || isOffline}
            style={{ maxHeight: '150px' }}
          />
          <Button
            type='button'
            size='icon'
            disabled={sendDisabled}
            className='h-8 w-8 shrink-0 rounded-full'
            aria-label={
              isBusyStreaming
                ? 'Stop generating'
                : isBusySubmitted
                  ? 'Submitting...'
                  : 'Send message'
            }
            onClick={isBusyStreaming ? handleStop : () => handleSendMessage()}
            title={isOffline ? 'Offline' : undefined}
          >
            {isBusyStreaming ? (
              <Icon name='x' className='h-4 w-4' />
            ) : isBusySubmitted ? (
              <Icon name='loader2' className='h-4 w-4 animate-spin' />
            ) : (
              <Icon name='send' className='h-4 w-4' />
            )}
          </Button>
        </div>

        <div className='text-muted-foreground mt-1 text-[11px]'>
          Press Enter to send • Shift+Enter for newline
        </div>
      </div>

      <PasswordDialog
        isOpen={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        fileName={pendingFile?.name}
        password={filePassword}
        setPassword={setFilePassword}
        onSubmit={handleUnlockSubmit}
        error={passwordError}
        loading={isUnlocking}
      />
    </div>
  );
};
