import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from '../dtos/signup.dto';
import { DatabaseService } from './database.service';
import { JwtService } from '@nestjs/jwt';
import { SigninDto } from 'src/dtos/signin.dto';
import { ProfileDto } from '../dtos/profile.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';
import { maskEmail } from '../utils/crypto.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    ) {}

  async signUp(signupDto: SignupDto) {
    const { firstName, lastName, email, username, password } = signupDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const users = this.databaseService.getCollection('users');
    
    try {
      // Check if user already exists
      const existingUser = await users.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        throw new ConflictException('Email or username already exists');
      }

      // Insert new user
      const result = await users.insertOne({
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        createdAt: new Date()
      });

      console.log("🟢 Inserted User ID:", result.insertedId);

      // Return user data without password
      const userData = {
        _id: result.insertedId,
        firstName,
        lastName,
        email,
        username,
        createdAt: new Date()
      };

      return userData;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error("❌ User creation failed:", error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async signIn(signinDto: SigninDto): Promise<{ accessToken: string; userId: string }> {
    const { username, password } = signinDto;
    const users = this.databaseService.getCollection('users');

    const user = await users.findOne({ username });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Ensure user._id is a string for JWT and response
    const userId = user._id.toString();
    const payload = { sub: userId, username: user.username };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, userId };
  }

  async getProfile(userId: string): Promise<ProfileDto> {
    const users = this.databaseService.getCollection('users');
    
    // Convert string userId to ObjectId for MongoDB query
    const { ObjectId } = require('mongodb');
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return user data without password
    return {
     
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<ProfileDto> {
    const users = this.databaseService.getCollection('users');
    const { ObjectId } = require('mongodb');

    // Check if user exists
    const existingUser = await users.findOne({ _id: new ObjectId(userId) });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check for unique constraints if email or username is being updated
    if (updateProfileDto.email || updateProfileDto.username) {
      const uniqueQuery: any = {};
      
      if (updateProfileDto.email) {
        uniqueQuery.email = updateProfileDto.email;
      }
      if (updateProfileDto.username) {
        uniqueQuery.username = updateProfileDto.username;
      }

      // Exclude current user from uniqueness check
      uniqueQuery._id = { $ne: new ObjectId(userId) };

      const duplicateUser = await users.findOne(uniqueQuery);
      if (duplicateUser) {
        throw new ConflictException('Email or username already exists');
      }
    }

    // Prepare update object with only provided fields
    const updateData: any = {};
    if (updateProfileDto.firstName !== undefined) {
      updateData.firstName = updateProfileDto.firstName;
    }
    if (updateProfileDto.lastName !== undefined) {
      updateData.lastName = updateProfileDto.lastName;
    }
    if (updateProfileDto.email !== undefined) {
      updateData.email = updateProfileDto.email;
    }
    if (updateProfileDto.username !== undefined) {
      updateData.username = updateProfileDto.username;
    }

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Update user
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('User not found');
    }

    // Return updated user profile
    return this.getProfile(userId);
  }

  async forgotPassword(userId: string): Promise<{ message: string; email: string }> {
    const users = this.databaseService.getCollection('users');
    const { ObjectId } = require('mongodb');

    // Find user by ID
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user's email
    const userEmail = user.email;
    const userName = user.firstName;

    // Generate OTP
    const otp = this.otpService.generateOTP();
    
    // Save OTP to database
    await this.otpService.saveOTP(userEmail, otp);
    
    // Send OTP email
    const emailSent = await this.emailService.sendOTPEmail(userEmail, otp, userName);
    
    if (!emailSent) {
      throw new InternalServerErrorException('Failed to send OTP email. Please try again.');
    }

    return { 
      message: 'OTP has been sent to your email address.',
      email: maskEmail(userEmail) // Mask the email in the response
    };
  }

  async resetPassword(userId: string, resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { otp, newPassword } = resetPasswordDto;
    const users = this.databaseService.getCollection('users');
    const { ObjectId } = require('mongodb');

    // Find user by ID
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userEmail = user.email;

    // Validate OTP
    const isOTPValid = await this.otpService.validateOTP(userEmail, otp);
    if (!isOTPValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('User not found');
    }

    // Mark OTP as used
    await this.otpService.markOTPAsUsed(userEmail, otp);

    return { message: 'Password has been reset successfully' };
  }
} 