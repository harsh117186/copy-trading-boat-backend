import { Type } from 'class-transformer';
import { ValidateNested, IsIn } from 'class-validator';
import { DhanAccountDetailDto } from './dhan.dto';
import { AngelAccountDetailDto } from './angel.dto';
import { KotakNeoAccountDetailDto } from './kotak-neo.dto';

export class AccountDetailDto {
  @IsIn(['dhan', 'angel', 'kotak_neo'])
  broker: string;

  @IsIn(['master', 'child'])
  accountType: string;

  @ValidateNested()
  @Type((options) => {
    switch (options?.object?.broker) {
      case 'dhan':
        return DhanAccountDetailDto;
      case 'angel':
        return AngelAccountDetailDto;
      case 'kotak_neo':
        return KotakNeoAccountDetailDto;
      default:
        return DhanAccountDetailDto;
    }
  })
  details: DhanAccountDetailDto | AngelAccountDetailDto | KotakNeoAccountDetailDto;
} 