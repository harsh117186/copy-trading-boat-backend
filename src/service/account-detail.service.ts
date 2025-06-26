import { Injectable, ConflictException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AccountDetailDto } from '../dtos/account-detail.dto';
import { encrypt, decrypt } from '../utils/crypto.util';

@Injectable()
export class AccountDetailService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: AccountDetailDto, userId: string) {
    const collection = this.databaseService.getCollection('account_detail');

    // Encrypt all string fields in details (for insert)
    const encryptedDetails: Record<string, any> = {};
    for (const [key, value] of Object.entries(dto.details)) {
      encryptedDetails[key] = typeof value === 'string' ? encrypt(value) : value;
    }

    // Fetch all accounts for this user
    const userAccounts = await collection.find({ user_id: userId }).toArray();

    // 1. Check for unique nickname per user (decrypt and compare)
    for (const acc of userAccounts) {
      if (acc.details && acc.details.nickname) {
        try {
          const decryptedNickname = decrypt(acc.details.nickname);
          if (decryptedNickname === dto.details.nickname) {
            throw new ConflictException('Nickname must be unique per user.');
          }
        } catch (e) { /* ignore decryption errors */ }
      }
    }

    // 2. Check for repeated account details (decrypt and compare all fields for same broker)
    for (const acc of userAccounts) {
      if (acc.broker === dto.broker && acc.details) {
        let allMatch = true;
        for (const [key, value] of Object.entries(dto.details)) {
          if (typeof value === 'string' && acc.details[key]) {
            try {
              const decrypted = decrypt(acc.details[key]);
              if (decrypted !== value) {
                allMatch = false;
                break;
              }
            } catch (e) { allMatch = false; break; }
          } else if (acc.details[key] !== value) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          throw new ConflictException('Account details are already added for this user.');
        }
      }
    }

    // 3. Only one master account per user per broker
    if (dto.accountType === 'master') {
      const existingMaster = await collection.findOne({
        user_id: userId,
        // broker: dto.broker,
        accountType: 'master',
      });
      if (existingMaster) {
        throw new ConflictException('Only one master account is allowed per user. If You Want to chnage Master Account then First Change it to child');
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