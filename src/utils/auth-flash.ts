/** One-time UI flash via React Router location state — never URL query params. */
export type AuthFlashState = {
  activationSuccess?: boolean
}

export const activationSuccessFlash = (): AuthFlashState => ({
  activationSuccess: true,
})

export const ACTIVATION_SUCCESS_MESSAGE =
  'Account activated. Sign in with your roll number (students) or email (staff) and password.'
