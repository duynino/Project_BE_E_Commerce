import { Queue, Worker } from 'bullmq';
import { EmailController } from '~/controllers/email.controller';
import { EmailService } from '~/services/email.service';

const emailService = new EmailService();
const emailController = new EmailController(emailService);

const connection = {
  host: process.env.REDIS_HOST ,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
}

const emailQueue =  new Queue('email-queue', {
    connection : {
      ...connection
    }
  });

const emailWorker = new Worker('email-queue', async job => {
  switch (job.name) {
    case 'verify-email':
      await emailController.sendVerificationEmail(job.data);
      break;
    default:
      console.log(`No handler for job name: ${job.name}`);
  }
}, {
  connection: {
    ...connection
  }});

export { 
  emailQueue,
  emailWorker
};   