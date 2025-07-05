import { db } from '../database';
import { Invitation, User } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { emailService } from './email.service';
import { generateRandomString } from '../utils/crypto.utils';

export class InvitationService {
  async createInvitation(inviterId: string, inviteeEmail: string) {
    const existingUser = await db.query.User.findFirst({
      where: eq(User.email, inviteeEmail),
    });

    if (existingUser) {
      throw new HTTPException(400, { message: 'User with this email already exists.' });
    }

    const existingInvitation = await db.query.Invitation.findFirst({
      where: and(eq(Invitation.inviteeEmail, inviteeEmail), eq(Invitation.status, 'pending')),
    });

    if (existingInvitation) {
      throw new HTTPException(409, {
        message: 'Invitation already sent to this email and is pending.',
      });
    }

    const token = generateRandomString(32); // Generate a secure token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Expires in 24 hours

    const [newInvitation] = await db
      .insert(Invitation)
      .values({
        inviterId,
        inviteeEmail,
        token,
        expiresAt,
        status: 'pending',
      })
      .returning();

    if (!newInvitation) {
      throw new HTTPException(500, { message: 'Failed to create invitation.' });
    }

    const inviter = await db.query.User.findFirst({
      where: eq(User.id, inviterId),
      columns: { name: true },
    });

    const inviterName = inviter?.name || 'Someone';
    const invitationLink = `${process.env.FRONTEND_URL}/auth/verify-invitation?token=${token}`;

    await emailService.sendInvitationEmail(inviteeEmail, inviterName, invitationLink);

    return { message: 'Invitation sent successfully.', invitation: newInvitation };
  }

  async verifyInvitation(token: string) {
    const invitation = await db.query.Invitation.findFirst({
      where: eq(Invitation.token, token),
    });

    if (!invitation) {
      throw new HTTPException(404, { message: 'Invalid or non-existent invitation token.' });
    }

    if (invitation.status === 'accepted') {
      throw new HTTPException(409, { message: 'This invitation has already been accepted.' });
    }

    if (invitation.status === 'expired' || new Date() > invitation.expiresAt) {
      // Mark as expired if not already
      if (invitation.status !== 'expired') {
        await db
          .update(Invitation)
          .set({ status: 'expired', updatedAt: new Date() })
          .where(eq(Invitation.id, invitation.id));
      }
      throw new HTTPException(410, { message: 'This invitation has expired.' });
    }

    return invitation;
  }

  async acceptInvitation(token: string, newUserId: string, inviteeEmail: string) {
    const invitation = await this.verifyInvitation(token);

    if (invitation.inviteeEmail !== inviteeEmail) {
      throw new HTTPException(400, { message: 'Email mismatch for this invitation token.' });
    }

    await db
      .update(Invitation)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(Invitation.id, invitation.id));

    return { message: 'Invitation accepted successfully.' };
  }
}

export const invitationService = new InvitationService();
