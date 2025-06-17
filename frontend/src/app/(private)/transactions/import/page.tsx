'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { extractTransactionsFromPdf } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { API_BASE_URL } from '@/lib/api-client';
import ImportDropzone from '@/components/transactions/import-dropzone';
import { ImportPreviewTable } from '@/components/transactions/import-preview-table';
import { ColumnDef, RowSelectionState } from '@tanstack/react-table';

const ImportTransactionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { showError, showSuccess, showInfo } = useToast();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

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

  const parseAndShowConfirmation = useCallback(
    async (file: File) => {
      if (!file) return;
      setLoading(true);
      showInfo(`Processing ${file.name}... This may take a moment.`);
      try {
        let parsedData;
        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await extractTransactionsFromPdf(arrayBuffer);
          if ('error' in result) throw new Error(result.details || result.error);
          parsedData = result.transactions.map((tx) => ({
            Date: tx.date,
            Text: tx.description,
            Amount: tx.debit !== undefined ? tx.debit : tx.credit,
            Type: tx.debit !== undefined ? 'expense' : 'income',
            Transfer: '-',
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
        if (parsedData.length === 0) {
          showError('No transactions could be extracted from the file.');
          return;
        }
        setTransactions(parsedData);
        setRowSelection({}); // Reset selection
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
    if (!accountId) {
      showError('Please select an account.');
      return;
    }

    const selectedRows = Object.keys(rowSelection).map((index) => transactions[parseInt(index)]);

    if (selectedRows.length === 0) {
      showError('Please select at least one transaction to import.');
      return;
    }

    setLoading(true);
    try {
      const ws = XLSX.utils.json_to_sheet(selectedRows);
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
      setIsConfirmOpen(false);
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
      setSuccessId(null);
      setTransactions([]);
      setRowSelection({});
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

  const selectedRowCount = Object.keys(rowSelection).length;

  return (
    <div className='flex flex-1 justify-center p-4 md:p-8'>
      <Card className='max-h-fit w-full max-w-4xl'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold'>Import Transactions</CardTitle>
          <CardDescription className='text-muted-foreground text-sm'>
            Upload your transaction file in Excel (.xlsx, .xls) or PDF format.
          </CardDescription>
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
              For best results, use the provided Excel sample. AI-powered PDF parsing is powerful
              but may require a review before final import.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className='max-w-4xl'>
          <DialogHeader>
            <DialogTitle>Confirm Transactions</DialogTitle>
            <DialogDescription>
              Select the transactions you want to import. Deselect any rows you wish to exclude.
            </DialogDescription>
          </DialogHeader>

          <ImportPreviewTable
            columns={previewColumns}
            data={transactions}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
          />

          <DialogFooter>
            <div className='flex w-full items-center justify-between'>
              <p className='text-muted-foreground text-sm'>
                {selectedRowCount} of {transactions.length} rows selected.
              </p>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAndStage}
                  disabled={loading || selectedRowCount === 0}
                >
                  {loading ? 'Processing...' : `Stage ${selectedRowCount} Transactions`}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!successId} onOpenChange={() => setSuccessId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Final Confirmation</DialogTitle>
            <DialogDescription>
              {Object.keys(rowSelection).length} transactions are staged. This action will add them
              to your account and cannot be undone.
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
