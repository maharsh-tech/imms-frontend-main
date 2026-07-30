import apiClient from './client';
import type { AccountInvite, BulkCreateResult } from '../types';

export const getAccountInvites = async (): Promise<AccountInvite[]> => {
  const response = await apiClient.get<AccountInvite[]>('/allowed-users');
  return response.data;
};

export const createAccountInvite = async (data: {
  email?: string;
  role: string;
  identifier?: string;
}): Promise<AccountInvite> => {
  const response = await apiClient.post<AccountInvite>('/allowed-users', data);
  return response.data;
};

export const bulkCreateAccountInvites = async (data: {
  role: string;
  entries: { identifier?: string; email?: string }[];
}): Promise<BulkCreateResult> => {
  const response = await apiClient.post<BulkCreateResult>('/allowed-users/bulk', data);
  return response.data;
};

export const deleteAccountInvite = async (id: string): Promise<void> => {
  await apiClient.delete(`/allowed-users/${id}`);
};
