import { Hono } from 'hono';
import puppeteer from '@cloudflare/puppeteer';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Statement } from './components/Statement';

const templates = {
	statement: Statement,
};

interface GeneratePdfRequest {
	templateName: keyof typeof templates;
	data?: any;
	pdfOptions?: any;
}

const app = new Hono();

app.post('/generate-pdf', async (c) => {
	try {
		const {
			templateName,
			data = {},
			pdfOptions = {},
		} = (await c.req.json()) as GeneratePdfRequest;

		if (!templateName) {
			return c.json({ error: 'templateName is required' }, 400);
		}

		const TemplateComponent = templates[templateName];
		if (!TemplateComponent) {
			return c.json({ error: `Unsupported template: ${templateName}` }, 400);
		}

		// Use React.createElement to avoid JSX syntax issues with dynamic components.
		const reactElement = React.createElement(TemplateComponent, data);
		const htmlContent = `<!DOCTYPE html>${ReactDOMServer.renderToStaticMarkup(
			reactElement
		)}`;

		// The type of c.env.MYBROWSER is now correctly inferred as BrowserWorker.
		const browser = await puppeteer.launch(c.env.MYBROWSER);
		const page = await browser.newPage();

		await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true,
			...pdfOptions,
		});

		await browser.close();

		return new Response(pdfBuffer as any, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${templateName}-${Date.now()}.pdf"`,
			},
		});
	} catch (error: any) {
		console.error('Error generating PDF:', error.stack);
		return c.json(
			{ error: 'Failed to generate PDF', details: error.message },
			500
		);
	}
});

export default app;
