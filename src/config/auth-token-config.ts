const DEFAULT_EMAIL_VERIFICATION_TOKEN_TTL_SECONDS = 24 * 60 * 60
const DEFAULT_PASSWORD_RESET_TOKEN_TTL_SECONDS = 10 * 60

const parsePositiveInteger = (name: string, value: string): number => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }

  return parsed
}

const readTtlSeconds = (
  name: string,
  defaultValue: number,
  legacyMillisecondsName?: string
): number => {
  const value = process.env[name]
  if (value) return parsePositiveInteger(name, value)

  if (legacyMillisecondsName) {
    const legacyValue = process.env[legacyMillisecondsName]
    if (legacyValue) {
      const milliseconds = parsePositiveInteger(legacyMillisecondsName, legacyValue)
      const seconds = Math.floor(milliseconds / 1000)

      if (seconds <= 0) {
        throw new Error(`${legacyMillisecondsName} must be at least 1000 milliseconds`)
      }

      return seconds
    }
  }

  return defaultValue
}

export const authTokenConfig = {
  emailVerificationTokenTtlSeconds: readTtlSeconds(
    'EMAIL_VERIFICATION_TOKEN_TTL_SECONDS',
    DEFAULT_EMAIL_VERIFICATION_TOKEN_TTL_SECONDS,
    'EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_MS'
  ),
  passwordResetTokenTtlSeconds: readTtlSeconds(
    'PASSWORD_RESET_TOKEN_TTL_SECONDS',
    DEFAULT_PASSWORD_RESET_TOKEN_TTL_SECONDS
  )
} as const
