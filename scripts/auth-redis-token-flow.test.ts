import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import bcrypt from 'bcrypt'
import { DataSource } from 'typeorm'
import { AuthService } from '../src/modules/auth/auth.service'
import { authTokenConfig } from '../src/config/auth-token-config'
import type { RedisStore } from '../src/common/redis/redis.service'
import type { AuthEmailQueue } from '../src/modules/auth/auth.service'

interface TestUser {
  id: string
  email: string
  password: string
  isVerified: boolean
  refreshToken: string | null
  expiresAt: Date | null
}

interface RedisEntry {
  value: string
  expiresAt: number
  ttlSeconds: number
}

interface QueuedEmailJob {
  name: string
  data: {
    email: string
    token: string
    userId: string
  }
  options: {
    jobId: string
  }
}

const sha256 = (token: string) => createHash('sha256').update(token).digest('hex')

class FakeRedisStore implements RedisStore {
  readonly entries = new Map<string, RedisEntry>()

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.entries.set(key, {
      value,
      ttlSeconds,
      expiresAt: Date.now() + ttlSeconds * 1000
    })
  }

  async get(key: string): Promise<string | null> {
    const entry = this.entries.get(key)
    if (!entry) return null

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key)
      return null
    }

    return entry.value
  }

  async del(key: string): Promise<void> {
    this.entries.delete(key)
  }

  async deleteIfValueEquals(key: string, value: string): Promise<boolean> {
    const current = await this.get(key)
    if (current !== value) return false

    this.entries.delete(key)
    return true
  }

  expire(key: string): void {
    const entry = this.entries.get(key)
    if (entry) {
      entry.expiresAt = Date.now() - 1000
    }
  }
}

class FakeEmailQueue implements AuthEmailQueue {
  readonly jobs: QueuedEmailJob[] = []

  async add(name: string, data: QueuedEmailJob['data'], options: QueuedEmailJob['options']): Promise<void> {
    this.jobs.push({ name, data, options })
  }
}

class FakeEntityManager {
  constructor(private readonly users: Map<string, TestUser>) {}

  async findOne(_entity: unknown, options: { where?: { id?: string; email?: string } }): Promise<TestUser | null> {
    const where = options.where
    if (where?.id) return this.users.get(where.id) ?? null
    if (where?.email) {
      return Array.from(this.users.values()).find((user) => user.email === where.email) ?? null
    }
    return null
  }

  async update(_entity: unknown, criteria: string | { id: string }, update: Partial<TestUser>): Promise<void> {
    const id = typeof criteria === 'string' ? criteria : criteria.id
    const user = this.users.get(id)
    if (!user) return

    Object.assign(user, update)
  }
}

class FakeUserRepository {
  constructor(private readonly manager: FakeEntityManager) {}

  async findOne(options: { where?: { id?: string; email?: string } }): Promise<TestUser | null> {
    return this.manager.findOne(undefined, options)
  }
}

class FakeDataSource {
  readonly manager: FakeEntityManager

  constructor(users: TestUser[]) {
    this.manager = new FakeEntityManager(new Map(users.map((user) => [user.id, user])))
  }

  async transaction<T>(run: (manager: FakeEntityManager) => Promise<T>): Promise<T> {
    return run(this.manager)
  }

  getRepository(): FakeUserRepository {
    return new FakeUserRepository(this.manager)
  }
}

const createService = (userOverrides: Partial<TestUser> = {}) => {
  const user: TestUser = {
    id: 'user-1',
    email: 'customer@example.com',
    password: '$2b$10$old-password-hash',
    isVerified: false,
    refreshToken: 'refresh-token',
    expiresAt: new Date(Date.now() + 60_000),
    ...userOverrides
  }
  const dataSource = new FakeDataSource([user])
  const redis = new FakeRedisStore()
  const emailQueue = new FakeEmailQueue()
  const service = new AuthService(dataSource as unknown as DataSource, redis, emailQueue)

  return { service, user, redis, emailQueue }
}

test('verifyEmail marks user verified and consumes a valid Redis token', async () => {
  const { service, user, redis } = createService()
  const token = 'valid-email-token'
  await redis.set(
    `email_verify:${user.id}`,
    JSON.stringify({ tokenHash: sha256(token), email: user.email }),
    authTokenConfig.emailVerificationTokenTtlSeconds
  )

  const result = await service.verifyEmail(token, user.id)

  assert.equal(result.message, 'Email verified successfully')
  assert.equal(user.isVerified, true)
  assert.equal(await redis.get(`email_verify:${user.id}`), null)
})

test('verifyEmail rejects an expired Redis token', async () => {
  const { service, user, redis } = createService()
  const token = 'expired-email-token'
  await redis.set(
    `email_verify:${user.id}`,
    JSON.stringify({ tokenHash: sha256(token), email: user.email }),
    authTokenConfig.emailVerificationTokenTtlSeconds
  )
  redis.expire(`email_verify:${user.id}`)

  await assert.rejects(() => service.verifyEmail(token, user.id), /Invalid or expired verification token/)
  assert.equal(user.isVerified, false)
})

test('verifyEmail rejects a reused token after the first successful use', async () => {
  const { service, user, redis } = createService()
  const token = 'single-use-email-token'
  await redis.set(
    `email_verify:${user.id}`,
    JSON.stringify({ tokenHash: sha256(token), email: user.email }),
    authTokenConfig.emailVerificationTokenTtlSeconds
  )

  await service.verifyEmail(token, user.id)

  await assert.rejects(() => service.verifyEmail(token, user.id), /Invalid or expired verification token/)
})

test('verifyEmail rejects a wrong token without consuming the stored token', async () => {
  const { service, user, redis } = createService()
  await redis.set(
    `email_verify:${user.id}`,
    JSON.stringify({ tokenHash: sha256('right-token'), email: user.email }),
    authTokenConfig.emailVerificationTokenTtlSeconds
  )

  await assert.rejects(() => service.verifyEmail('wrong-token', user.id), /Invalid verification token/)

  assert.notEqual(await redis.get(`email_verify:${user.id}`), null)
  assert.equal(user.isVerified, false)
})

test('forgotPassword stores only a hashed reset token in Redis and queues the raw token with userId', async () => {
  const { service, user, redis, emailQueue } = createService()

  await service.forgotPassword(user.email)

  const entry = redis.entries.get(`password_reset:${user.id}`)
  assert.ok(entry)
  assert.equal(entry.ttlSeconds, authTokenConfig.passwordResetTokenTtlSeconds)
  assert.equal(emailQueue.jobs.length, 1)
  assert.equal(emailQueue.jobs[0].name, 'forgot-password')
  assert.equal(emailQueue.jobs[0].data.userId, user.id)
  assert.equal(JSON.parse(entry.value).tokenHash, sha256(emailQueue.jobs[0].data.token))
  assert.equal(entry.value.includes(emailQueue.jobs[0].data.token), false)
})

test('forgotPassword enqueues a fresh email job for repeated requests', async () => {
  const { service, user, redis, emailQueue } = createService()

  await service.forgotPassword(user.email)
  await service.forgotPassword(user.email)

  assert.equal(emailQueue.jobs.length, 2)
  assert.equal(emailQueue.jobs[0].name, 'forgot-password')
  assert.equal(emailQueue.jobs[1].name, 'forgot-password')
  assert.notEqual(emailQueue.jobs[0].options.jobId, emailQueue.jobs[1].options.jobId)
  assert.notEqual(emailQueue.jobs[0].data.token, emailQueue.jobs[1].data.token)

  const entry = redis.entries.get(`password_reset:${user.id}`)
  assert.ok(entry)
  assert.equal(JSON.parse(entry.value).tokenHash, sha256(emailQueue.jobs[1].data.token))
})

test('resetPassword updates password, clears refresh token, and consumes a valid Redis token', async () => {
  const { service, user, redis } = createService({ password: await bcrypt.hash('old-password', 4) })
  const token = 'valid-reset-token'
  await redis.set(
    `password_reset:${user.id}`,
    JSON.stringify({ tokenHash: sha256(token) }),
    authTokenConfig.passwordResetTokenTtlSeconds
  )

  const result = await service.resetPassword(token, user.id, 'new-password', 'new-password')

  assert.equal(result.message, 'Password reset successful')
  assert.equal(await bcrypt.compare('new-password', user.password), true)
  assert.equal(user.refreshToken, null)
  assert.equal(user.expiresAt, null)
  assert.equal(await redis.get(`password_reset:${user.id}`), null)
})

test('resetPassword rejects expired, reused, and wrong Redis tokens', async () => {
  const { service, user, redis } = createService({ password: await bcrypt.hash('old-password', 4) })
  const token = 'valid-reset-token'
  const key = `password_reset:${user.id}`

  await redis.set(key, JSON.stringify({ tokenHash: sha256(token) }), authTokenConfig.passwordResetTokenTtlSeconds)
  redis.expire(key)
  await assert.rejects(() => service.resetPassword(token, user.id, 'new-password', 'new-password'), /expired/)

  await redis.set(key, JSON.stringify({ tokenHash: sha256(token) }), authTokenConfig.passwordResetTokenTtlSeconds)
  await service.resetPassword(token, user.id, 'new-password', 'new-password')
  await assert.rejects(() => service.resetPassword(token, user.id, 'new-password-2', 'new-password-2'), /expired/)

  await redis.set(key, JSON.stringify({ tokenHash: sha256('right-token') }), authTokenConfig.passwordResetTokenTtlSeconds)
  await assert.rejects(() => service.resetPassword('wrong-token', user.id, 'new-password-3', 'new-password-3'), /Invalid reset token/)
  assert.notEqual(await redis.get(key), null)
})
