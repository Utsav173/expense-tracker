import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { contactFormSchema } from '../utils/schema.validations';
import { contactService } from '../services/contact.service';

const contactRouter = new Hono();

contactRouter.post('/', zValidator('json', contactFormSchema), async (c) => {
  try {
    const payload = c.req.valid('json');
    const result = await contactService.handleContactSubmission(payload);
    if (!result.success) {
      throw new HTTPException(500, { message: result.message });
    }
    return c.json({ message: result.message });
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    console.error('Contact form error:', error);
    throw new HTTPException(500, {
      message: error.message || 'Failed to process contact request.',
    });
  }
});

export default contactRouter;
