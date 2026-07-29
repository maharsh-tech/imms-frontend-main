import apiClient from './client';
import type { AllowedUser } from '../types';

export const getAllowedUsers = async (): Promise<AllowedUser[]> => {
  const response = await apiClient.get<AllowedUser[]>('/allowed-users');
  return response.data;
};

export const createAllowedUser = async (data: { email: string; role: string }): Promise<AllowedUser> => {
  const response = await apiClient.post<AllowedUser>('/allowed-users', data);
  return response.data;
};

export const deleteAllowedUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/allowed-users/${id}`);
};
