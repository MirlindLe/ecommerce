import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Send email - In production, integrate with services like:
   * - SendGrid
   * - AWS SES
   * - Mailgun
   * - Nodemailer with SMTP
   *
   * For now, this is a mock implementation that logs emails
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Mock email sending - log to console in development
      this.logger.log('========== EMAIL SENT ==========');
      this.logger.log(`To: ${options.to}`);
      this.logger.log(`Subject: ${options.subject}`);
      this.logger.log(`Body: ${options.html}`);
      this.logger.log('================================');

      // In production, implement actual email sending here
      // Example with nodemailer:
      // const transporter = nodemailer.createTransport({
      //   host: this.configService.get('SMTP_HOST'),
      //   port: this.configService.get('SMTP_PORT'),
      //   auth: {
      //     user: this.configService.get('SMTP_USER'),
      //     pass: this.configService.get('SMTP_PASS'),
      //   },
      // });
      // await transporter.sendMail(options);

      return true;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - E-Commerce Store',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to E-Commerce Store!</h1>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email
          </a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - E-Commerce Store',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendOrderConfirmationEmail(
    email: string,
    firstName: string,
    orderNumber: string,
    total: string,
  ): Promise<boolean> {
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const orderUrl = `${frontendUrl}/orders/${orderNumber}`;

    return this.sendEmail({
      to: email,
      subject: `Order Confirmation #${orderNumber} - E-Commerce Store`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Order Confirmed!</h1>
          <p>Hi ${firstName},</p>
          <p>Thank you for your order. Your order number is <strong>#${orderNumber}</strong>.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Order Total:</strong> $${total}</p>
          </div>
          <a href="${orderUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            View Order Details
          </a>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Thank you for shopping with us!</p>
        </div>
      `,
    });
  }

  async sendOrderStatusUpdateEmail(
    email: string,
    orderNumber: string,
    status: string,
  ): Promise<boolean> {
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const orderUrl = `${frontendUrl}/orders/${orderNumber}`;

    const statusMessages: Record<string, string> = {
      PROCESSING: 'Your order is being processed.',
      SHIPPED: 'Great news! Your order has been shipped.',
      DELIVERED: 'Your order has been delivered.',
      CANCELLED: 'Your order has been cancelled.',
      REFUNDED: 'Your order has been refunded.',
    };

    return this.sendEmail({
      to: email,
      subject: `Order #${orderNumber} - Status Update`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Order Status Update</h1>
          <p>${statusMessages[status] || `Your order status has been updated to: ${status}`}</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Order Number:</strong> #${orderNumber}</p>
            <p style="margin: 10px 0 0;"><strong>New Status:</strong> ${status}</p>
          </div>
          <a href="${orderUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            View Order Details
          </a>
        </div>
      `,
    });
  }
}
