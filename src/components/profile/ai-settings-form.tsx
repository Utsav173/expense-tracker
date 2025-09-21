'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { getSettings, updateAiProviderSettings } from '@/lib/endpoints/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { Icon } from '../ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '@/components/ui/slider';
import { aiGetAvailableProviders, AIProvider } from '@/lib/endpoints/ai';
import { Input } from '@/components/ui/input';
import type { UserAPI } from '@/lib/api/api-types';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { IconName } from '../ui/icon-map';
import { GroqLogo, DeepSeekLogo } from '../ui/social-logos';

const safetyThresholds = [
  { value: 'BLOCK_NONE', label: 'Allow All' },
  { value: 'BLOCK_ONLY_HIGH', label: 'High Safety' },
  { value: 'BLOCK_MEDIUM_AND_ABOVE', label: 'Medium Safety' },
  { value: 'BLOCK_LOW_AND_ABOVE', label: 'Highest Safety' }
];

const providerOrder: UserAPI.UserSettings['ai']['providerId'][] = [
  'google',
  'openai',
  'anthropic',
  'groq',
  'deepseek',
  'qwen'
];

const ProviderCard = ({ provider, isSelected }: { provider: AIProvider; isSelected: boolean }) => {
  const renderIcon = () => {
    switch (provider.id) {
      case 'groq':
        return <GroqLogo className='h-8 w-8' />;
      case 'deepseek':
        return <DeepSeekLogo className='h-8 w-8' />;
      default:
        return <Icon name={provider.id as IconName} className='h-8 w-8' />;
    }
  };

  return (
    <Label
      htmlFor={provider.id}
      className={cn(
        'hover:border-primary/50 flex h-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 p-4 transition-all duration-200',
        isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card'
      )}
    >
      <RadioGroupItem value={provider.id} id={provider.id} className='sr-only' />
      {renderIcon()}
      <span className='text-sm font-semibold'>{provider.name}</span>
    </Label>
  );
};

const StepIndicator = ({ step, title, icon }: { step: number; title: string; icon: IconName }) => (
  <div className='flex items-center gap-4'>
    <div className='bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold'>
      {step}
    </div>
    <div className='flex items-center gap-2'>
      <Icon name={icon} className='text-primary h-5 w-5' />
      <h3 className='text-base font-semibold'>{title}</h3>
    </div>
  </div>
);

export const AiSettingsForm = () => {
  const {
    data: settings,
    isLoading: isLoadingSettings,
    refetch
  } = useQuery<UserAPI.GetSettingsResponse>({
    queryKey: ['userSettings'],
    queryFn: getSettings
  });
  const { data: availableProviders, isLoading: isLoadingProviders } = useQuery<AIProvider[]>({
    queryKey: ['availableAiProviders'],
    queryFn: aiGetAvailableProviders,
    staleTime: 24 * 60 * 60 * 1000
  });

  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const [selectedProviderId, setSelectedProviderId] =
    useState<UserAPI.UserSettings['ai']['providerId']>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [safetySettings, setSafetySettings] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isRemoveKeyConfirmOpen, setIsRemoveKeyConfirmOpen] = useState(false);

  const sortedProviders = useMemo(() => {
    if (!availableProviders) return [];
    return [...availableProviders].sort((a, b) => {
      return providerOrder.indexOf(a.id) - providerOrder.indexOf(b.id);
    });
  }, [availableProviders]);

  const availableModels = useMemo(() => {
    if (!selectedProviderId || !sortedProviders) return [];
    return sortedProviders.find((p) => p.id === selectedProviderId)?.models || [];
  }, [selectedProviderId, sortedProviders]);

  useEffect(() => {
    if (settings) {
      const { ai, hasAiApiKey } = settings;
      setIsEditing(!hasAiApiKey);
      setSelectedProviderId(ai?.providerId || null);
      setSelectedModelId(ai?.modelId || null);
      setTemperature(ai?.providerOptions?.temperature ?? 0.7);
      setSafetySettings(
        ai?.providerOptions?.google?.safetySettings?.reduce(
          (acc: Record<string, string>, setting: { category: string; threshold: string }) => {
            acc[setting.category] = setting.threshold;
            return acc;
          },
          {}
        ) || {}
      );
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: updateAiProviderSettings,
    onSuccess: (data) => {
      showSuccess(data?.message || 'AI Settings updated!');
      invalidate(['userSettings', 'user']);
      refetch();
      setApiKeyInput('');
      setIsEditing(false);
    },
    onError: (err: any) => showError(err.message)
  });

  const handleSave = () => {
    if (!selectedProviderId) return showError('Please select an AI provider.');
    if (!selectedModelId) return showError('Please select a model.');
    if (!settings?.hasAiApiKey && !apiKeyInput.trim())
      return showError('Please enter your API key.');

    const providerOptions: UserAPI.UserSettings['ai']['providerOptions'] = { temperature };
    if (selectedProviderId === 'google' && Object.keys(safetySettings).length > 0) {
      providerOptions.google = {
        safetySettings: Object.entries(safetySettings).map(([category, threshold]) => ({
          category,
          threshold
        }))
      };
    }

    mutation.mutate({
      providerId: selectedProviderId,
      apiKey: apiKeyInput.trim() || undefined,
      modelId: selectedModelId,
      providerOptions
    });
  };

  const handleRemove = () => {
    mutation.mutate({ providerId: null, apiKey: null, modelId: null });
    setIsRemoveKeyConfirmOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setApiKeyInput('');
    if (settings) {
      const { ai } = settings;
      setSelectedProviderId(ai?.providerId || null);
      setSelectedModelId(ai?.modelId || null);
      setTemperature(ai?.providerOptions?.temperature ?? 0.7);
      setSafetySettings(
        ai?.providerOptions?.google?.safetySettings?.reduce(
          (acc: Record<string, string>, setting: { category: string; threshold: string }) => {
            acc[setting.category] = setting.threshold;
            return acc;
          },
          {}
        ) || {}
      );
    }
  };

  const currentProvider = availableProviders?.find((p) => p.id === selectedProviderId);

  if (isLoadingSettings || isLoadingProviders) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-56' />
          <Skeleton className='h-4 w-80' />
        </CardHeader>
        <CardContent className='space-y-6 pt-6'>
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-48 w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant Configuration</CardTitle>
        <CardDescription>
          Choose your provider and enter your API key to power your financial assistant.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-8'>
        <Alert>
          <Icon name='shield' className='h-4 w-4' />
          <AlertTitle>Your Privacy is Our Priority</AlertTitle>
          <AlertDescription>
            We use a "Bring Your Own Key" model. Your API key is encrypted and never logged. All AI
            requests are proxied securely from our backend.
          </AlertDescription>
        </Alert>

        {!isEditing && settings?.hasAiApiKey ? (
          <div className='space-y-4'>
            <div className='bg-muted/30 rounded-lg border p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Icon
                    name={(selectedProviderId as IconName) || 'checkCircle'}
                    className='text-primary h-8 w-8'
                  />
                  <div>
                    <p className='font-semibold'>{currentProvider?.name} Connected</p>
                    <p className='text-muted-foreground text-sm'>
                      Model: {selectedModelId || 'Not Set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className='flex justify-end gap-2 border-t pt-6'>
              <Button variant='destructive' onClick={() => setIsRemoveKeyConfirmOpen(true)}>
                <Icon name='trash' className='mr-2 h-4 w-4' /> Disconnect
              </Button>
              <Button variant='outline' onClick={() => setIsEditing(true)}>
                <Icon name='edit' className='mr-2 h-4 w-4' /> Edit Configuration
              </Button>
            </div>
          </div>
        ) : (
          <div className='relative md:pl-4'>
            <motion.div
              className='bg-border absolute top-10 left-8 hidden h-full w-0.5 md:block'
              initial={{ height: 0 }}
              animate={{ height: selectedProviderId ? 'calc(100% - 8rem)' : '0' }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
            <div className='flex flex-col gap-8'>
              <div className='relative space-y-4'>
                <StepIndicator step={1} title='Choose Your AI Provider' icon='sparkles' />
                <div className='md:pl-12'>
                  <RadioGroup
                    value={selectedProviderId || ''}
                    onValueChange={(value) => {
                      if (value) {
                        setSelectedProviderId(value as UserAPI.UserSettings['ai']['providerId']);
                        const newProvider = sortedProviders?.find((p) => p.id === value);
                        setSelectedModelId(newProvider?.models[0]?.id || null);
                      }
                    }}
                    className='grid grid-cols-2 gap-3'
                    disabled={mutation.isPending}
                  >
                    {sortedProviders?.map((p) => (
                      <ProviderCard
                        key={p.id}
                        provider={p}
                        isSelected={selectedProviderId === p.id}
                      />
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <AnimatePresence>
                {selectedProviderId && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className='relative space-y-8'
                  >
                    <div className='space-y-4'>
                      <StepIndicator step={2} title='Configure Model & Key' icon='keyRound' />
                      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:pl-12'>
                        <div>
                          <Label htmlFor='model-select' className='text-sm'>
                            Model
                          </Label>
                          <Select
                            value={selectedModelId || ''}
                            onValueChange={setSelectedModelId}
                            disabled={mutation.isPending || !selectedProviderId}
                          >
                            <SelectTrigger id='model-select'>
                              <SelectValue placeholder='Select a model' />
                            </SelectTrigger>
                            <SelectContent>
                              {availableModels.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor='api-key' className='text-sm'>
                            API Key
                          </Label>
                          <PasswordInput
                            id='api-key'
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder={
                              settings?.hasAiApiKey
                                ? 'Leave blank to keep existing'
                                : 'Enter API key'
                            }
                            disabled={mutation.isPending}
                          />
                        </div>
                      </div>
                    </div>
                    <div className='space-y-4'>
                      <StepIndicator
                        step={3}
                        title='Advanced Options (Optional)'
                        icon='settings2'
                      />
                      <div className='md:pl-12'>
                        <Accordion type='single' collapsible className='w-full'>
                          <AccordionItem value='item-1'>
                            <AccordionTrigger>Model Parameters</AccordionTrigger>
                            <AccordionContent className='space-y-6 pt-4'>
                              <div>
                                <Label className='flex items-center justify-between text-sm'>
                                  <span>Temperature</span>
                                  <span className='text-muted-foreground'>{temperature}</span>
                                </Label>
                                <div className='flex items-center gap-2 pt-2'>
                                  <Icon
                                    name='sparkles'
                                    className='h-4 w-4 text-sky-500'
                                    title='Precise'
                                  />
                                  <Slider
                                    value={[temperature]}
                                    onValueChange={([val]) => setTemperature(val)}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    disabled={mutation.isPending}
                                  />
                                  <Icon
                                    name='wand2'
                                    className='h-4 w-4 text-amber-500'
                                    title='Creative'
                                  />
                                </div>
                              </div>
                              {selectedProviderId === 'google' && (
                                <div className='space-y-4'>
                                  <Label className='font-medium'>Google Safety Settings</Label>
                                  {[
                                    'HARM_CATEGORY_HARASSMENT',
                                    'HARM_CATEGORY_HATE_SPEECH',
                                    'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                                    'HARM_CATEGORY_DANGEROUS_CONTENT'
                                  ].map((category) => (
                                    <div key={category}>
                                      <Label className='text-xs capitalize'>
                                        {category.replace('HARM_CATEGORY_', '').toLowerCase()}
                                      </Label>
                                      <Select
                                        value={safetySettings[category] || 'BLOCK_MEDIUM_AND_ABOVE'}
                                        onValueChange={(value) =>
                                          setSafetySettings((prev) => ({
                                            ...prev,
                                            [category]: value
                                          }))
                                        }
                                        disabled={mutation.isPending}
                                      >
                                        <SelectTrigger className='h-8 text-xs'>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {safetyThresholds.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                              {opt.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className='flex items-center justify-between border-t pt-6'>
              {currentProvider ? (
                <a
                  href={currentProvider.docsUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline'
                >
                  <Icon name='keyRound' className='h-4 w-4' />
                  Get your {currentProvider.name} key
                </a>
              ) : (
                <div />
              )}
              <div className='flex gap-2'>
                {settings?.hasAiApiKey && (
                  <Button variant='ghost' onClick={handleCancelEdit} disabled={mutation.isPending}>
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={mutation.isPending || !selectedProviderId || !selectedModelId}
                >
                  {mutation.isPending ? (
                    <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Icon name='save' className='mr-2 h-4 w-4' />
                  )}
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <DeleteConfirmationModal
        title='Remove AI API Key'
        description='Are you sure? This will disable all AI features and remove your current settings.'
        onConfirm={handleRemove}
        open={isRemoveKeyConfirmOpen}
        onOpenChange={setIsRemoveKeyConfirmOpen}
      />
    </Card>
  );
};
