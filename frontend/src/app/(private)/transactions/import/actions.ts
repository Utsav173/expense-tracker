'use server';

import { getDocumentProxy, extractText } from 'unpdf';

interface ParsedTransaction {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

function parseTransactionLine(line: string): ParsedTransaction | null {
  const dateRegex = /^(\d{2} \w{3}, \d{4})/;
  const match = line.match(dateRegex);
  if (!match) return null;

  const date = match[1];
  let remainingLine = line.substring(date.length).trim();

  let description = '';
  let reference = '';
  let amountsPart = '';

  const amountRegex = /([+-]?[\d,]+\.\d{2})\s*([\d,]+\.\d{2})?$/;

  const amountMatch = remainingLine.match(amountRegex);
  if (amountMatch) {
    amountsPart = remainingLine.slice(remainingLine.lastIndexOf(amountMatch[0])).trim();
    const detailsPart = remainingLine.slice(0, remainingLine.lastIndexOf(amountMatch[0])).trim();

    const detailWords = detailsPart.split(/\s+/);
    if (
      (detailWords.length > 1 && detailWords.slice(-1)[0].startsWith('UPI')) ||
      detailWords.slice(-1)[0].startsWith('FCM') ||
      detailWords.slice(-1)[0].startsWith('IMPS') ||
      detailWords.slice(-1)[0].match(/^\d+$/)
    ) {
      reference = detailWords.pop()!;
      description = detailWords.join(' ').trim();
    } else {
      description = detailsPart;
    }
  } else {
    return null;
  }

  const amounts = amountsPart
    .split(/\s+/)
    .map((amt) => parseFloat(amt.replace(/[^\d.-]/g, '')) || 0);

  let debit = 0;
  let credit = 0;
  if (amounts[0] < 0) {
    debit = Math.abs(amounts[0]);
  } else {
    credit = amounts[0];
  }

  return {
    date,
    description: description.replace(/3 /, '').trim(),
    reference: reference.trim(),
    debit,
    credit,
    balance: amounts[1] || 0
  };
}

function mergeTransactionLines(lines: string[]): string[] {
  const dateRegex = /^\d{2}\s\w{3},\s\d{4}/;
  const mergedLines: string[] = [];
  let currentLineGroup: string[] = [];

  lines.forEach((line) => {
    if (dateRegex.test(line.trim())) {
      if (currentLineGroup.length) mergedLines.push(currentLineGroup.join(' ').trim());
      currentLineGroup = [line.trim()];
    } else {
      currentLineGroup.push(line.trim());
    }
  });

  if (currentLineGroup.length) mergedLines.push(currentLineGroup.join(' ').trim());
  return mergedLines;
}

export async function extractTransactions(
  dataBuffer: ArrayBuffer
): Promise<ParsedTransaction[] | { error: string; details: string }> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(dataBuffer));
    const { text: pageTexts } = await extractText(pdf, { mergePages: false });

    const startKeyword = 'DATE TRANSACTION DETAILS CHEQUE/REFERENCE# DEBIT CREDIT BALANCE';
    const endKeywords = ['SUMMARY', 'Page ', 'AP-Aut'];

    let allTransactions: ParsedTransaction[] = [];

    for (const pageText of pageTexts) {
      const lines = pageText.split('\n');
      const startIdx = lines.findIndex((line) => line.includes(startKeyword));
      if (startIdx !== -1) {
        const endIdx = lines.findIndex(
          (line, idx) => idx > startIdx && endKeywords.some((key) => line.startsWith(key))
        );

        const transactionLines = lines
          .slice(startIdx + 1, endIdx > -1 ? endIdx : undefined)
          .filter((line) => line.trim() && !line.startsWith('Page '));

        const mergedLines = mergeTransactionLines(transactionLines);
        const parsedLines = mergedLines
          .map(parseTransactionLine)
          .filter((line): line is ParsedTransaction => line !== null)
          .filter((transaction) => {
            const desc = transaction.description.toLowerCase();
            return (
              !desc.includes('opening balance') &&
              !desc.includes('balance brought forward') &&
              !desc.includes('balance carried forward') &&
              !desc.includes('b/f')
            );
          });

        allTransactions = [...allTransactions, ...parsedLines];
      }
    }

    if (!allTransactions.length) throw new Error('No transaction tables found.');

    return allTransactions;
  } catch (error: any) {
    console.error('Error during PDF parsing:', error);
    return { error: 'Error processing PDF', details: error.message };
  }
}
