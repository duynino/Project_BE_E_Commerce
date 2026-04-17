import Redis from 'ioredis';

export const ioredisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: times => Math.min(times * 100, 3000),
});

ioredisClient.on('connect', () => {
  console.log('Connected to Redis successfully');
});

ioredisClient.on('error', (error) => {
  console.error('Error connecting to Redis:', error);
});