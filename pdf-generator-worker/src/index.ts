import { Hono } from 'hono';
import puppeteer from '@cloudflare/puppeteer';

interface GeneratePdfRequest {
	htmlContent: string;
	pdfOptions?: any;
}

const app = new Hono();

app.post('/generate-pdf', async (c) => {
	try {
		const { htmlContent, pdfOptions } =
			(await c.req.json()) as GeneratePdfRequest;

		if (!htmlContent) {
			return c.json({ error: 'htmlContent is required' }, 400);
		}

		const browser = await puppeteer.launch(c.env.MYBROWSER);
		const page = await browser.newPage();

		await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

		const pdfBuffer = await page.pdf(pdfOptions);

		await browser.close();

		return new Response(pdfBuffer, {
			headers: { 'Content-Type': 'application/pdf' },
		});
	} catch (error: any) {
		console.error('Error generating PDF:', error);
		return c.json({ error: error.message || 'Failed to generate PDF' }, 500);
	}
});

export default app;
