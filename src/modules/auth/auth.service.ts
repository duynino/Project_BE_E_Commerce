import bcrypt from 'bcrypt'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { DataSource, EntityManager, FindOptionsSelect } from 'typeorm'
import type { RedisStore } from '~/common/redis/redis.service'
import { authTokenConfig } from '~/config/auth-token-config'
import Roles from '~/constants/role'
import { emailPayload } from '~/interface/common'
import { Role } from '~/modules/role/role.model'
import { User } from '~/modules/user/user.model'
import { UserRole } from '~/modules/user-role/user-role.model'

type AuthRoleCode = 'USER' | 'ADMIN' | 'STAFF'

interface AuthUserRolePayload {
  id: string | null
  name: string | null
  code: AuthRoleCode
}

interface AuthUserPayload {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  avatar: string | null
  isVerified: boolean
  role: AuthUserRolePayload
  createdAt: Date
  updatedAt: Date
}

interface AuthEmailJobData {
  email: string
  token: string
  userId: string
}

interface AuthEmailJobOptions {
  jobId: string
}

export interface AuthEmailQueue {
  add(name: string, data: AuthEmailJobData, options: AuthEmailJobOptions): Promise<unknown>
}

interface EmailVerificationTokenPayload {
  tokenHash: string
  email: string
}

interface PasswordResetTokenPayload {
  tokenHash: string
}

const AUTH_PUBLIC_USER_SELECT: FindOptionsSelect<User> = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true
}

const AUTH_EMAIL_STATUS_SELECT: FindOptionsSelect<User> = {
  id: true,
  email: true,
  isVerified: true
}

const AUTH_LOGIN_SELECT: FindOptionsSelect<User> = {
  id: true,
  email: true,
  password: true,
  isVerified: true,
  refreshToken: true
}

const AUTH_REFRESH_SELECT: FindOptionsSelect<User> = {
  id: true,
  email: true,
  refreshToken: true
}

const AUTH_EMAIL_ONLY_SELECT: FindOptionsSelect<User> = {
  id: true,
  email: true
}

const AUTH_TOKEN_BYTE_LENGTH = 32
const SHA256_HEX_LENGTH = 64
const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/i
const EMAIL_VERIFICATION_KEY_PREFIX = 'email_verify'
const PASSWORD_RESET_KEY_PREFIX = 'password_reset'
const LEGACY_EMAIL_VERIFICATION_USED_KEY_PREFIX = 'email_verify_legacy_used'
const LEGACY_PASSWORD_RESET_USED_KEY_PREFIX = 'password_reset_legacy_used'

const buildEmailVerificationKey = (userId: string) => `${EMAIL_VERIFICATION_KEY_PREFIX}:${userId}`
const buildPasswordResetKey = (userId: string) => `${PASSWORD_RESET_KEY_PREFIX}:${userId}`
const buildLegacyUsedKey = (prefix: string, token: string) => `${prefix}:${hashAuthToken(token)}`
const buildPasswordResetJobId = (userId: string) => `forgot-password-${userId}`

const generateAuthToken = () => randomBytes(AUTH_TOKEN_BYTE_LENGTH).toString('hex')

const hashAuthToken = (token: string) => createHash('sha256').update(token).digest('hex')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const requireNonEmptyString = (value: string | undefined, message: string) => {
  if (!value || !value.trim()) throw new Error(message)
  return value.trim()
}

const parseJson = (value: string, errorMessage: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value) as unknown
    if (!isRecord(parsed)) throw new Error(errorMessage)

    return parsed
  } catch {
    throw new Error(errorMessage)
  }
}

const parseEmailVerificationPayload = (value: string): EmailVerificationTokenPayload => {
  const parsed = parseJson(value, 'Invalid or expired verification token')

  if (typeof parsed.tokenHash !== 'string' || typeof parsed.email !== 'string') {
    throw new Error('Invalid or expired verification token')
  }

  return {
    tokenHash: parsed.tokenHash,
    email: parsed.email
  }
}

const parsePasswordResetPayload = (value: string): PasswordResetTokenPayload => {
  const parsed = parseJson(value, 'Reset token expired')

  if (typeof parsed.tokenHash !== 'string') {
    throw new Error('Reset token expired')
  }

  return {
    tokenHash: parsed.tokenHash
  }
}

const isTokenHashMatch = (storedHash: string | null | undefined, token: string) => {
  if (!storedHash || !SHA256_HEX_REGEX.test(storedHash)) return false

  const incomingHash = hashAuthToken(token)
  const storedBuffer = Buffer.from(storedHash, 'hex')
  const incomingBuffer = Buffer.from(incomingHash, 'hex')

  return (
    storedBuffer.length === SHA256_HEX_LENGTH / 2 &&
    storedBuffer.length === incomingBuffer.length &&
    timingSafeEqual(storedBuffer, incomingBuffer)
  )
}

const normalizeRoleCode = (roleName?: string | null): AuthRoleCode => {
  const normalized = roleName?.trim().toLowerCase()

  if (normalized === Roles.ADMIN) return 'ADMIN'
  if (normalized === Roles.MANAGER || normalized === 'staff') return 'STAFF'
  return 'USER'
}

export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: RedisStore,
    private readonly emailQueue: AuthEmailQueue
  ) {}

  private getUserRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(User) : this.dataSource.getRepository(User)
  }

  private getUserRoleRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(UserRole) : this.dataSource.getRepository(UserRole)
  }

  private async findPrimaryRoleByUserId(userId: string, manager?: EntityManager): Promise<AuthUserRolePayload> {
    const userRole = await this.getUserRoleRepository(manager).findOne({
      where: { userId },
      relations: { role: true },
      order: { createdAt: 'ASC' }
    })

    return {
      id: userRole?.role?.id ?? null,
      name: userRole?.role?.name ?? null,
      code: normalizeRoleCode(userRole?.role?.name)
    }
  }

  private async findAuthUserById(id: string, manager?: EntityManager): Promise<AuthUserPayload> {
    const user = await this.getUserRepository(manager).findOne({
      where: { id },
      select: AUTH_PUBLIC_USER_SELECT
    })

    if (!user) throw new Error('User not found')

    const role = await this.findPrimaryRoleByUserId(user.id, manager)

    return {
      id: user.id,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      email: user.email,
      avatar: user.avatarUrl ?? null,
      isVerified: user.isVerified,
      role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }

  private createTokenPayload(userId: string, email: string) {
    return {
      userId,
      email
    }
  }

  private getLegacyUserId(token: string, secret: string) {
    try {
      const decoded = jwt.verify(token, secret) as emailPayload
      return typeof decoded.userId === 'string' ? decoded.userId : null
    } catch {
      return null
    }
  }

  private isValidLegacyToken(token: string, secret: string, user: Pick<User, 'id' | 'email'>) {
    try {
      const decoded = jwt.verify(token, secret) as emailPayload
      return decoded.userId === user.id && decoded.email === user.email
    } catch {
      return false
    }
  }

  private async consumeLegacyTokenOnce(
    keyPrefix: string,
    token: string,
    ttlSeconds: number,
    usedErrorMessage: string
  ) {
    const usedKey = buildLegacyUsedKey(keyPrefix, token)
    const wasUsed = await this.redis.get(usedKey)
    if (wasUsed) throw new Error(usedErrorMessage)

    await this.redis.set(usedKey, '1', ttlSeconds)
  }

  private async rollbackRedisKeyOnFailure(key: string | null, error: unknown): Promise<never> {
    if (key) {
      try {
        await this.redis.del(key)
      } catch {
        // Keep the original error. The Redis key will expire by TTL if cleanup fails.
      }
    }

    throw error
  }

  async registerUser(firstName: string, lastName: string, email: string, password: string) {
    let createdTokenKey: string | null = null

    try {
      return await this.dataSource.transaction(async (manager) => {
        const hashPassword = await bcrypt.hash(password, Number(process.env.SALT || 10))

        const checkUser = await manager.findOne(User, {
          where: { email },
          select: { id: true }
        })
        if (checkUser) throw new Error('Email already in use')

        const newUser = manager.create(User, {
          firstName,
          lastName,
          email,
          password: hashPassword
        })
        await manager.save(newUser)

        const role = await manager.findOne(Role, {
          where: { name: Roles.CUSTOMER },
          select: { id: true }
        })
        if (!role) throw new Error('Default role not found')

        await manager.save(UserRole, {
          userId: newUser.id,
          roleId: role.id
        })

        const emailVerificationToken = generateAuthToken()
        createdTokenKey = buildEmailVerificationKey(newUser.id)

        await this.redis.set(
          createdTokenKey,
          JSON.stringify({
            tokenHash: hashAuthToken(emailVerificationToken),
            email: newUser.email
          }),
          authTokenConfig.emailVerificationTokenTtlSeconds
        )

        await this.emailQueue.add(
          'verify-email',
          {
            email: newUser.email,
            token: emailVerificationToken,
            userId: newUser.id
          },
          { jobId: `verify-email-${newUser.id}` }
        )

        return {}
      })
    } catch (error) {
      if (createdTokenKey) {
        await this.rollbackRedisKeyOnFailure(
          createdTokenKey,
          new Error(`Registration failed: ${(error as Error).message}`)
        )
      }

      throw new Error(`Registration failed: ${(error as Error).message}`)
    }
  }

  async verifyEmail(token: string, userId?: string) {
    try {
      const safeToken = requireNonEmptyString(token, 'Invalid token')
      const resolvedUserId =
        userId?.trim() ||
        this.getLegacyUserId(safeToken, process.env.EMAIL_VERIFICATION_SECRET || 'default_secret')

      if (!resolvedUserId) throw new Error('User ID is required')

      return await this.dataSource.transaction(async (manager) => {
        const user = await manager.findOne(User, {
          where: { id: resolvedUserId },
          select: AUTH_EMAIL_STATUS_SELECT
        })

        if (!user) throw new Error('User not found')

        const redisKey = buildEmailVerificationKey(user.id)
        const redisValue = await this.redis.get(redisKey)

        if (!redisValue) {
          if (
            !this.isValidLegacyToken(
              safeToken,
              process.env.EMAIL_VERIFICATION_SECRET || 'default_secret',
              user
            )
          ) {
            throw new Error('Invalid or expired verification token')
          }

          await this.consumeLegacyTokenOnce(
            LEGACY_EMAIL_VERIFICATION_USED_KEY_PREFIX,
            safeToken,
            authTokenConfig.emailVerificationTokenTtlSeconds,
            'Invalid or expired verification token'
          )
          await manager.update(User, { id: user.id }, { isVerified: true })

          return {
            message: 'Email verified successfully'
          }
        }

        const payload = parseEmailVerificationPayload(redisValue)

        if (payload.email !== user.email || !isTokenHashMatch(payload.tokenHash, safeToken)) {
          throw new Error('Invalid verification token')
        }

        const wasConsumed = await this.redis.deleteIfValueEquals(redisKey, redisValue)
        if (!wasConsumed) throw new Error('Invalid or expired verification token')

        await manager.update(User, { id: user.id }, { isVerified: true })

        return {
          message: 'Email verified successfully'
        }
      })
    } catch (error) {
      throw new Error(`Email verification failed: ${(error as Error).message}`)
    }
  }

  async loginUser(email: string, password: string) {
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { email },
        select: AUTH_LOGIN_SELECT
      })

      if (!user) throw new Error('Invalid email or password')
      if (!user.isVerified) throw new Error('Email is not verified')

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) throw new Error('Invalid email or password')

      const tokenPayload = this.createTokenPayload(user.id, user.email)

      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'default_jwt_secret', {
        expiresIn: '1h'
      })

      const refreshToken = jwt.sign(
        tokenPayload,
        process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
        { expiresIn: '7d' }
      )

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await manager.update(User, { id: user.id }, { refreshToken, expiresAt })

      return {
        accessToken,
        refreshToken,
        user: await this.findAuthUserById(user.id, manager)
      }
    })
  }

  async logoutUser(userId: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = await manager.findOne(User, {
          where: { id: userId },
          select: { id: true }
        })
        if (!user) throw new Error('User not found')

        await manager.update(User, { id: userId }, { refreshToken: null, expiresAt: null })
        return { message: 'Logout successful' }
      })
    } catch (error) {
      throw new Error(`Logout failed: ${(error as Error).message}`)
    }
  }

  async refreshToken(refreshToken: string) {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret'
    ) as emailPayload
    const userId = decoded.userId

    if (!userId) throw new Error('Invalid refresh token')

    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      select: AUTH_REFRESH_SELECT
    })

    if (!user || user.refreshToken !== refreshToken) throw new Error('Invalid refresh token')

    if (user.expiresAt && user.expiresAt < new Date()) {
      throw new Error('Refresh token expired')
    }

    const tokenPayload = this.createTokenPayload(user.id, user.email)

    const newAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'default_jwt_secret', {
      expiresIn: '15m'
    })

    const newRefreshToken = jwt.sign(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
      { expiresIn: '7d' }
    )

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await this.dataSource.getRepository(User).update(user.id, {
      refreshToken: newRefreshToken,
      expiresAt
    })

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  }

  async getCurrentUser(userId: string) {
    return {
      user: await this.findAuthUserById(userId)
    }
  }

  async forgotPassword(email: string) {
    let resetTokenKey: string | null = null

    try {
      const user = await this.dataSource.getRepository(User).findOne({
        where: { email },
        select: AUTH_EMAIL_ONLY_SELECT
      })
      if (!user) throw new Error('User not found')

      const forgotPasswordToken = generateAuthToken()
      resetTokenKey = buildPasswordResetKey(user.id)

      await this.redis.set(
        resetTokenKey,
        JSON.stringify({ tokenHash: hashAuthToken(forgotPasswordToken) }),
        authTokenConfig.passwordResetTokenTtlSeconds
      )

      await this.emailQueue.add(
        'forgot-password',
        {
          email: user.email,
          token: forgotPasswordToken,
          userId: user.id
        },
        { jobId: buildPasswordResetJobId(user.id) }
      )
    } catch (error) {
      if (resetTokenKey) {
        await this.rollbackRedisKeyOnFailure(
          resetTokenKey,
          new Error(`Forgot password process failed: ${(error as Error).message}`)
        )
      }

      throw new Error(`Forgot password process failed: ${(error as Error).message}`)
    }
  }

  async resetPassword(token: string, userId: string | undefined, newPassword: string, confirmPassword: string) {
    try {
      const safeToken = requireNonEmptyString(token, 'Token is required')
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match')

      const resolvedUserId =
        userId?.trim() ||
        this.getLegacyUserId(
          safeToken,
          process.env.PASSWORD_RESET_SECRET || 'default_password_reset_secret'
        )

      if (!resolvedUserId) throw new Error('User ID is required')

      return await this.dataSource.transaction(async (manager) => {
        const user = await manager.findOne(User, {
          where: { id: resolvedUserId },
          select: AUTH_EMAIL_ONLY_SELECT
        })

        if (!user) throw new Error('User not found')

        const redisKey = buildPasswordResetKey(user.id)
        const redisValue = await this.redis.get(redisKey)

        if (!redisValue) {
          if (
            !this.isValidLegacyToken(
              safeToken,
              process.env.PASSWORD_RESET_SECRET || 'default_password_reset_secret',
              user
            )
          ) {
            throw new Error('Reset token expired')
          }

          await this.consumeLegacyTokenOnce(
            LEGACY_PASSWORD_RESET_USED_KEY_PREFIX,
            safeToken,
            authTokenConfig.passwordResetTokenTtlSeconds,
            'Reset token expired'
          )
        } else {
          const payload = parsePasswordResetPayload(redisValue)

          if (!isTokenHashMatch(payload.tokenHash, safeToken)) {
            throw new Error('Invalid reset token')
          }

          const wasConsumed = await this.redis.deleteIfValueEquals(redisKey, redisValue)
          if (!wasConsumed) throw new Error('Reset token expired')
        }

        const hashPassword = await bcrypt.hash(newPassword, Number(process.env.SALT || 10))
        await manager.update(User, { id: user.id }, {
          password: hashPassword,
          refreshToken: null,
          expiresAt: null
        })

        return {
          user,
          message: 'Password reset successful'
        }
      })
    } catch (error) {
      throw new Error(`Password reset failed: ${(error as Error).message}`)
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string, confirmPassword: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = await manager.findOne(User, {
          where: { id: userId },
          select: AUTH_LOGIN_SELECT
        })

        if (!user) throw new Error('User not found')

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password)
        if (!isPasswordValid) throw new Error('Invalid old password')
        if (newPassword !== confirmPassword) throw new Error('Passwords do not match')

        const hashPassword = await bcrypt.hash(newPassword, Number(process.env.SALT || 10))

        const tokenPayload = this.createTokenPayload(user.id, user.email)

        const newAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'default_jwt_secret', {
          expiresIn: '15m'
        })

        const newRefreshToken = jwt.sign(
          tokenPayload,
          process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
          { expiresIn: '7d' }
        )

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        await manager.update(User, { id: user.id }, {
          password: hashPassword,
          refreshToken: newRefreshToken,
          expiresAt
        })

        const authUser = await this.findAuthUserById(user.id, manager)

        return {
          user: authUser,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          message: 'Password changed successfully'
        }
      })
    } catch (error) {
      throw new Error(`Password change failed: ${(error as Error).message}`)
    }
  }

  private async findPublicUserById(id: string, manager?: EntityManager) {
    const repository = manager ? manager.getRepository(User) : this.dataSource.getRepository(User)
    return await repository.findOne({
      where: { id },
      select: AUTH_PUBLIC_USER_SELECT
    })
  }
}
