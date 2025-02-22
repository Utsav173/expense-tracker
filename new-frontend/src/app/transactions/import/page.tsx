'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle } from 'lucide-react';
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
import { useDropzone } from 'react-dropzone';
import { API_BASE_URL } from '@/lib/api-client';

const ImportTransactions = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isFirstConfirmationOpen, setIsFirstConfirmationOpen] = useState(false);
  const [isSecondConfirmationOpen, setIsSecondConfirmationOpen] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const { showError, showSuccess } = useToast();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const parseExcelFile = useCallback(
    async (file: File) => {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          throw new Error('No sheet found in the workbook');
        }
        const jsonData: { [key: string]: string }[] = XLSX.utils.sheet_to_json(worksheet);
        if (jsonData.length === 0) {
          throw new Error('No data found in the sheet');
        }
        const headers = Object.keys(jsonData[0]);
        const requiredHeaders = ['Date', 'Text', 'Amount', 'Type', 'Transfer', 'Category'];
        const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
        if (missingHeaders.length > 0) {
          showError(`Missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }
        setTransactions(jsonData);
        setIsFirstConfirmationOpen(true);
      } catch (error: any) {
        showError(`Error parsing Excel file: ${error.message}`);
      }
    },
    [showError]
  );

  const parsePdfFile = useCallback(
    async (file: File) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const parsedTransactions = await extractTransactions(arrayBuffer);

        if ('error' in parsedTransactions) {
          throw new Error(parsedTransactions.details || parsedTransactions.error);
        }
        const transformedTransactions = parsedTransactions.map((tx) => ({
          Date: tx.date,
          Text: tx.description,
          Amount: tx.debit > 0 ? tx.debit : tx.credit,
          Type: tx.debit > 0 ? 'expense' : 'income',
          Transfer: tx.reference || '-',
          Category: 'Uncategorized'
        }));
        setTransactions(transformedTransactions);
        setIsFirstConfirmationOpen(true);
      } catch (error: any) {
        showError(`Error parsing PDF file: ${error.message}`);
      }
    },
    [showError]
  );

  const handleFirstConfirmation = async () => {
    if (!accountId) {
      showError('Please select an account.');
      return;
    }
    if (!transactions.length) {
      showError('No transactions found to import.');
      return;
    }

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
      setIsFirstConfirmationOpen(false);
      setIsSecondConfirmationOpen(true);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSecondConfirmation = async () => {
    if (!successId) {
      showError('No success ID found. Please try again.');
      return;
    }
    setLoading(true);
    try {
      await confirmImport(successId);
      showSuccess('Data imported successfully!');
      setIsSecondConfirmationOpen(false);
      setSuccessId(null);
      setFile(null);
      setAccountId(undefined);
      setTransactions([]);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/sampleFile/import`);
      if (!response.ok) {
        throw new Error(`Failed to download sample file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_transactions.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showError(`Error downloading sample file: ${error.message}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024,
    disabled: !accountId,
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach((fileRejection) => {
        const file = fileRejection.file;
        if (file.size > 5 * 1024 * 1024) {
          showError('File size must be less than 5MB');
        } else {
          showError(`File rejected: ${fileRejection.errors[0]?.message || 'Unknown error'}`);
        }
      });
    },
    onDrop: async (acceptedFiles) => {
      const droppedFile = acceptedFiles[0];
      if (droppedFile) {
        setFile(droppedFile);
        setLoading(true);
        try {
          if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
            await parseExcelFile(droppedFile);
          } else if (droppedFile.name.endsWith('.pdf')) {
            await parsePdfFile(droppedFile);
          }
        } catch (error: any) {
          showError(`Error processing file: ${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    }
  });

  return (
    <div className='flex flex-1 justify-center p-4 md:p-8'>
      <Card className='w-full max-w-4xl max-h-fit'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold'>Import Transactions</CardTitle>
          <p className='text-sm text-muted-foreground'>
            Upload your transaction file in Excel (.xlsx, .xls) or PDF format
          </p>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div
            {...getRootProps()}
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            } ${!accountId ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className='h-8 w-8 text-muted-foreground' />
            {!accountId ? (
              <p className='mt-2 text-sm font-medium text-muted-foreground'>
                Please select an account first
              </p>
            ) : (
              <>
                <p className='mt-2 text-sm font-medium'>
                  Drag & drop your file here or{' '}
                  <span className='cursor-pointer text-primary hover:underline'>browse</span>
                </p>
                <p className='text-xs text-muted-foreground'>
                  Supported formats: Excel (.xlsx, .xls) or PDF (max 5MB)
                </p>
              </>
            )}
            {file && (
              <div className='mt-4 text-sm'>
                Selected: <span className='font-medium'>{file.name}</span>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Select Account</label>
            <Select onValueChange={setAccountId} value={accountId}>
              <SelectTrigger className='w-full'>
                <SelectValue
                  placeholder={isLoadingAccounts ? 'Loading accounts...' : 'Select account'}
                />
              </SelectTrigger>
              <SelectContent>
                {accountsData?.length ? (
                  accountsData.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value='no-account' disabled>
                    No accounts available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-4 sm:flex-row sm:justify-between'>
            <Button
              onClick={handleDownloadSample}
              variant='outline'
              disabled={loading}
              className='w-full sm:w-auto'
            >
              <FileText className='mr-2 h-4 w-4' />
              Download Sample
            </Button>
          </div>

          <Alert variant='default' className='mt-4'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Format Instructions</AlertTitle>
            <AlertDescription>
              Make sure your file follows the required format. Download the sample file for
              reference.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Dialog open={isFirstConfirmationOpen} onOpenChange={setIsFirstConfirmationOpen}>
        <DialogContent className='max-w-4xl'>
          <DialogHeader>
            <DialogTitle>Confirm Transactions</DialogTitle>
            <DialogDescription>
              Please review the transactions below before proceeding to import.
            </DialogDescription>
          </DialogHeader>

          {transactions.length > 0 && (
            <div className='mt-4'>
              <p className='mb-2 text-sm font-medium'>Total Records: {transactions.length}</p>
              <ScrollArea className='h-[400px] rounded-md border'>
                <table className='w-full'>
                  <thead className='sticky top-0 bg-background'>
                    <tr className='border-b'>
                      {Object.keys(transactions[0]).map((key) => (
                        <th key={key} className='p-2 text-left text-sm font-medium'>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr key={index} className='border-b last:border-0 hover:bg-muted/50'>
                        {Object.values(tx).map((value: any, idx) => (
                          <td key={idx} className='p-2 text-xs'>
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}

          <DialogFooter>
            <Button
              variant='secondary'
              onClick={() => setIsFirstConfirmationOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleFirstConfirmation} disabled={loading || !accountId}>
              {loading ? 'Processing...' : 'Proceed to Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSecondConfirmationOpen} onOpenChange={setIsSecondConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Final Import</DialogTitle>
            <DialogDescription>
              Are you sure you want to import these transactions? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='secondary'
              onClick={() => setIsSecondConfirmationOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSecondConfirmation} disabled={loading}>
              {loading ? 'Importing...' : 'Confirm Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportTransactions;
