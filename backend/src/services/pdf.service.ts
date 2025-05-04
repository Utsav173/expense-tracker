import puppeteer, { PDFOptions } from 'puppeteer';
import { HTTPException } from 'hono/http-exception';

export class PdfService {
  /**
   * Generates a PDF buffer from HTML content using Puppeteer.
   * @param htmlContent - The HTML string to render.
   * @param pdfOptions - Optional Puppeteer PDF options (e.g., format, printBackground).
   * @returns A Buffer containing the generated PDF data.
   */
  async generatePdfFromHtml(htmlContent: string, pdfOptions?: PDFOptions): Promise<Buffer> {
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--font-render-hinting=none',
        ],
      });
      const page = await browser.newPage();

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const defaultOptions: PDFOptions = {
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      };

      const pdfBuffer = await page.pdf({ ...defaultOptions, ...pdfOptions });

      return pdfBuffer;
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      throw new HTTPException(500, { message: `Failed to generate PDF: ${error.message}` });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

export const pdfService = new PdfService();
