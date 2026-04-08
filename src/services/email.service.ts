import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(email: string, token: string): Promise<void> {
    try {
      // Implement the actual email sending logic here, e.g., using nodemailer or any email service provider
      const url = `${process.env.SERVER_URL}/api/auth/verify-email?token=${token}`;
      const templatePath = path.join(__dirname, '../email-templates/verificationEmailTemplate.html');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const htmlTemplate = handlebars.compile(templateContent);

      const html = htmlTemplate({ verificationLink: url });
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification',
        html,
      };
      
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }

  }
}