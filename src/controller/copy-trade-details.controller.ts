import { Controller, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CopyTradeDetailsService } from '../service/copy-trade-details.service';
import { CopyTradeDetailsDto } from '../dtos/copy-trade-details.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('copy-trade-details')
export class CopyTradeDetailsController {
  constructor(private readonly copyTradeDetailsService: CopyTradeDetailsService) {}

  @UseGuards(JwtAuthGuard)
  @Put(':accountId')
  async updateCopyTradeDetails(
    @Req() req,
    @Param('accountId') accountId: string,
    @Body() updateDto: Partial<CopyTradeDetailsDto>
  ) {
    const userId = req.user.userId;
    return this.copyTradeDetailsService.updateCopyTradeDetails(userId, accountId, updateDto);
  }
} 