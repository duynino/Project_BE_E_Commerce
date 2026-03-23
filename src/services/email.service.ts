import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;
  
    constructor() {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }

  async sendEmail(email: string, token: string): Promise<void> {
    // Implement the actual email sending logic here, e.g., using nodemailer or any email service provider
    console.log(`Sending email to ${email} with token ${token}`);
  }
}