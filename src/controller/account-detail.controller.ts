import { Body, Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { AccountDetailDto } from '../dtos/account-detail.dto';
import { AccountDetailService } from '../service/account-detail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('account-details')
export class AccountDetailController {
  constructor(private readonly accountDetailService: AccountDetailService) {}

  @Post()
  async create(@Body() dto: AccountDetailDto, @Request() req) {
    console.log('req.user:', req.user); // Debug: print user info from JWT
    const userId = req.user.userId; // Extract userId from JWT payload
    return this.accountDetailService.create(dto, userId);
  }

  @Get()
  async findAllForUser(@Request() req) {
    const userId = req.user.userId; // Extract userId from JWT payload
    return this.accountDetailService.findAllByUserId(userId);
  }
} 