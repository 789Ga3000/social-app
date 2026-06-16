import { Injectable } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';

@Injectable()
export class BlocksService {
  constructor(private readonly store: CustomStoreService) {}

  async block(blockerId: string, blockedId: string) {
    return this.store.blockUser(blockerId, blockedId);
  }

  async unblock(blockerId: string, blockedId: string) {
    return this.store.unblockUser(blockerId, blockedId);
  }

  async list(userId: string) {
    return this.store.listBlockedUsers(userId);
  }
}
