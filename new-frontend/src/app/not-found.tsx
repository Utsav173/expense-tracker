import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex min-h-[95vh] flex-col items-center justify-center'>
      <h1 className='mb-4 text-5xl font-bold'>404</h1>
      <p className='mb-8 text-lg text-gray-600'>Page not found</p>
      <Button asChild>
        <Link href='/'>Back to Home</Link>
      </Button>
    </div>
  );
}
