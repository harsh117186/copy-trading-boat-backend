import { IsNotEmpty, IsString } from 'class-validator';

export class DhanAccountDetailDto {
  @IsNotEmpty()
  @IsString()
  client_id: string;

  @IsNotEmpty()
  @IsString()
  access_token: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;
} 