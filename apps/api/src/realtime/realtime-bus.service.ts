import { Injectable } from '@nestjs/common';
import { StoredMessage } from '../storage/types';

type MessageHandler = (message: StoredMessage) => void;

@Injectable()
export class RealtimeBusService {
  private readonly messageHandlers = new Set<MessageHandler>();

  publishMessageCreated(message: StoredMessage) {
    for (const handler of this.messageHandlers) {
      queueMicrotask(() => {
        try {
          handler(message);
        } catch {
          return;
        }
      });
    }
  }

  subscribeToMessages(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);

    return () => {
      this.messageHandlers.delete(handler);
    };
  }
}
