import { Hono } from 'hono';
import { emailService } from '../services/email.service';
import { zValidator } from '@hono/zod-validator';
import { emailPayloadSchema } from '../utils/schema.validations';

const emailRouter = new Hono();

emailRouter.post('/send', zValidator('json', emailPayloadSchema), async (c) => {
  const { subject, html, to, replyTo } = c.req.valid('json');

  emailService.sendMail({
    html,
    subject,
    to,
    replyTo,
  });

  return c.json({ success: true });
});

export default emailRouter;
