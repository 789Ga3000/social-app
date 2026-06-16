import { Injectable, NotFoundException } from '@nestjs/common';
import { RealtimeBusService } from '../realtime/realtime-bus.service';
import { CustomStoreService } from '../storage/custom-store.service';
import { MissingRecordError, StoredMessage } from '../storage/types';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly store: CustomStoreService,
    private readonly realtimeBus: RealtimeBusService,
  ) {}

  joinConversation(userId: string, conversationId: string) {
    return this.store.joinConversation(conversationId, userId);
  }

  async listMessages(
    userId: string,
    conversationId: string,
    limit = 50,
  ): Promise<StoredMessage[]> {
    try {
      return await this.store.listMessages(conversationId, userId, limit);
    } catch (error) {
      if (error instanceof MissingRecordError) {
        throw new NotFoundException('Conversation not found');
      }
      throw error;
    }
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    dto: SendMessageDto,
  ): Promise<StoredMessage> {
    try {
      await this.store.joinConversation(conversationId, userId);
      const message = await this.store.createMessage({
        conversationId,
        senderId: userId,
        body: dto.body,
        clientMessageId: dto.clientMessageId,
        replyToId: dto.replyToId,
      });

      this.realtimeBus.publishMessageCreated(message);
      return message;
    } catch (error) {
      if (error instanceof MissingRecordError) {
        throw new NotFoundException('Conversation not found');
      }
      throw error;
    }
  }
}
