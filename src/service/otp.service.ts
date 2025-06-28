import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class OtpService {
  constructor(private readonly databaseService: DatabaseService) {}

  generateOTP(): string {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async saveOTP(email: string, otp: string): Promise<void> {
    const otpCollection = this.databaseService.getCollection('otps');
    
    // Remove any existing OTP for this email
    await otpCollection.deleteMany({ email });
    
    // Save new OTP with expiration (10 minutes from now)
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await otpCollection.insertOne({
      email,
      otp,
      createdAt: new Date(),
      expiresAt: expirationTime,
      isUsed: false
    });
  }

  async validateOTP(email: string, otp: string): Promise<boolean> {
    const otpCollection = this.databaseService.getCollection('otps');
    
    const otpRecord = await otpCollection.findOne({
      email,
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    return !!otpRecord;
  }

  async markOTPAsUsed(email: string, otp: string): Promise<void> {
    const otpCollection = this.databaseService.getCollection('otps');
    
    await otpCollection.updateOne(
      { email, otp },
      { $set: { isUsed: true, usedAt: new Date() } }
    );
  }

  async cleanupExpiredOTPs(): Promise<void> {
    const otpCollection = this.databaseService.getCollection('otps');
    
    // Remove OTPs that have expired
    await otpCollection.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }
} 