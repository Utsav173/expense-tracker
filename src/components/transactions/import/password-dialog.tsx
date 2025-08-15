import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';

interface PasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fileName?: string;
  password: string;
  setPassword: (password: string) => void;
  onSubmit: () => void;
  error: string | null;
  loading: boolean;
}

export const PasswordDialog = ({
  isOpen,
  onOpenChange,
  fileName,
  password,
  setPassword,
  onSubmit,
  error,
  loading
}: PasswordDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className='flex items-center text-xl'>
          <Icon name='keyRound' className='text-primary mr-2 h-5 w-5' />
          Password Required
        </DialogTitle>
        <DialogDescription>
          The file "<span className='text-foreground font-medium'>{fileName}</span>" is encrypted.
          Please enter its password to continue.
        </DialogDescription>
      </DialogHeader>
      <div className='space-y-2 py-4'>
        <Label htmlFor='password-input'>Password</Label>
        <Input
          id='password-input'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
          placeholder='Enter file password'
          autoFocus
        />
        {error && <p className='text-destructive text-sm'>{error}</p>}
      </div>
      <DialogFooter>
        <Button variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={loading || !password}>
          {loading ? (
            <>
              <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' /> Unlocking...
            </>
          ) : (
            <>
              <Icon name='keyRound' className='mr-2 h-4 w-4' /> Unlock & Continue
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
