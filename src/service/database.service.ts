import { Injectable, OnModuleInit } from '@nestjs/common';
import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class DatabaseService implements OnModuleInit {
  private client: MongoClient;
  private db: Db;

  async onModuleInit() {
    const uri = process.env.DB_LOGIN_URI;

    if (!uri) {
      console.error("❌ Environment variable DB_LOGIN_URI is not set.");
      process.exit(1);
    }

    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    try {
      await this.client.connect();
      console.log("✅ Connected to MongoDB");
      this.db = this.client.db("copy-trading-bot-db");
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  getCollection(collectionName: string): Collection {
    return this.db.collection(collectionName);
  }

  async closeConnection() {
    if (this.client) {
      await this.client.close();
      console.log("🔒 MongoDB connection closed.");
    }
  }
} 