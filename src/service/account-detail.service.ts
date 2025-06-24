import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AccountDetailDto } from '../dtos/account-detail.dto';
import { encrypt } from '../utils/crypto.util';

@Injectable()
export class AccountDetailService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: AccountDetailDto) {
    // Encrypt all string fields in details
    const encryptedDetails: Record<string, any> = {};
    for (const [key, value] of Object.entries(dto.details)) {
      encryptedDetails[key] = typeof value === 'string' ? encrypt(value) : value;
    }
    const collection = this.databaseService.getCollection('account_detail');
    const result = await collection.insertOne({ ...dto, details: encryptedDetails });
    return { insertedId: result.insertedId };
  }
} 