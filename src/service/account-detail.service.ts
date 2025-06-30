import { Injectable, ConflictException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AccountDetailDto } from '../dtos/account-detail.dto';
import { encrypt, decrypt } from '../utils/crypto.util';
import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

@Injectable()
export class AccountDetailService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: AccountDetailDto, userId: string) {
    const collection = this.databaseService.getCollection('account_detail');
    const userAccounts = await collection.find({ user_id: userId }).toArray();

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

    // 1. Unique nickname check (should exit immediately if duplicate)
    for (const acc of userAccounts) {
      if (acc.details && acc.details.nickname) {
        try {
          const decryptedNickname = decrypt(acc.details.nickname);
          const dbNick = decryptedNickname.trim().toLowerCase();
          const userNick = dto.details.nickname.trim().toLowerCase();
          

          if (dbNick == userNick) {
            
            throw new BadRequestException('Nickname must be unique per user.')

            return; // For debugging: see if this line is ever reached
          }
      } catch (e) {
        throw new BadRequestException('Nickname decryption failed. Cannot verify uniqueness.');}
      }
    }

    // 2. Check for repeated account details (decrypt and compare all fields for same broker)
    for (const acc of userAccounts) {
      if (acc.broker === dto.broker && acc.details) {
        for (const [key, value] of Object.entries(dto.details)) {
          if (typeof value === 'string' && acc.details[key]) {
            try {
              const decrypted = decrypt(acc.details[key]);
              if (decrypted === value) {
                throw new ConflictException(`Field '${key}' already exists for this user.`);
              }
            } catch (e) { 
              throw new BadRequestException(`Field '${key}' already exists for this user.`);
             }
          } else if (acc.details[key] === value) {
            throw new ConflictException(`Field '${key}' already exists for this user.`);
          }
        }
      }
    }



    // Encrypt all string fields in details (for insert)
    const encryptedDetails: Record<string, any> = {};
    for (const [key, value] of Object.entries(dto.details)) {
      encryptedDetails[key] = typeof value === 'string' ? encrypt(value) : value;
    }

    // Insert with encrypted details
    const result = await collection.insertOne({ ...dto, details: encryptedDetails, user_id: userId, accountType: dto.accountType });

    // Add entry to copy-trade-details collection
    const copyTradeCollection = this.databaseService.getCollection('copy-trade-details');
    await copyTradeCollection.insertOne({
      user_id: userId,
      account_id: result.insertedId,
      connected: false,
      markets: {
        NSE: false,
        BSE: false,
        NFO: false,
        MCX: false,
      },
      multiplier: 1.0,
    });

    return { insertedId: result.insertedId };
  }

  async findAllByUserId(userId: string) {
    const collection = this.databaseService.getCollection('account_detail');
    return collection.find({ user_id: userId }).toArray();
  }

  async update(dto: AccountDetailDto, userId: string, objectId: string) {
    const collection = this.databaseService.getCollection('account_detail');

    // Prevent multiple master accounts per user
    if (dto.accountType === 'master') {
      const existingMaster = await collection.findOne({
        user_id: userId,
        accountType: 'master',
        _id: { $ne: new ObjectId(objectId) }, // Exclude the current account being edited
      });
      if (existingMaster) {
        throw new ConflictException('Only one master account is allowed per user. If you want to change another account to master, first change the existing master to child.');
      }
    }

    // Encrypt all string fields in details (for update)
    const encryptedDetails: Record<string, any> = {};
    for (const [key, value] of Object.entries(dto.details)) {
      encryptedDetails[key] = typeof value === 'string' ? encrypt(value) : value;
    }
    // Update the document by _id and user_id
    const result = await collection.updateOne(
      { _id: new ObjectId(objectId), user_id: userId },
      { $set: { ...dto, details: encryptedDetails } }
    );
    if (result.matchedCount === 0) {
      throw new BadRequestException('Account detail not found or not owned by user.');
    }
    return { modifiedCount: result.modifiedCount };
  }

  async delete(userId: string, objectId: string) {
    const collection = this.databaseService.getCollection('account_detail');
    const result = await collection.deleteOne({ _id: new ObjectId(objectId), user_id: userId });
    if (result.deletedCount === 0) {
      throw new BadRequestException('Account detail not found or not owned by user.');
    }
    return { deletedCount: result.deletedCount };
  }
} 