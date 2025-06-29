import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex min-h-full flex-col items-center justify-center text-center'>
      <h1 className='mb-4 text-5xl font-bold text-primary'>404 - Page Not Found</h1>
      <p className='mb-8 text-lg text-gray-600'>
        Oops! The page you are looking for does not exist.
      </p>
      <p className='mb-8 text-md text-gray-500'>
        It might have been moved or deleted. Please check the URL or try one of the links below.
      </p>
      <div className='flex space-x-4'>
        <Button asChild>
          <Link href='/dashboard'>Go to Dashboard</Link>
        </Button>
        <Button asChild variant='outline'>
          <Link href='/'>Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
