import { EmailService } from "~/services/email.service";

export class EmailController {
  private emailService: EmailService;
  constructor(emailService: EmailService) {
    this.emailService = emailService;
  }

  async sendVerificationEmail(jobData : { email: string; token: string }) {
    try {
      const { email, token } = jobData;
      // Logic to send verification email using this.emailService
      await this.emailService.sendEmail(email, token);
      console.log(`Verification email sent to ${email}`); 
    } catch (error) {
      throw new Error(`Failed to send verification email: ${(error as Error).message}`);
    }
  }

}