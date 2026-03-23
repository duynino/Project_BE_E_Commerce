import { createClient } from 'redis';

export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    reconnectStrategy: retries => Math.min(retries * 100, 3000),
  },
  password: process.env.REDIS_PASSWORD,
});

