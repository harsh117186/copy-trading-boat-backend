import { Injectable, ConflictException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AccountDetailDto } from '../dtos/account-detail.dto';
import { encrypt } from '../utils/crypto.util';

@Injectable()
export class AccountDetailService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: AccountDetailDto, userId: string) {
    const collection = this.databaseService.getCollection('account_detail');

    // Encrypt all string fields in details (for both checks and insert)
    const encryptedDetails: Record<string, any> = {};
    for (const [key, value] of Object.entries(dto.details)) {
      encryptedDetails[key] = typeof value === 'string' ? encrypt(value) : value;
    }

    // 1. Check for unique nickname per user (using encrypted nickname)
    const existingNickname = await collection.findOne({
      user_id: userId,
      'details.nickname': encryptedDetails.nickname,
    });
    if (existingNickname) {
      throw new ConflictException('Nickname must be unique per user.');
    }

    // 2. Check for repeated account details (all details fields match for this user and broker)
    const detailsQuery: Record<string, any> = {};
    for (const [key, value] of Object.entries(encryptedDetails)) {
      detailsQuery[`details.${key}`] = value;
    }
    const existingDetails = await collection.findOne({
      user_id: userId,
      broker: dto.broker,
      ...detailsQuery,
    });
    if (existingDetails) {
      throw new ConflictException('Account details are already added for this user.');
    }

    // 3. Only one master account per user per broker
    if (dto.accountType === 'master') {
      const existingMaster = await collection.findOne({
        user_id: userId,
        broker: dto.broker,
        accountType: 'master',
      });
      if (existingMaster) {
        throw new ConflictException('Only one master account is allowed per user for this broker.');
      }
    }

    // Insert with encrypted details
    const result = await collection.insertOne({ ...dto, details: encryptedDetails, user_id: userId, accountType: dto.accountType });
    return { insertedId: result.insertedId };
  }

  async findAllByUserId(userId: string) {
    const collection = this.databaseService.getCollection('account_detail');
    return collection.find({ user_id: userId }).toArray();
  }
} 