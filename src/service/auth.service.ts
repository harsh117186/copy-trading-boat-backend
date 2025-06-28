import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from '../dtos/signup.dto';
import { DatabaseService } from './database.service';
import { JwtService } from '@nestjs/jwt';
import { SigninDto } from 'src/dtos/signin.dto';
import { ProfileDto } from '../dtos/profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
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
      username: user.username,
    };
  }
} 