import { IsBoolean, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CopyTradeDetailsDto {
  @IsString()
  user_id: string;

  @IsString()
  account_id: string;

  @IsBoolean()
  @IsOptional()
  connected: boolean = false;

  @IsObject()
  markets: {
    NSE: boolean;
    BSE: boolean;
    NFO: boolean;
    MCX: boolean;
  } = {
    NSE: false,
    BSE: false,
    NFO: false,
    MCX: false,
  };

  @IsNumber()
  @IsOptional()
  multiplier: number = 1.0;
} 