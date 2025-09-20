import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icon } from '@/components/ui/icon';
import { IconName } from '@/components/ui/icon-map';

type FeatureHighlightProps = {
  icon: IconName;
  title: string;
  items: string[];
  variant?: 'primary' | 'success';
};

const FeatureHighlight = ({ icon, title, items, variant = 'primary' }: FeatureHighlightProps) => {
  const iconContainerClasses = {
    primary: 'bg-primary/10',
    success: 'bg-green-100 dark:bg-green-900/50'
  };
  const iconClasses = {
    primary: 'text-primary',
    success: 'text-green-600 dark:text-green-400'
  };

  return (
    <div>
      <div className='mb-4 flex items-center gap-3'>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${iconContainerClasses[variant]}`}
        >
          <Icon name={icon} className={`h-5 w-5 ${iconClasses[variant]}`} />
        </div>
        <h3 className='text-foreground text-base font-semibold text-nowrap'>{title}</h3>
      </div>
      <ul className='text-muted-foreground space-y-2 pl-3 text-sm'>
        {items.map((item, index) => (
          <li key={index} className='flex items-start'>
            <Icon name='checkCircle2' className='mt-1 mr-2 h-4 w-4 shrink-0 text-green-500' />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const InfoPanel = () => (
  <div className='w-full py-3'>
    <div className='mx-auto flex flex-row gap-8 max-sm:flex-col max-sm:items-center'>
      <FeatureHighlight
        icon='sparkles'
        title='AI-Powered Processing'
        items={[
          'Intelligent text extraction from PDFs.',
          'Automatic categorization of transactions.',
          'Smart data validation and cleanup.'
        ]}
        variant='primary'
      />
      <FeatureHighlight
        icon='shield'
        title='Secure & Private'
        items={[
          'Your data is processed securely over HTTPS.',
          'Password-protected files are supported.',
          'Financial data is never stored after import.'
        ]}
        variant='success'
      />
    </div>

    <div className='mt-6 w-full border-t pt-6'>
      <Alert>
        <Icon name='info' className='h-4 w-4' />
        <AlertTitle>Pro Tips for Best Results</AlertTitle>
        <AlertDescription>
          For guaranteed accuracy, upload statements using our Excel template. AI-powered PDF
          processing is powerful, but we recommend a quick review before finalizing the import.
        </AlertDescription>
      </Alert>
    </div>
  </div>
);
