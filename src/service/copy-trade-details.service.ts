import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { CopyTradeDetailsDto } from '../dtos/copy-trade-details.dto';
import { ObjectId } from 'mongodb';

@Injectable()
export class CopyTradeDetailsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async updateCopyTradeDetails(userId: string, accountId: string, updateDto: Partial<CopyTradeDetailsDto>) {
    const collection = this.databaseService.getCollection('copy-trade-details');
    const result = await collection.updateOne(
      { user_id: userId, account_id: accountId },
      { $set: updateDto }
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException('Copy trade details not found for this user and account.');
    }
    return { modifiedCount: result.modifiedCount };
  }
} 