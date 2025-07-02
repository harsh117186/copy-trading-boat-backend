import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { encrypt } from '../utils/crypto.util';


@WebSocketGateway({
  namespace: '/copy-trade-details',
  cors: {
    origin: ['http://localhost:5173', 'https://copytradingbot-825130f9bd91.herokuapp.com'], // add all allowed origins
    credentials: true,
  },
})
@Injectable()
export class CopyTradeDetailsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnApplicationBootstrap {
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
    // Encrypt the userDetails before sending
    const encryptedDetails = encrypt(JSON.stringify(userDetails));
    client.emit('copyTradeDetails', encryptedDetails);
  }

  async onApplicationBootstrap() {
    // Now the database is guaranteed to be initialized
    const collection = this.databaseService.getCollection('copy-trade-details');
    const changeStream = collection.watch();
    changeStream.on('change', (change) => {
      let userId = undefined;
      if ('fullDocument' in change && change.fullDocument && change.fullDocument.user_id) {
        userId = change.fullDocument.user_id;
      } else if ('documentKey' in change && change.documentKey && change.documentKey.user_id) {
        userId = change.documentKey.user_id;
      }
      // Encrypt the change object before sending
      const encryptedChange = encrypt(JSON.stringify(change));
      if (userId) {
        for (const [id, socket] of this.server.sockets.sockets) {
          if ((socket as any).userId === userId) {
            socket.emit('copyTradeDetailsUpdated', encryptedChange);
          }
        }
      } else {
        // Fallback: broadcast to all if user_id is not found
        this.server.emit('copyTradeDetailsUpdated', encryptedChange);
      }
    });
  }
} 