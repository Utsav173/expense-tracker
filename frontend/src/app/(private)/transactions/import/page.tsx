'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/hooks/useToast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { useQuery } from '@tanstack/react-query';
import { importTransactions, confirmImport } from '@/lib/endpoints/import';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { extractTransactions } from './actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { API_BASE_URL } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the entire functionality to a client component
const ImportDropzone = dynamic(() => import('@/components/transactions/import-dropzone'), {
  loading: () => <Skeleton className='h-48 w-full' />,
  ssr: false
});

const ImportTransactionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const { showError, showSuccess, showInfo } = useToast();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const parseAndShowConfirmation = useCallback(
    async (file: File) => {
      setLoading(true);
      showInfo(`Processing ${file.name}...`);
      try {
        let parsedData;
        if (file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await extractTransactions(arrayBuffer);
          if ('error' in result) throw new Error(result.details || result.error);
          parsedData = result.map((tx) => ({
            Date: tx.date,
            Text: tx.description,
            Amount: tx.debit > 0 ? tx.debit : tx.credit,
            Type: tx.debit > 0 ? 'expense' : 'income',
            Transfer: tx.reference || '-',
            Category: 'Uncategorized'
          }));
        } else {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'buffer' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          if (!worksheet) throw new Error('No sheet found in the workbook');
          parsedData = XLSX.utils.sheet_to_json(worksheet);
          if (parsedData.length === 0) throw new Error('No data found in the sheet');
          const headers = Object.keys(parsedData[0] as object);
          const requiredHeaders = ['Date', 'Text', 'Amount', 'Type', 'Transfer', 'Category'];
          const missing = requiredHeaders.filter((h) => !headers.includes(h));
          if (missing.length > 0) throw new Error(`Missing headers: ${missing.join(', ')}`);
        }
        setTransactions(parsedData);
        setIsConfirmOpen(true);
      } catch (error: any) {
        showError(`Error parsing file: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [showError, showInfo]
  );

  const handleConfirmAndStage = async () => {
    if (!accountId || !transactions.length) return;
    setLoading(true);
    try {
      const ws = XLSX.utils.json_to_sheet(transactions);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const formData = new FormData();
      formData.append('accountId', accountId);
      formData.append('document', new File([blob], 'transactions.xlsx'));

      const result = await importTransactions(formData);
      setSuccessId(result.successId);
      setIsConfirmOpen(false); // Close first dialog
      // This logic will be moved to the final confirmation step after API returns successId
      showSuccess(`Staged ${result.totalRecords} transactions for import. Please confirm.`);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalImport = async () => {
    if (!successId) return;
    setLoading(true);
    try {
      await confirmImport(successId);
      showSuccess('Data imported successfully!');
      setSuccessId(null); // This will close the final dialog
      setTransactions([]);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/accounts/sampleFile/import`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_transactions.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showError(`Download failed: ${error.message}`);
    }
  };

  return (
    <div className='flex flex-1 justify-center p-4 md:p-8'>
      <Card className='max-h-fit w-full max-w-4xl'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold'>Import Transactions</CardTitle>
          <p className='text-muted-foreground text-sm'>
            Upload your transaction file in Excel (.xlsx, .xls) or PDF format.
          </p>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Select Account to Import Into *</label>
            <Select onValueChange={setAccountId} value={accountId}>
              <SelectTrigger className='w-full'>
                <SelectValue
                  placeholder={isLoadingAccounts ? 'Loading accounts...' : 'Select account'}
                />
              </SelectTrigger>
              <SelectContent>
                {accountsData?.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ImportDropzone
            onFileDrop={parseAndShowConfirmation}
            isLoading={loading}
            disabled={!accountId}
          />

          <div className='flex flex-col gap-4 sm:flex-row sm:justify-between'>
            <Button
              onClick={handleDownloadSample}
              variant='outline'
              disabled={loading}
              className='w-full sm:w-auto'
            >
              <FileText className='mr-2 h-4 w-4' />
              Download Excel Sample
            </Button>
          </div>

          <Alert variant='default'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Instructions</AlertTitle>
            <AlertDescription>
              For best results, use the provided Excel sample. PDF parsing is experimental and works
              best with standard bank statement formats.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Confirm Transactions</DialogTitle>
            <DialogDescription>
              Review the parsed transactions. If correct, proceed to stage them for import.
            </DialogDescription>
          </DialogHeader>
          <p className='text-sm font-medium'>Total Records: {transactions.length}</p>
          <ScrollArea className='h-[400px] rounded-md border'>
            <pre className='p-4 text-xs'>{JSON.stringify(transactions, null, 2)}</pre>
          </ScrollArea>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsConfirmOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAndStage} disabled={loading}>
              {loading ? 'Processing...' : 'Proceed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog */}
      <Dialog open={!!successId} onOpenChange={() => setSuccessId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Final Confirmation</DialogTitle>
            <DialogDescription>
              {transactions.length} transactions are staged. This action will add them to your
              account and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSuccessId(null)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleFinalImport} disabled={loading}>
              {loading ? 'Importing...' : 'Confirm Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportTransactionsPage;
