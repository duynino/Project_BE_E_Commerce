import { Queue, Worker } from 'bullmq';
import { EmailController } from '~/modules/email/email.controller';
import { EmailService } from '~/modules/email/email.service';

const emailService = new EmailService();
const emailController = new EmailController(emailService);

// Dùng chung 1 object connection config cho cả Queue và Worker
const redisConnection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Bắt buộc cho BullMQ
};

const emailQueue = new Queue('email-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000,
    },
    removeOnComplete: { age: 10 * 60 },
    removeOnFail: { age: 10 * 60 },
  },
});

const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    switch (job.name) {
      case 'verify-email':
        await emailController.sendVerificationEmail(job.data);
        break;
      case 'forgot-password':
        await emailController.sendVerificationEmail(job.data);
        break;
      default:
        console.log(`[Queue] No handler for job name: ${job.name}`);
    }
  },
  { connection: redisConnection },
);

emailWorker.on('failed', (job, err) => {
  console.error(`[Queue] Job ${job?.id} (${job?.name}) failed:`, err.message);
});

export {
  emailQueue,
  emailWorker,
  redisConnection,
};
