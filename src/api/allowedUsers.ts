import apiClient from './client'
import type { AccountInvite, BulkCreateResult } from '../types'
import type { PaginatedResult, PaginationParams } from '../types/pagination'

export type AllowedUsersListParams = PaginationParams & {
  role?: string
  prefix?: string
}

export const getAccountInvites = async (
  params?: AllowedUsersListParams,
): Promise<PaginatedResult<AccountInvite>> => {
  const response = await apiClient.get<PaginatedResult<AccountInvite>>('/allowed-users', {
    params,
  })
  return response.data
}

export const getStudentPrefixes = async (): Promise<{ prefixes: string[] }> => {
  const response = await apiClient.get<{ prefixes: string[] }>('/allowed-users/student-prefixes')
  return response.data
}

export const createAccountInvite = async (data: {
  email?: string
  role: string
  identifier?: string
}): Promise<AccountInvite> => {
  const response = await apiClient.post<AccountInvite>('/allowed-users', data)
  return response.data
}

export const bulkCreateAccountInvites = async (data: {
  role: string
  entries: { identifier?: string; email?: string }[]
}): Promise<BulkCreateResult> => {
  const response = await apiClient.post<BulkCreateResult>('/allowed-users/bulk', data)
  return response.data
}

export const bulkDeleteAccountInvites = async (
  prefix: string,
): Promise<{ deleted: number }> => {
  const response = await apiClient.post<{ deleted: number }>('/allowed-users/bulk-delete', {
    prefix,
  })
  return response.data
}

export const deleteAccountInvite = async (id: string): Promise<void> => {
  await apiClient.delete(`/allowed-users/${id}`)
}
