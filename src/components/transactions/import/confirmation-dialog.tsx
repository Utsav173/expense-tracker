import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
  stagedCount: number;
}

export const ConfirmationDialog = ({
  isOpen,
  onOpenChange,
  onConfirm,
  loading,
  stagedCount
}: ConfirmationDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className='flex items-center text-xl'>
          <Icon name='checkCircle2' className='text-success mr-2 h-5 w-5' />
          Final Confirmation
        </DialogTitle>
        <DialogDescription>
          <span className='text-primary font-semibold'>{stagedCount}</span> transactions are staged
          and ready. This action will add them to your account and cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
          Cancel
        </Button>
        <Button variant='success' onClick={onConfirm} disabled={loading}>
          {loading ? (
            <>
              <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' /> Importing...
            </>
          ) : (
            <>
              <Icon name='checkCircle2' className='mr-2 h-4 w-4' /> Confirm Import
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
