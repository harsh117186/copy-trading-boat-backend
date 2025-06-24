import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AccountDetailDto } from '../dtos/account-detail.dto';
import { AccountDetailService } from '../service/account-detail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('account-details')
export class AccountDetailController {
  constructor(private readonly accountDetailService: AccountDetailService) {}

  @Post()
  async create(@Body() dto: AccountDetailDto) {
    return this.accountDetailService.create(dto);
  }
} 