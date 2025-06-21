import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { SignupDto } from '../dtos/signup.dto';
import { AuthService } from '../service/auth.service';
import { SigninDto } from 'src/dtos/signin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signupDto: SignupDto) {
    return this.authService.signUp(signupDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signinDto: SigninDto) {
    return this.authService.signIn(signinDto);
  }
} 