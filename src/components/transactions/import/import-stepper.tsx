import { Icon } from '@/components/ui/icon';
import { IconName } from '@/components/ui/icon-map';
import { cn } from '@/lib/utils';

const steps: Array<{ id: number; name: string; icon: IconName; description: string }> = [
  { id: 1, name: 'Upload', icon: 'upload', description: 'Choose your file' },
  { id: 2, name: 'Review', icon: 'fileText', description: 'Verify transactions' },
  { id: 3, name: 'Complete', icon: 'checkCircle2', description: 'Finalize import' }
];

interface ImportStepperProps {
  currentStep: number;
}

export const ImportStepper = ({ currentStep }: ImportStepperProps) => (
  <div className='flex items-center justify-center space-x-4 md:space-x-8'>
    {steps.map((step) => (
      <div key={step.id} className='flex flex-col items-center text-center'>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
            currentStep >= step.id
              ? 'border-primary bg-primary text-primary-foreground shadow-lg'
              : 'border-border bg-card text-muted-foreground'
          )}
        >
          <Icon name={step.icon} className='h-6 w-6' />
        </div>
        <div className='mt-2'>
          <p
            className={cn(
              'text-sm font-medium',
              currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {step.name}
          </p>
          <p className='text-muted-foreground text-xs'>{step.description}</p>
        </div>
      </div>
    ))}
  </div>
);
