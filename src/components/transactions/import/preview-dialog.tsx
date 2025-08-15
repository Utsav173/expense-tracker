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
import { ImportPreviewTable } from '@/components/transactions/import-preview-table';
import { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { useMemo, Dispatch, SetStateAction } from 'react';

interface PreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: any[];
  rowSelection: RowSelectionState;
  setRowSelection: Dispatch<SetStateAction<RowSelectionState>>;
  onConfirm: () => void;
  loading: boolean;
}

export const PreviewDialog = ({
  isOpen,
  onOpenChange,
  transactions,
  rowSelection,
  setRowSelection,
  onConfirm,
  loading
}: PreviewDialogProps) => {
  const previewColumns: ColumnDef<any>[] = useMemo(
    () => [
      { accessorKey: 'Date', header: 'Date' },
      { accessorKey: 'Text', header: 'Description' },
      { accessorKey: 'Amount', header: 'Amount' },
      { accessorKey: 'Type', header: 'Type' },
      { accessorKey: 'Category', header: 'Category' },
      { accessorKey: 'Transfer', header: 'Transfer' }
    ],
    []
  );

  const selectedRowCount = Object.keys(rowSelection).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-6xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center text-xl'>
            <Icon name='fileText' className='text-primary mr-2 h-5 w-5' />
            Review Transactions
          </DialogTitle>
          <DialogDescription>
            Select the transactions you want to import. Deselect any rows you wish to exclude.
          </DialogDescription>
        </DialogHeader>
        <div className='flex-1 overflow-hidden pr-2'>
          <ImportPreviewTable
            columns={previewColumns}
            data={transactions}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
          />
        </div>
        <DialogFooter className='border-t pt-4'>
          <div className='flex w-full flex-col items-center justify-between gap-4 sm:flex-row'>
            <p className='text-muted-foreground text-sm'>
              <span className='text-primary font-semibold'>{selectedRowCount}</span> of{' '}
              {transactions.length} rows selected
            </p>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={onConfirm} disabled={loading || selectedRowCount === 0}>
                {loading ? (
                  <>
                    <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' /> Processing...
                  </>
                ) : (
                  <>
                    Stage {selectedRowCount} Transactions{' '}
                    <Icon name='arrowRight' className='ml-2 h-4 w-4' />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
