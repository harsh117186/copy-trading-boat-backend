import { Body, Controller, Post, HttpCode, HttpStatus, Res, Get, UseGuards, Request } from '@nestjs/common';
import { SignupDto } from '../dtos/signup.dto';
import { AuthService } from '../service/auth.service';
import { SigninDto } from 'src/dtos/signin.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileDto } from '../dtos/profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signupDto: SignupDto) {
    return this.authService.signUp(signupDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signinDto: SigninDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, userId } = await this.authService.signIn(signinDto);
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    return { message: 'Login successful',userId};
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req): Promise<ProfileDto> {
    const userId = req.user.userId;
    return this.authService.getProfile(userId);
  }
} 