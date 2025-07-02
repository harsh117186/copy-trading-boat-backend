import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import * as jwt from 'jsonwebtoken';
import * as cookie from 'cookie';


@WebSocketGateway({
  namespace: '/copy-trade-details',
  cors: {
    origin: ['http://localhost:5173', 'https://copytradingbot-825130f9bd91.herokuapp.com'], // add all allowed origins
    credentials: true,
  },
})
@Injectable()
export class CopyTradeDetailsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly databaseService: DatabaseService) {}

  async handleConnection(client: Socket) {
    try {
      // Get userId from handshake auth
      const userId = client.handshake.auth?.userId;
      if (!userId) {
        client.emit('error', 'Missing userId');
        client.disconnect();
        return;
      }
      (client as any).userId = userId;
    } catch (err) {
      client.emit('error', 'Connection error');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    // Handle disconnect logic if needed
  }

  @SubscribeMessage('getAll')
  async handleGetAll(@ConnectedSocket() client: Socket) {
    const userId = (client as any).userId;
    if (!userId) {
      client.emit('error', 'Unauthorized');
      return;
    }
    const collection = this.databaseService.getCollection('copy-trade-details');
    const userDetails = await collection.find({ user_id: userId }).toArray();
    client.emit('copyTradeDetails', userDetails);
  }
} 