import Redis from 'ioredis'
import { ioredisClient } from '~/config/redis-config'

export interface RedisStore {
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  get(key: string): Promise<string | null>
  del(key: string): Promise<void>
  deleteIfValueEquals(key: string, value: string): Promise<boolean>
}

export class RedisService implements RedisStore {
  constructor(private readonly client: Redis = ioredisClient) {}

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error('Redis TTL must be a positive integer')
    }

    await this.client.set(key, value, 'EX', ttlSeconds)
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async deleteIfValueEquals(key: string, value: string): Promise<boolean> {
    const deleted = await this.client.eval(
      `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      end
      return 0
      `,
      1,
      key,
      value
    )

    return deleted === 1
  }
}

export const redisService = new RedisService()
