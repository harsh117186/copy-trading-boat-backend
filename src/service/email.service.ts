import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create Gmail transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Must be an App Password, not regular password
      },
    });
  }

  async sendOTPEmail(email: string, otp: string, userName: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Password Reset OTP - Copy Trading Platform',
        html: this.generateOTPEmailTemplate(otp, userName),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Gmail OTP Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send Gmail OTP email:', error);
      return false;
    }
  }

  private generateOTPEmailTemplate(otp: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .otp-box {
            background: #fff;
            border: 2px dashed #667eea;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 5px;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
          <p>Copy Trading Platform</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userName}!</h2>
          
          <p>We received a request to reset your password. Use the OTP below to complete the password reset process:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <p><strong>One-Time Password</strong></p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this OTP with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The Copy Trading Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; 2024 Copy Trading Platform. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  async verifyGmailConfig(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Gmail configuration is valid');
      return true;
    } catch (error) {
      console.error('❌ Gmail configuration error:', error);
      return false;
    }
  }
} 