// src/services/pdf.service.ts
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
      // Launch Puppeteer - consider reusing browser instance for performance if generating many PDFs
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Often needed in containerized environments
          '--font-render-hinting=none', // Can help with font rendering issues
        ],
        // Consider specifying executablePath if needed in certain environments
        // executablePath: '/usr/bin/google-chrome-stable' // Example path
      });
      const page = await browser.newPage();

      // Set content and wait for network activity to settle
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Default PDF options
      const defaultOptions: PDFOptions = {
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      };

      // Generate PDF buffer
      const pdfBuffer = await page.pdf({ ...defaultOptions, ...pdfOptions });

      return pdfBuffer;
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      throw new HTTPException(500, { message: `Failed to generate PDF: ${error.message}` });
    } finally {
      // Ensure browser is closed even if errors occur
      if (browser) {
        await browser.close();
      }
    }
  }
}

// Export a singleton instance
export const pdfService = new PdfService();
