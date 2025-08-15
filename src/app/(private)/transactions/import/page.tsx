'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { importTransactions, confirmImport } from '@/lib/endpoints/import';
import { aiProcessTransactionPdf } from '@/lib/endpoints/ai';
import { RowSelectionState } from '@tanstack/react-table';
import { API_BASE_URL } from '@/lib/api-client';

import { ImportHeader } from '@/components/transactions/import/import-header';
import { ImportStepper } from '@/components/transactions/import/import-stepper';
import { UploadStep } from '@/components/transactions/import/upload-step';
import { InfoPanel } from '@/components/transactions/import/info-panel';
import { PreviewDialog } from '@/components/transactions/import/preview-dialog';
import { ConfirmationDialog } from '@/components/transactions/import/confirmation-dialog';
import { PasswordDialog } from '@/components/transactions/import/password-dialog';

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

  useEffect(() => {
    import('react-pdf').then(({ pdfjs }) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    });
  }, []);

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
            throw new Error('Could not extract sufficient text from the PDF.');
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
          const XLSX = await import('xlsx');
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
          setPasswordError(
            error.message.includes('Invalid') ? 'The provided password was incorrect.' : null
          );
          setIsPasswordDialogOpen(true);
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
      const XLSX = await import('xlsx');
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
      showSuccess('Transactions imported successfully!');
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
      const response = await fetch(`${API_BASE_URL}/accounts/sampleFile/import`);
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
    <div className='p-4 md:p-8'>
      <div className='mx-auto max-w-6xl space-y-8'>
        <ImportHeader />
        <ImportStepper currentStep={currentStep} />

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            <UploadStep
              accountId={accountId}
              setAccountId={setAccountId}
              accountsData={accountsData}
              isLoadingAccounts={isLoadingAccounts}
              onFileDrop={onFileDrop}
              loading={loading}
              handleDownloadSample={handleDownloadSample}
            />
          </div>
          <InfoPanel />
        </div>

        <PreviewDialog
          isOpen={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          transactions={transactions}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          onConfirm={handleConfirmAndStage}
          loading={loading}
        />

        <ConfirmationDialog
          isOpen={!!successId}
          onOpenChange={() => setSuccessId(null)}
          onConfirm={handleFinalImport}
          loading={loading}
          stagedCount={Object.keys(rowSelection).length}
        />

        <PasswordDialog
          isOpen={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
          fileName={pendingFile?.name}
          password={password}
          setPassword={setPassword}
          onSubmit={handlePasswordSubmit}
          error={passwordError}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ImportTransactionsPage;
