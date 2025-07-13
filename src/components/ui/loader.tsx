import { cn } from '@/lib/utils';
import { ScaleLoader } from 'react-spinners';

const Loader = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex h-full w-full items-center justify-center', className)}>
      <ScaleLoader color='var(--primary)' />
    </div>
  );
};

export default Loader;
