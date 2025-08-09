import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { InvitationAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type VerifyInvitationQuery = z.infer<typeof apiEndpoints.invitation.verify.query>;
type CreateInvitationBody = z.infer<typeof apiEndpoints.invitation.create.body>;

export const verifyInvitation = (
  token: string
): Promise<InvitationAPI.VerifyInvitationResponse> => {
  const query: VerifyInvitationQuery = { token };
  return apiClient(apiEndpoints.invitation.verify, { query });
};

export const sendInvitation = (email: string): Promise<InvitationAPI.CreateInvitationResponse> => {
  const body: CreateInvitationBody = { email };
  return apiClient(apiEndpoints.invitation.create, { body });
};
