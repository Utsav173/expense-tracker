'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RowSelectionState } from '@tanstack/react-table';

import { useToast } from '@/lib/hooks/useToast';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { importTransactions, confirmImport } from '@/lib/endpoints/import';
import { aiProcessTransactionPdf } from '@/lib/endpoints/ai';

import { ImportHeader } from '@/components/transactions/import/import-header';
import { ImportStepper } from '@/components/transactions/import/import-stepper';
import { UploadStep } from '@/components/transactions/import/upload-step';
import { InfoPanel } from '@/components/transactions/import/info-panel';
import { PreviewDialog } from '@/components/transactions/import/preview-dialog';
import { ConfirmationDialog } from '@/components/transactions/import/confirmation-dialog';
import { PasswordDialog } from '@/components/transactions/import/password-dialog';

type TransactionType = 'income' | 'expense';
type ParsedTransaction = {
  Date: string; // ISO or display date string
  Text: string; // description
  Amount: number; // positive value
  Type: TransactionType;
  Transfer: string;
  Category: string;
};

const REQUIRED_HEADERS = ['Date', 'Text', 'Amount', 'Type', 'Transfer', 'Category'] as const;

let pdfjsLibPromise: Promise<any> | null = null;
async function getPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      return pdfjs;
    });
  }

  return pdfjsLibPromise;
}

function isPdf(file: File) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function normalizeAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }
  return NaN;
}

function normalizeType(raw: unknown): TransactionType {
  const val = String(raw ?? '').toLowerCase();
  return val === 'income' ? 'income' : 'expense';
}

function sanitizeTransactions(rows: any[]): ParsedTransaction[] {
  return rows
    .map((r) => {
      const amount = normalizeAmount(r.Amount);
      const t: ParsedTransaction = {
        Date: String(r.Date ?? '').trim(),
        Text: String(r.Text ?? '').trim(),
        Amount: amount,
        Type: normalizeType(r.Type),
        Transfer: String(r.Transfer ?? '-').trim() || '-',
        Category: String(r.Category ?? 'Uncategorized').trim() || 'Uncategorized'
      };
      return t;
    })
    .filter((t) => t.Date && t.Text && Number.isFinite(t.Amount));
}

async function extractTextFromPdf(file: File, password?: string) {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer, password });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText.trim();
}

async function parseXlsx(file: File) {
  const XLSX: any = await import('xlsx');
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) throw new Error('No sheet found in the workbook');

  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (rows.length === 0) throw new Error('No data found in the sheet');

  const headers = Object.keys(rows[0] as object);
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) throw new Error(`Missing headers: ${missing.join(', ')}`);

  return sanitizeTransactions(rows);
}

const ImportTransactionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [currentStep, setCurrentStep] = useState(1);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [stagedCount, setStagedCount] = useState<number>(0);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { showError, showSuccess, showInfo } = useToast();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const processFile = useCallback(
    async (file: File, filePassword?: string) => {
      if (loading) return; // prevent double-processing
      setLoading(true);
      setPasswordError(null);

      if (!filePassword) {
        showInfo(`Processing ${file.name}... This may take a moment.`);
      }

      try {
        let parsed: ParsedTransaction[] = [];

        if (isPdf(file)) {
          // Try to extract text
          let fullText = '';
          try {
            fullText = await extractTextFromPdf(file, filePassword);
          } catch (error: any) {
            // Handle password-protected PDFs gracefully
            if (error?.name === 'PasswordException') {
              setPendingFile(file);
              const message = String(error?.message || '').toLowerCase();
              setPasswordError(
                message.includes('incorrect') || message.includes('invalid')
                  ? 'The provided password was incorrect.'
                  : null
              );
              setIsPasswordDialogOpen(true);
              return; // bail out (keep loading false in finally)
            }
            throw error;
          }

          if (!fullText || fullText.length < 50) {
            throw new Error('Could not extract sufficient text from the PDF.');
          }

          const aiResponse = await aiProcessTransactionPdf({ documentContent: fullText });

          if (!aiResponse || !Array.isArray(aiResponse.transactions)) {
            throw new Error('AI processing failed to return valid transaction data.');
          }

          parsed = sanitizeTransactions(
            aiResponse.transactions.map((tx: any) => ({
              Date: tx.date,
              Text: tx.description ?? '',
              Amount: tx.debit != null ? tx.debit : tx.credit,
              Type: tx.debit != null ? 'expense' : 'income',
              Transfer: tx.transfer ?? '-',
              Category: tx.category ?? 'Uncategorized'
            }))
          );

          // Close password dialog if it was open and parsing succeeded
          setIsPasswordDialogOpen(false);
          setPendingFile(null);
          setPassword('');
          setPasswordError(null);
        } else {
          // XLSX/CSV route
          parsed = await parseXlsx(file);
        }

        if (parsed.length === 0) {
          showError('No transactions could be extracted from the file.');
          return;
        }

        setTransactions(parsed);
        setRowSelection({});
        setCurrentStep(2);
        setIsConfirmOpen(true);
      } catch (error: any) {
        showError(`Error parsing file: ${error?.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    },
    [loading, showError, showInfo]
  );

  const onFileDrop = useCallback(
    (file: File) => {
      if (!file || loading) return;
      setPendingFile(null);
      setPasswordError(null);
      processFile(file);
    },
    [loading, processFile]
  );

  const handlePasswordSubmit = async () => {
    if (!pendingFile || !password || loading) return;
    await processFile(pendingFile, password);
  };

  const handleConfirmAndStage = async () => {
    if (!accountId) {
      showError('Please select an account.');
      return;
    }
    const selectedIndices = Object.keys(rowSelection)
      .map((k) => Number(k))
      .filter((n) => Number.isInteger(n))
      .sort((a, b) => a - b);

    const selectedRows = selectedIndices.map((idx) => transactions[idx]);
    if (selectedRows.length === 0) {
      showError('Please select at least one transaction to import.');
      return;
    }

    setLoading(true);
    try {
      const XLSX: any = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(selectedRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const formData = new FormData();
      formData.append('accountId', accountId);
      // Append Blob with filename instead of creating a new File
      formData.append('document', blob, 'transactions.xlsx');

      const result = await importTransactions(formData);
      setSuccessId(result.successId);
      setStagedCount(selectedRows.length);
      setCurrentStep(3);
      setIsConfirmOpen(false);
    } catch (error: any) {
      showError(error?.message || 'Failed to stage import.');
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
      setStagedCount(0);
      setCurrentStep(1);
    } catch (error: any) {
      showError(error?.message || 'Failed to finalize import.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const XLSX: any = await import('xlsx');
      const sampleData: ParsedTransaction[] = [
        {
          Date: '2025-01-15',
          Text: 'Monthly Salary',
          Amount: 3000,
          Type: 'income',
          Transfer: '-',
          Category: 'Salary'
        },
        {
          Date: '2025-01-15',
          Text: 'Groceries from SuperMart',
          Amount: 150.75,
          Type: 'expense',
          Transfer: '-',
          Category: 'Groceries'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_transactions.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showError(`Download failed: ${error?.message || 'Unknown error'}`);
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
          stagedCount={stagedCount}
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
