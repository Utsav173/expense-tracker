'use server';

import { getDocumentProxy, extractText } from 'unpdf';
import { aiProcessTransactionPdf } from '@/lib/endpoints/ai';
import { ParsedTransactionFromAI } from '@/lib/types';

export async function extractTransactionsFromPdf(
  dataBuffer: ArrayBuffer
): Promise<{ transactions: ParsedTransactionFromAI[] } | { error: string; details: string }> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(dataBuffer));
    // Extract raw text from all pages, merged.
    const { text } = await extractText(pdf, { mergePages: true });

    if (!text || text.trim().length < 50) {
      throw new Error(
        'Could not extract sufficient text from the PDF. The document might be empty or image-based.'
      );
    }

    // Send the raw text to the backend AI for processing
    const aiResponse = await aiProcessTransactionPdf({ documentContent: text });

    if (!aiResponse || !Array.isArray(aiResponse.transactions)) {
      throw new Error('AI processing failed to return valid transaction data.');
    }

    return { transactions: aiResponse.transactions };
  } catch (error: any) {
    console.error('Error during AI-powered PDF parsing:', error);
    return { error: 'Error processing PDF with AI', details: error.message };
  }
}
