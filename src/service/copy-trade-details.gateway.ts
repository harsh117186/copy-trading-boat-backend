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

@WebSocketGateway({ namespace: '/copy-trade-details', cors: true })
@Injectable()
export class CopyTradeDetailsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly databaseService: DatabaseService) {}

  async handleConnection(client: Socket) {
    try {
      // Try to get token from handshake auth or headers
      const token = client.handshake.auth?.token || client.handshake.headers['authorization']?.split(' ')[1];
      if (!token) {
        client.emit('error', 'Missing authentication token');
        client.disconnect();
        return;
      }
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        client.emit('error', 'Server misconfiguration: JWT_SECRET not set');
        client.disconnect();
        return;
      }
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      // Attach userId to socket for later use
      (client as any).userId = typeof payload.sub === 'string' ? payload.sub : undefined;
    } catch (err) {
      client.emit('error', 'Invalid or expired authentication token');
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