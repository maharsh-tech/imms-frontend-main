import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAccountInvites,
  createAccountInvite,
  bulkCreateAccountInvites,
  deleteAccountInvite,
  regenerateActivationLink,
} from '../api/allowedUsers'
import type { PaginationParams } from '../types/pagination'

export const ACCOUNT_INVITES_KEY = 'accountInvites'

export type AccountInvitesQueryParams = PaginationParams & { role?: string }

export const useAccountInvites = (params: AccountInvitesQueryParams) =>
  useQuery({
    queryKey: [ACCOUNT_INVITES_KEY, params],
    queryFn: () => getAccountInvites(params),
  })

export const useAccountInvitesInvalidator = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [ACCOUNT_INVITES_KEY] })
}

export const accountInviteMutations = {
  create: createAccountInvite,
  bulkCreate: bulkCreateAccountInvites,
  delete: deleteAccountInvite,
  regenerateLink: regenerateActivationLink,
}
