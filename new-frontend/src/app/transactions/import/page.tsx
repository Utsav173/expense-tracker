import { ChangeEvent, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Download } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const ImportTransactions = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    setError(null);
    setTransactions([]);
    const file = event.target.files?.[0];

    if (!file || !file.type.match('application/pdf')) {
      setError('Please upload a valid PDF file.');
      setLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const typedArray = new Uint8Array(reader.result as ArrayBuffer);
      try {
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        const extractedData = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent({
            includeMarkedContent: true
          });

          const pageData = textContent.items.map((item: any) => ({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5]
          }));
          extractedData.push(...pageData);
        }

        const potentialTableData = extractTableData(extractedData);
        const parsedTransactions = parseTransactions(potentialTableData);
        setTransactions(parsedTransactions);
      } catch (error) {
        console.error('Error extracting data from PDF:', error);
        setError('Failed to extract data from PDF.');
      }
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const extractTableData = (data: any) => {
    data.sort((a: any, b: any) => b.y - a.y || a.x - b.x);

    const yTolerance = 2;
    const groups = [];
    let currentGroup: any = [];
    let currentY: any = null;

    data.forEach((item: any) => {
      if (currentY === null || Math.abs(item.y - currentY) < yTolerance) {
        currentGroup.push(item);
        currentY = currentY === null ? item.y : currentY;
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [item];
        currentY = item.y;
      }
    });
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    const lines = groups.map((group) =>
      group
        .sort((a: any, b: any) => a.x - b.x)
        .map((item: any) => item.str.trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    );

    const transactionRegex =
      /(\d{2} [A-Za-z]{3}, \d{4})\s+(.+?)\s*(?:UPI|FCM|NEFT|IMPS)-?([A-Z0-9]+)?\s*(-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*([+]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(-?\d{1,3}(?:,\d{3})*(?:\.\d{2}))/;

    const transactions = lines
      .map((line) => {
        const match = line.match(transactionRegex);
        if (match) {
          const [, date, details, reference, debitStr, creditStr, balanceStr] = match;

          const referenceNumber = reference ? reference : '';
          const detailsWithoutRef = details
            .replace(new RegExp(`\\b${referenceNumber}\\b`), '')
            .trim();

          const parseAmount = (str: any) => {
            if (!str) return 0;
            return parseFloat(str.replace(/,/g, ''));
          };

          const debit = parseAmount(debitStr);
          const credit = parseAmount(creditStr);
          const balance = parseAmount(balanceStr);

          return {
            date,
            details: detailsWithoutRef,
            reference: referenceNumber,
            debit: debit < 0 ? Math.abs(debit) : debit,
            credit: credit > 0 ? credit : 0,
            balance
          };
        }
        return null;
      })
      .filter(Boolean);

    return transactions.sort((a, b) => {
      const dateA = new Date(a?.date);
      const dateB = new Date(b?.date);
      return dateA.getTime() - dateB.getTime();
    });
  };

  //   const extractTableDataOld = (data) => {
  //     data.sort((a, b) => b.y - a.y || a.x - b.x);

  //     // Group items by Y position with more tolerance
  //     const yTolerance = 2;
  //     const groups = [];
  //     let currentGroup = [];
  //     let currentY = null;

  //     data.forEach((item) => {
  //       if (currentY === null || Math.abs(item.y - currentY) < yTolerance) {
  //         currentGroup.push(item);
  //         currentY = currentY === null ? item.y : currentY;
  //       } else {
  //         if (currentGroup.length > 0) {
  //           groups.push([...currentGroup]);
  //         }
  //         currentGroup = [item];
  //         currentY = item.y;
  //       }
  //     });
  //     if (currentGroup.length > 0) {
  //       groups.push(currentGroup);
  //     }

  //     // Convert groups to lines
  //     const lines = groups.map((group) =>
  //       group
  //         .sort((a, b) => a.x - b.x)
  //         .map((item) => item.str.trim())
  //         .join(' ')
  //         .replace(/\s+/g, ' ')
  //         .trim(),
  //     );

  //     // More flexible regex for transaction matching
  //     const transactionRegex =
  //       /(\d{2} [A-Za-z]{3}, \d{4})\s+(.+?)(?:\s+(?:UPI|FCM|NEFT|IMPS)[-\s]?:?([A-Z0-9]+))?\s*(-?\d{1,3}(?:,\d{3})*(?:\.\d{2}))?\s*([+]?\d{1,3}(?:,\d{3})*(?:\.\d{2}))?\s+(-?\d{1,3}(?:,\d{3})*(?:\.\d{2}))/;

  //     const transactions = lines
  //       .map((line) => {
  //         const match = line.match(transactionRegex);
  //         if (match) {
  //           const [, date, details, referenceNumber, debitStr, creditStr, balanceStr] = match;

  //           const reference = referenceNumber
  //             ? `${
  //                 details
  //                   .split(/\s+/)
  //                   .find((word) => ['UPI', 'FCM', 'NEFT', 'IMPS'].includes(word)) || ''
  //               } ${referenceNumber}`.trim()
  //             : '';

  //           const parseAmount = (str) => {
  //             if (!str) return 0;
  //             return parseFloat(str.replace(/,/g, ''));
  //           };

  //           const debit = parseAmount(debitStr);
  //           const credit = parseAmount(creditStr);
  //           const balance = parseAmount(balanceStr);

  //           return {
  //             date,
  //             details: details.trim(),
  //             reference: reference,
  //             debit: debit < 0 ? Math.abs(debit) : 0,
  //             credit: credit > 0 ? credit : 0,
  //             balance,
  //           };
  //         }
  //         return null;
  //       })
  //       .filter(Boolean);

  //     // Sort transactions by date
  //     return transactions.sort((a, b) => {
  //       const dateA = new Date(a.date);
  //       const dateB = new Date(b.date);
  //       return dateA - dateB;
  //     });
  //   };

  const parseTransactions = (extractedData: any[]) => {
    const dateRegex = /^\d{2} [A-Za-z]{3}, \d{4}$/;
    return extractedData.filter(
      (row: { date: string }) => row && row.date && dateRegex.test(row.date)
    );
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], {
      type: 'application/json'
    });
    saveAs(blob, 'transactions.json');
  };

  const exportToXLSX = () => {
    const worksheet = XLSX.utils.json_to_sheet(transactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, 'transactions.xlsx');
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(transactions);
    saveAs(new Blob([csv], { type: 'text/csv' }), 'transactions.csv');
  };

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <Card className='mx-auto max-w-4xl'>
        <CardHeader>
          <CardTitle className='text-center text-2xl font-bold'>Parser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            <div className='flex justify-center'>
              <label className='relative cursor-pointer'>
                <input
                  type='file'
                  accept='application/pdf'
                  onChange={handleFileUpload}
                  className='hidden'
                />
                <div className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'>
                  <Upload size={20} />
                  <span>Upload PDF Statement</span>
                </div>
              </label>
            </div>

            {loading && (
              <div className='flex justify-center'>
                <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
              </div>
            )}

            {error && <div className='text-center text-red-500'>{error}</div>}

            {transactions.length > 0 && (
              <div className='space-y-4'>
                <div className='flex justify-center gap-4'>
                  <button
                    onClick={exportToJSON}
                    className='flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-white transition-colors hover:bg-gray-900'
                  >
                    <Download size={20} />
                    JSON
                  </button>
                  <button
                    onClick={exportToXLSX}
                    className='flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700'
                  >
                    <FileText size={20} />
                    XLSX
                  </button>
                  <button
                    onClick={exportToCSV}
                    className='flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700'
                  >
                    <Download size={20} />
                    CSV
                  </button>
                </div>

                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='bg-gray-100'>
                        <th className='px-4 py-2 text-left'>Date</th>
                        <th className='px-4 py-2 text-left'>Description</th>
                        <th className='px-4 py-2 text-left'>Reference</th>
                        <th className='px-4 py-2 text-right'>Debit</th>
                        <th className='px-4 py-2 text-right'>Credit</th>
                        <th className='px-4 py-2 text-right'>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx: any, index: number) => (
                        <tr key={index} className='border-t border-gray-200 hover:bg-gray-50'>
                          <td className='px-4 py-2'>{tx.date}</td>
                          <td className='px-4 py-2'>{tx.details}</td>
                          <td className='px-4 py-2 font-mono text-sm'>{tx.reference}</td>
                          <td className='px-4 py-2 text-right text-red-600'>
                            {tx.debit ? tx.debit.toFixed(2) : ''}
                          </td>
                          <td className='px-4 py-2 text-right text-green-600'>
                            {tx.credit ? tx.credit.toFixed(2) : ''}
                          </td>
                          <td className='px-4 py-2 text-right font-medium'>
                            {tx.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportTransactions;
