import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { inviteSchema, verifyInvitationSchema } from '../utils/schema.validations';
import { invitationService } from '../services/invitation.service';
import authMiddleware from '../middleware';

const invitationRouter = new Hono();

invitationRouter.post('/', authMiddleware, zValidator('json', inviteSchema), async (c) => {
  const { email } = c.req.valid('json');
  const userId = c.get('userId');

  const result = await invitationService.createInvitation(userId, email);
  return c.json(result, 201);
});

invitationRouter.get('/verify', zValidator('query', verifyInvitationSchema), async (c) => {
  const { token } = c.req.valid('query');
  const invitation = await invitationService.verifyInvitation(token);
  return c.json({ message: 'Invitation valid.', invitation }, 200);
});

export default invitationRouter;
