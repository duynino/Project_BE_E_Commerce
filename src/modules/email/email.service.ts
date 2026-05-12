import nodemailer from 'nodemailer'
import handlebars from 'handlebars'
import path from 'path'
import fs from 'fs'

type EmailTemplateType = 'verification' | 'passwordReset'

export interface EmailTransportConfig {
  host: string
  port: number
  secure: boolean
  requireTLS: boolean
  auth: {
    user: string | undefined
    pass: string | undefined
  }
}

export const createEmailTransportConfig = (): EmailTransportConfig => {
  const port = Number(process.env.EMAIL_PORT) || 587

  return {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  }
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private readonly brandName = 'Luxora Perfume & Cosmetics'

  constructor() {
    this.transporter = nodemailer.createTransport(createEmailTransportConfig())
  }

  private getClientUrl() {
    const clientUrl = process.env.CLIENT_URL?.replace(/\/+$/, '')
    if (!clientUrl) {
      throw new Error('CLIENT_URL is not configured')
    }

    return clientUrl
  }

  private getTemplatePath(type: EmailTemplateType) {
    switch (type) {
      case 'verification':
        return path.join(
          __dirname,
          '../../email-templates/verificationEmailTemplate.html'
        )
      case 'passwordReset':
        return path.join(
          __dirname,
          '../../email-templates/forgotPasswordTemplate.html'
        )
    }
  }

  private renderEmailTemplate(url: string, type: EmailTemplateType) {
    const templatePath = this.getTemplatePath(type)
    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    const htmlTemplate = handlebars.compile(templateContent)

    return htmlTemplate({
      verificationLink: url,
      url,
      year: new Date().getFullYear(),
      brandName: this.brandName
    })
  }

  private async sendTemplatedEmail(
    email: string,
    subject: string,
    url: string,
    type: EmailTemplateType
  ): Promise<void> {
    const html = this.renderEmailTemplate(url, type)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html
    }

    await this.transporter.sendMail(mailOptions)
  }

  private buildClientUrl(path: string, token: string, userId?: string) {
    const params = new URLSearchParams({ token })
    if (userId) params.set('userId', userId)

    return `${this.getClientUrl()}${path}?${params.toString()}`
  }

  async sendEmail(email: string, token: string, userId?: string): Promise<void> {
    try {
      const url = this.buildClientUrl('/verify-email', token, userId)

      await this.sendTemplatedEmail(
        email,
        'Email Verification',
        url,
        'verification'
      )
    } catch (error) {
      throw new Error(`Failed to send email: ${(error as Error).message}`)
    }
  }

  async sendPasswordResetEmail(email: string, token: string, userId?: string): Promise<void> {
    try {
      const url = this.buildClientUrl('/reset-password', token, userId)

      await this.sendTemplatedEmail(
        email,
        'Password Reset',
        url,
        'passwordReset'
      )
    } catch (error) {
      throw new Error(
        `Failed to send password reset email: ${(error as Error).message}`
      )
    }
  }
}
