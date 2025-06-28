import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
} 