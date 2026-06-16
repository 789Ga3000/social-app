import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthUser, JwtAccessPayload } from '../auth/types';
import { SendMessageDto } from '../messages/dto/send-message.dto';
import { MessagesService } from '../messages/messages.service';
import { RealtimeBusService } from './realtime-bus.service';

type AuthedSocket = Socket & {
  data: {
    user?: AuthUser;
  };
};

type ConversationPayload = {
  conversationId?: unknown;
};

type SendMessagePayload = ConversationPayload & {
  body?: unknown;
  clientMessageId?: unknown;
  replyToId?: unknown;
};

type ListMessagesPayload = ConversationPayload & {
  limit?: unknown;
};

@WebSocketGateway({
  namespace: 'realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  private server!: Server;

  private unsubscribeFromMessages?: () => void;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly messages: MessagesService,
    private readonly realtimeBus: RealtimeBusService,
  ) {}

  afterInit(server: Server) {
    this.server = server;
    this.unsubscribeFromMessages = this.realtimeBus.subscribeToMessages(
      (message) => {
        this.server
          .to(this.conversationRoom(message.conversationId))
          .emit('message:new', { message });
      },
    );
  }

  async handleConnection(client: AuthedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new WsException('Missing access token');
      }

      const payload = await this.jwt.verifyAsync<JwtAccessPayload>(token, {
        secret: this.requiredConfig('JWT_ACCESS_SECRET'),
      });

      client.data.user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
      };
      await client.join(this.userRoom(payload.sub));
    } catch {
      client.emit('auth:error', { message: 'Invalid access token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket) {
    const user = client.data.user;
    if (user) {
      client.leave(this.userRoom(user.id));
    }
  }

  onModuleDestroy() {
    this.unsubscribeFromMessages?.();
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: ConversationPayload,
  ) {
    const user = this.requireUser(client);
    const conversationId = this.readConversationId(payload);

    const conversation = await this.messages.joinConversation(
      user.id,
      conversationId,
    );
    await client.join(this.conversationRoom(conversationId));

    return { conversation };
  }

  @SubscribeMessage('message:list')
  async listMessages(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: ListMessagesPayload,
  ) {
    const user = this.requireUser(client);
    const conversationId = this.readConversationId(payload);
    const messages = await this.messages.listMessages(
      user.id,
      conversationId,
      this.readLimit(payload?.limit),
    );

    return { messages };
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const user = this.requireUser(client);
    const conversationId = this.readConversationId(payload);
    const dto = this.readSendMessageDto(payload);

    await this.messages.joinConversation(user.id, conversationId);
    await client.join(this.conversationRoom(conversationId));
    const message = await this.messages.sendMessage(user.id, conversationId, dto);

    return { message };
  }

  private requireUser(client: AuthedSocket): AuthUser {
    if (!client.data.user) {
      throw new WsException('Unauthenticated');
    }

    return client.data.user;
  }

  private readConversationId(payload?: ConversationPayload): string {
    const value = payload?.conversationId;
    if (
      typeof value !== 'string' ||
      !/^[a-zA-Z0-9._:-]{1,120}$/.test(value)
    ) {
      throw new WsException('conversationId is invalid');
    }

    return value;
  }

  private readSendMessageDto(payload: SendMessagePayload): SendMessageDto {
    if (typeof payload.body !== 'string') {
      throw new WsException('body is required');
    }

    const body = payload.body.trim();
    if (body.length < 1 || body.length > 4000) {
      throw new WsException('body must be between 1 and 4000 characters');
    }

    const dto = new SendMessageDto();
    dto.body = body;

    if (payload.clientMessageId !== undefined) {
      if (
        typeof payload.clientMessageId !== 'string' ||
        payload.clientMessageId.length < 1 ||
        payload.clientMessageId.length > 120
      ) {
        throw new WsException('clientMessageId is invalid');
      }
      dto.clientMessageId = payload.clientMessageId;
    }

    if (payload.replyToId !== undefined) {
      if (
        typeof payload.replyToId !== 'string' ||
        !/^[a-f0-9-]{36}$/i.test(payload.replyToId)
      ) {
        throw new WsException('replyToId is invalid');
      }
      dto.replyToId = payload.replyToId;
    }

    return dto;
  }

  private readLimit(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(1, Math.min(Math.trunc(value), 100));
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return Math.max(1, Math.min(Math.trunc(parsed), 100));
      }
    }

    return 50;
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const authorization = client.handshake.headers.authorization;
    if (
      typeof authorization === 'string' &&
      authorization.toLowerCase().startsWith('bearer ')
    ) {
      return authorization.slice('bearer '.length);
    }

    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const rawCookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('access_token='));

    if (!rawCookie) {
      return null;
    }

    return decodeURIComponent(rawCookie.slice('access_token='.length));
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private conversationRoom(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  private requiredConfig(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new WsException(`${key} is not configured`);
    }

    return value;
  }
}
