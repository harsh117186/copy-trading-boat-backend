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
      // Try to get token from handshake auth or headers
      let token = client.handshake.auth?.token || client.handshake.headers['authorization']?.split(' ')[1];
      // If not found, try to get from cookies
      if (!token && client.handshake.headers.cookie) {
        const cookies = cookie.parse(client.handshake.headers.cookie);
        token = cookies['access_token'];
      }
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
      // Only extract userId from JWT and set it directly
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      const userId = typeof payload.sub === 'string' ? payload.sub : undefined;
      (client as any).userId = userId;
      // Optionally, emit the userId to the client after connection
      // client.emit('userId', userId);
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