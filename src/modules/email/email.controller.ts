import { EmailService } from "./email.service";

export class EmailController {
  private emailService: EmailService;
  constructor(emailService: EmailService) {
    this.emailService = emailService;
  }

  async sendVerificationEmail(jobData: { email: string; token: string; userId?: string }) {
    try {
      const { email, token, userId } = jobData;
      await this.emailService.sendEmail(email, token, userId);
    } catch (error) {
      throw new Error(`Failed to send verification email: ${(error as Error).message}`);
    }
  }

  async sendPasswordResetEmail(jobData: { email: string; token: string; userId?: string }) {
    try {
      const { email, token, userId } = jobData;
      await this.emailService.sendPasswordResetEmail(email, token, userId);
    } catch (error) {
      throw new Error(`Failed to send password reset email: ${(error as Error).message}`);
    }
  }

}
