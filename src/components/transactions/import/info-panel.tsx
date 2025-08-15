import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icon } from '@/components/ui/icon';
import { IconName } from '@/components/ui/icon-map';

const InfoCard = ({
  icon,
  iconBg,
  iconColor,
  title,
  items
}: {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  title: string;
  items: string[];
}) => (
  <Card>
    <CardContent className='p-4'>
      <div className='mb-3 flex items-center'>
        <div className={`rounded-full p-2 ${iconBg}`}>
          <Icon name={icon} className={`h-5 w-5 ${iconColor}`} />
        </div>
        <h3 className='text-foreground font-semibold'>{title}</h3>
      </div>
      <ul className='text-muted-foreground space-y-1.5 pl-4 text-sm'>
        {items.map((item, index) => (
          <li key={index} className='flex items-start'>
            <Icon name='checkCircle2' className='text-success mt-1 mr-2 h-4 w-4 shrink-0' />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export const InfoPanel = () => (
  <div className='space-y-6'>
    <InfoCard
      icon='sparkles'
      iconBg='bg-primary-muted'
      iconColor='text-primary'
      title='AI-Powered Processing'
      items={[
        'Intelligent PDF text extraction',
        'Automatic transaction categorization',
        'Smart data validation and cleanup'
      ]}
    />
    <InfoCard
      icon='shield'
      iconBg='bg-success-muted'
      iconColor='text-success'
      title='Secure & Private'
      items={[
        'Your data is processed securely',
        'Password-protected files are supported',
        'No financial data is stored after import'
      ]}
    />
    <Alert variant='default'>
      <Icon name='alertCircle' className='h-4 w-4' />
      <AlertTitle>Pro Tips</AlertTitle>
      <AlertDescription>
        For best results, use our Excel template. PDF processing is powered by AI and may require
        review before final import.
      </AlertDescription>
    </Alert>
  </div>
);
