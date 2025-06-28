import { IsString, IsDate } from 'class-validator';

export class ProfileDto {

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  email: string;

  @IsString()
  username: string;


} 