'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  FileText,
  AlertCircle,
  KeyRound,
  Upload,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Database,
  Shield
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { API_BASE_URL } from '@/lib/api-client';
import ImportDropzone from '@/components/transactions/import-dropzone';
import { ImportPreviewTable } from '@/components/transactions/import-preview-table';
import { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { aiProcessTransactionPdf } from '@/lib/endpoints/ai';

// --- CSS Imports for React-PDF (these are safe) ---
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const ImportTransactionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [currentStep, setCurrentStep] = useState(1);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { showError, showSuccess, showInfo } = useToast();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  // --- React-PDF Worker Setup ---
  useEffect(() => {
    import('react-pdf').then(({ pdfjs }) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    });
  }, []);

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

  const processFile = useCallback(
    async (file: File, filePassword?: string) => {
      setLoading(true);
      setPasswordError(null);
      if (!filePassword) {
        showInfo(`Processing ${file.name}... This may take a moment.`);
      }

      try {
        let parsedData;
        if (file.type === 'application/pdf') {
          const { pdfjs } = await import('react-pdf');

          const arrayBuffer = await file.arrayBuffer();

          const pdf = await pdfjs.getDocument({ data: arrayBuffer, password: filePassword })
            .promise;

          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }

          if (!fullText || fullText.trim().length < 50) {
            throw new Error(
              'Could not extract sufficient text from the PDF. The document might be empty or image-based.'
            );
          }

          const aiResponse = await aiProcessTransactionPdf({ documentContent: fullText });

          if (!aiResponse || !Array.isArray(aiResponse.transactions)) {
            throw new Error('AI processing failed to return valid transaction data.');
          }

          setIsPasswordDialogOpen(false);
          setPendingFile(null);

          parsedData = aiResponse.transactions.map((tx) => ({
            Date: tx.date,
            Text: tx.description,
            Amount: tx.debit !== undefined ? tx.debit : tx.credit,
            Type: tx.debit !== undefined ? 'expense' : 'income',
            Transfer: tx.transfer || '-',
            Category: tx.category || 'Uncategorized'
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
        setRowSelection({});
        setCurrentStep(2);
        setIsConfirmOpen(true);
      } catch (error: any) {
        if (error.name === 'PasswordException') {
          setPendingFile(file);
          if (error.message.includes('Invalid')) {
            setPasswordError('The provided password was incorrect.');
          } else {
            setIsPasswordDialogOpen(true);
          }
        } else {
          showError(`Error parsing file: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [showError, showInfo]
  );

  const onFileDrop = useCallback(
    (file: File) => {
      if (!file) return;
      setPendingFile(null);
      setPasswordError(null);
      processFile(file);
    },
    [processFile]
  );

  const handlePasswordSubmit = async () => {
    if (!pendingFile || !password) return;
    await processFile(pendingFile, password);
  };

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
      setCurrentStep(3);
      setIsConfirmOpen(false);
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
      setSuccessId(null);
      setTransactions([]);
      setRowSelection({});
      setCurrentStep(1);
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

  const steps = [
    { id: 1, name: 'Upload', icon: Upload, description: 'Choose your file' },
    { id: 2, name: 'Review', icon: FileText, description: 'Verify transactions' },
    { id: 3, name: 'Complete', icon: CheckCircle2, description: 'Finalize import' }
  ];

  return (
    <div className='min-h-screen p-2 max-sm:p-0'>
      <div className='mx-auto max-w-6xl max-sm:max-w-full'>
        {/* Header Section */}
        <div className='mb-6 text-center max-sm:mb-3'>
          <div className='bg-primary mb-3 inline-flex items-center justify-center rounded-full p-2 max-sm:p-1'>
            <Database className='text-primary-foreground h-8 w-8 max-sm:h-6 max-sm:w-6' />
          </div>
          <h1 className='text-foreground mb-2 text-3xl font-bold max-sm:text-2xl'>
            Import Transactions
          </h1>
          <p className='text-foreground/80 mx-auto max-w-2xl text-base max-sm:max-w-xs max-sm:text-sm'>
            Seamlessly import your financial data with AI-powered processing and intelligent
            categorization
          </p>
        </div>

        {/* Progress Steps */}
        <div className='mb-6 max-sm:mb-3'>
          <div className='flex flex-wrap items-center justify-center space-x-4 max-sm:space-x-2 md:space-x-8'>
            {steps.map((step, index) => (
              <div key={step.id} className='flex flex-col items-center'>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 max-sm:h-8 max-sm:w-8 ${
                    currentStep >= step.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg'
                      : 'border-border bg-card text-muted-foreground'
                  } `}
                >
                  <step.icon className='h-5 w-5 max-sm:h-4 max-sm:w-4' />
                </div>
                <div className='mt-1 text-center'>
                  <p
                    className={`text-xs font-medium max-sm:text-[11px] ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {step.name}
                  </p>
                  <p className='text-muted-foreground text-[10px] max-sm:text-[9px]'>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className='grid gap-6 max-sm:grid-cols-1 max-sm:gap-3 lg:grid-cols-3'>
          {/* Left Column - Form */}
          <div className='max-sm:col-span-1 lg:col-span-2'>
            <Card className='bg-card/70 border-0 shadow-xl backdrop-blur-sm max-sm:shadow-md'>
              <CardHeader className='pb-4 max-sm:pb-2'>
                <CardTitle className='text-foreground flex items-center text-xl font-bold max-sm:text-lg'>
                  <Sparkles className='text-primary mr-2 h-5 w-5 max-sm:h-4 max-sm:w-4' />
                  Upload & Process
                </CardTitle>
                <CardDescription className='text-foreground/80 max-sm:text-xs'>
                  Support for Excel (.xlsx, .xls) and PDF formats with AI-powered extraction
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 max-sm:space-y-2'>
                {/* Account Selection */}
                <div className='space-y-2'>
                  <label className='text-foreground/80 flex items-center text-sm font-semibold max-sm:text-xs'>
                    <Database className='mr-2 h-4 w-4 max-sm:h-3 max-sm:w-3' />
                    Destination Account *
                  </label>
                  <Select onValueChange={setAccountId} value={accountId}>
                    <SelectTrigger className='border-border bg-card/50 hover:border-primary/50 focus:border-primary h-10 border-2 backdrop-blur-sm transition-all duration-200 max-sm:h-9'>
                      <SelectValue
                        placeholder={isLoadingAccounts ? 'Loading accounts...' : 'Select account'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {accountsData?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          <div className='flex items-center'>
                            <div className='bg-primary mr-2 h-2 w-2 rounded-full'></div>
                            {acc.name} ({acc.currency})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div className='border-primary/20 bg-primary/10 rounded-lg border-2 border-dashed p-3 max-sm:p-2 md:p-4'>
                  <ImportDropzone
                    onFileDrop={onFileDrop}
                    isLoading={loading}
                    disabled={!accountId}
                  />
                </div>

                {/* Download Sample */}
                <div className='flex justify-center'>
                  <Button
                    onClick={handleDownloadSample}
                    variant='outline'
                    disabled={loading}
                    className='border-primary/20 bg-card/50 text-primary hover:border-primary/30 hover:bg-primary/10 backdrop-blur-sm transition-all duration-200 max-sm:px-2 max-sm:py-1 max-sm:text-xs'
                  >
                    <FileText className='mr-2 h-4 w-4 max-sm:h-3 max-sm:w-3' />
                    Download Excel Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info Cards */}
          <div className='space-y-4 max-sm:space-y-2'>
            {/* AI Features Card */}
            <Card className='from-primary/10 to-info/10 border-0 bg-gradient-to-br shadow-lg backdrop-blur-sm max-sm:rounded-lg max-sm:border max-sm:border-zinc-200 max-sm:bg-white max-sm:shadow-none max-sm:dark:border-zinc-700 max-sm:dark:bg-zinc-900'>
              <CardContent className='p-4 max-sm:p-3 max-sm:pr-2 max-sm:pl-4'>
                <div className='mb-2 flex items-center max-sm:mb-1'>
                  <div className='bg-primary/10 dark:bg-primary/20 mr-2 rounded-full p-1 max-sm:p-0.5'>
                    <Sparkles className='text-primary h-5 w-5 max-sm:h-4 max-sm:w-4' />
                  </div>
                  <h3 className='text-foreground font-semibold max-sm:text-left max-sm:text-base max-sm:font-bold dark:text-zinc-100'>
                    AI-Powered Processing
                  </h3>
                </div>
                <ul className='text-foreground/80 space-y-1 text-xs max-sm:space-y-0.5 max-sm:pl-7 max-sm:text-[13px] dark:text-zinc-300'>
                  <li className='flex items-center max-sm:mb-1'>
                    <CheckCircle2 className='text-success mr-2 h-4 w-4 max-sm:h-3 max-sm:w-3' />
                    Intelligent PDF text extraction
                  </li>
                  <li className='flex items-center max-sm:mb-1'>
                    <CheckCircle2 className='text-success mr-2 h-4 w-4 max-sm:h-3 max-sm:w-3' />
                    Automatic transaction categorization
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='text-success mr-2 h-4 w-4 max-sm:h-3 max-sm:w-3' />
                    Smart data validation
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className='from-success/10 to-success/10 border-0 bg-gradient-to-br shadow-lg backdrop-blur-sm max-sm:rounded-lg max-sm:border max-sm:border-zinc-200 max-sm:bg-white max-sm:shadow-none max-sm:dark:border-zinc-700 max-sm:dark:bg-zinc-900'>
              <CardContent className='p-4 max-sm:p-3 max-sm:pr-2 max-sm:pl-4'>
                <div className='mb-2 flex items-center max-sm:mb-1'>
                  <div className='bg-success/10 dark:bg-success/20 mr-2 rounded-full p-1 max-sm:p-0.5'>
                    <Shield className='text-success h-5 w-5 max-sm:h-4 max-sm:w-4' />
                  </div>
                  <h3 className='text-foreground font-semibold max-sm:text-left max-sm:text-base max-sm:font-bold dark:text-zinc-100'>
                    Secure & Private
                  </h3>
                </div>
                <ul className='text-foreground/80 space-y-1 text-xs max-sm:space-y-0.5 max-sm:pl-7 max-sm:text-[13px] dark:text-zinc-300'>
                  <li className='flex items-center max-sm:mb-1'>
                    <CheckCircle2 className='text-success mr-2 h-4 w-4 max-sm:h-3 max-sm:w-3' />
                    End-to-end encryption
                  </li>
                  <li className='flex items-center max-sm:mb-1'>
                    <CheckCircle2 className='text-success mr-2 h-4 w-4 max-sm:h-3 max-sm:w-3' />
                    Password-protected files supported
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='text-success mr-2 h-4 w-4 max-sm:h-3 max-sm:w-3' />
                    No data stored permanently
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Alert className='border-warning/20 bg-warning/10 max-sm:rounded-lg max-sm:border max-sm:border-zinc-200 max-sm:bg-white max-sm:p-3 max-sm:text-[13px] dark:bg-zinc-900 max-sm:dark:border-zinc-700 max-sm:dark:bg-zinc-900'>
              <AlertCircle className='h-4 w-4 text-orange-200 max-sm:h-3 max-sm:w-3' />
              <AlertTitle className='text-orange-300 max-sm:text-xs max-sm:font-bold dark:text-orange-200'>
                Pro Tips
              </AlertTitle>
              <AlertDescription className='text-orange-500/60 max-sm:text-xs max-sm:font-normal dark:text-orange-300'>
                For best results, use our Excel template. PDF processing is powered by AI but may
                require review before final import.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className='bg-card/95 max-h-[90vh] max-w-full backdrop-blur-sm max-sm:p-2 sm:max-w-lg md:max-w-xl lg:max-w-6xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center text-lg max-sm:text-base'>
              <FileText className='text-primary mr-2 h-5 w-5 max-sm:h-4 max-sm:w-4' />
              Review Transactions
            </DialogTitle>
            <DialogDescription className='max-sm:text-xs'>
              Select the transactions you want to import. Deselect any rows you wish to exclude.
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 overflow-hidden'>
            <ImportPreviewTable
              columns={previewColumns}
              data={transactions}
              rowSelection={rowSelection}
              setRowSelection={setRowSelection}
            />
          </div>

          <DialogFooter className='bg-muted/50 border-t p-4 max-sm:p-2 md:p-6'>
            <div className='flex w-full items-center justify-between max-sm:flex-col max-sm:items-center max-sm:space-y-2'>
              <div className='flex items-center space-x-4 max-sm:flex-col max-sm:items-center max-sm:space-y-2'>
                <p className='text-muted-foreground text-xs max-sm:text-[11px]'>
                  <span className='text-primary font-semibold'>{selectedRowCount}</span> of{' '}
                  {transactions.length} rows selected
                </p>
                {selectedRowCount > 0 && (
                  <div className='bg-success/10 rounded-full px-3 py-1 max-sm:px-2 max-sm:py-0.5'>
                    <span className='text-success-foreground text-xs font-medium max-sm:text-[10px]'>
                      Ready to import
                    </span>
                  </div>
                )}
              </div>
              <div className='flex gap-3 max-sm:flex-col max-sm:items-center max-sm:space-y-2'>
                <Button
                  variant='outline'
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={loading}
                  className='bg-card/50 max-sm:text-xs'
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAndStage}
                  disabled={loading || selectedRowCount === 0}
                  className='from-primary to-info text-primary-foreground bg-gradient-to-r shadow-lg transition-all duration-200 hover:shadow-xl max-sm:px-2 max-sm:py-1 max-sm:text-xs'
                >
                  {loading ? (
                    <>
                      <div className='border-primary-foreground mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent max-sm:h-3 max-sm:w-3'></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Stage {selectedRowCount} Transactions
                      <ArrowRight className='ml-2 h-4 w-4 max-sm:h-3 max-sm:w-3' />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog */}
      <Dialog open={!!successId} onOpenChange={() => setSuccessId(null)}>
        <DialogContent className='bg-card/95 backdrop-blur-sm max-sm:p-2'>
          <DialogHeader>
            <DialogTitle className='flex items-center text-lg max-sm:text-base'>
              <CheckCircle2 className='text-success mr-2 h-5 w-5 max-sm:h-4 max-sm:w-4' />
              Final Confirmation
            </DialogTitle>
            <DialogDescription className='max-sm:text-xs'>
              <span className='text-primary font-semibold'>{Object.keys(rowSelection).length}</span>{' '}
              transactions are staged and ready. This action will add them to your account and
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setSuccessId(null)}
              disabled={loading}
              className='bg-card/50 max-sm:mb-2 max-sm:text-xs'
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalImport}
              disabled={loading}
              className='from-success to-success text-success-foreground bg-gradient-to-r shadow-lg transition-all duration-200 hover:shadow-xl max-sm:px-2 max-sm:py-1 max-sm:text-xs'
            >
              {loading ? (
                <>
                  <div className='border-success-foreground mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent max-sm:h-3 max-sm:w-3'></div>
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 className='mr-2 h-4 w-4 max-sm:h-3 max-sm:w-3' />
                  Confirm Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent
          onCloseAutoFocus={(e) => e.preventDefault()}
          className='bg-card/95 max-w-full backdrop-blur-sm max-sm:p-2 sm:max-w-lg md:max-w-xl'
        >
          <DialogHeader>
            <DialogTitle className='flex items-center text-lg max-sm:text-base'>
              <KeyRound className='text-primary mr-2 h-5 w-5 max-sm:h-4 max-sm:w-4' />
              Password Required
            </DialogTitle>
            <DialogDescription className='max-sm:text-xs'>
              <span className='text-foreground font-medium'>{pendingFile?.name}</span>&quot; is
              encrypted. Please enter the password to unlock it.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3 py-3 max-sm:gap-2 max-sm:py-2'>
            <div className='space-y-1'>
              <Label htmlFor='password-input' className='text-xs font-medium'>
                Password
              </Label>
              <Input
                id='password-input'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePasswordSubmit();
                }}
                className='border-border bg-card/50 focus:border-primary h-10 border-2 backdrop-blur-sm transition-all duration-200 max-sm:h-9 max-sm:text-xs'
                placeholder='Enter file password'
                autoFocus
              />
            </div>
            {passwordError && (
              <p className='bg-destructive/10 text-destructive rounded p-2 text-xs max-sm:text-[11px]'>
                {passwordError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={loading}
              className='bg-card/50 max-sm:text-xs'
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordSubmit}
              disabled={loading || !password}
              className='from-primary to-info text-primary-foreground bg-gradient-to-r max-sm:mb-2 max-sm:px-2 max-sm:py-1 max-sm:text-xs'
            >
              {loading ? (
                <>
                  <div className='border-primary-foreground mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent max-sm:h-3 max-sm:w-3'></div>
                  Unlocking...
                </>
              ) : (
                <>
                  <KeyRound className='mr-2 h-4 w-4 max-sm:h-3 max-sm:w-3' />
                  Unlock & Continue
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportTransactionsPage;
