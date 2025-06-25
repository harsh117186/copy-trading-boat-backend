import { IsNotEmpty, IsString } from 'class-validator';

export class AngelAccountDetailDto {
  @IsNotEmpty()
  @IsString()
  API_KEY: string;

  @IsNotEmpty()
  @IsString()
  CLIENT_CODE: string;

  @IsNotEmpty()
  @IsString()
  MPIN: string;

  @IsNotEmpty()
  @IsString()
  TOTP_SECRET: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;
} 