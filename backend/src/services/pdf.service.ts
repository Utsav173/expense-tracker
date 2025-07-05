import { HTTPException } from 'hono/http-exception';

export class PdfService {
  async generatePdfFromTemplate(templateName: string, data: any, pdfOptions?: any): Promise<ArrayBuffer> {
    try {
      const workerUrl = process.env.CLOUDFLARE_WORKER_PDF_URL;

      if (!workerUrl) {
        throw new Error('CLOUDFLARE_WORKER_PDF_URL environment variable is not set.');
      }

      const response = await fetch(`${workerUrl}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateName, data, pdfOptions }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare Worker error: ${response.status} - ${errorText}`);
      }

      return await response.arrayBuffer();
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      throw new HTTPException(500, { message: `Failed to generate PDF: ${error.message}` });
    }
  }
}

export const pdfService = new PdfService();
