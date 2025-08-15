import { Icon } from '@/components/ui/icon';

export const ImportHeader = () => (
  <div className='text-center'>
    <div className='bg-primary mb-4 inline-flex items-center justify-center rounded-full p-3'>
      <Icon name='database' className='text-primary-foreground h-8 w-8' />
    </div>
    <h1 className='text-foreground text-3xl font-bold md:text-4xl'>Import Transactions</h1>
    <p className='text-muted-foreground mx-auto mt-2 max-w-2xl text-base'>
      Seamlessly import your financial data with AI-powered processing and intelligent
      categorization.
    </p>
  </div>
);
