import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAccountInvites,
  getStudentPrefixes,
  createAccountInvite,
  bulkCreateAccountInvites,
  bulkDeleteAccountInvites,
  deleteAccountInvite,
} from '../api/allowedUsers'
import type { AllowedUsersListParams } from '../api/allowedUsers'

export const ACCOUNT_INVITES_KEY = 'accountInvites'
export const STUDENT_PREFIXES_KEY = 'studentPrefixes'

export type AccountInvitesQueryParams = AllowedUsersListParams

export const useAccountInvites = (
  params: AccountInvitesQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: [ACCOUNT_INVITES_KEY, params],
    queryFn: () => getAccountInvites(params),
    enabled,
  })

export const useStudentPrefixes = (enabled: boolean) =>
  useQuery({
    queryKey: [STUDENT_PREFIXES_KEY],
    queryFn: getStudentPrefixes,
    enabled,
  })

export const useAccountInvitesInvalidator = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: [ACCOUNT_INVITES_KEY] })
    queryClient.invalidateQueries({ queryKey: [STUDENT_PREFIXES_KEY] })
  }
}

export const accountInviteMutations = {
  create: createAccountInvite,
  bulkCreate: bulkCreateAccountInvites,
  bulkDelete: bulkDeleteAccountInvites,
  delete: deleteAccountInvite,
}
