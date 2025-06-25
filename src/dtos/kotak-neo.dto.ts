import { IsNotEmpty, IsString } from 'class-validator';

export class KotakNeoAccountDetailDto {
  @IsNotEmpty()
  @IsString()
  consumer_key: string;

  @IsNotEmpty()
  @IsString()
  consumer_secret: string;

  @IsNotEmpty()
  @IsString()
  USERNAME: string;

  @IsNotEmpty()
  @IsString()
  PASSWORD: string;

  @IsNotEmpty()
  @IsString()
  TOTP_SECRET: string;

  @IsNotEmpty()
  @IsString()
  UCC: string;

  @IsNotEmpty()
  @IsString()
  MOBILE_NUMBER: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;
} 