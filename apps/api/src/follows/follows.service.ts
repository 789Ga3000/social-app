import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';

@Injectable()
export class FollowsService {
  constructor(private readonly store: CustomStoreService) {}

  async follow(followerId: string, followingId: string) {
    const target = await this.store.findUserById(followingId);
    if (!target) throw new NotFoundException('User not found');
    if (followerId === followingId) throw new BadRequestException('Cannot follow yourself');

    const { isNew } = await this.store.createFollow(followerId, followingId);

    if (isNew) {
      await this.store.createNotification({
        recipientId: followingId,
        actorId: followerId,
        type: 'FOLLOW',
      });
    }

    return { following: true };
  }

  async unfollow(followerId: string, followingId: string) {
    await this.store.removeFollow(followerId, followingId);
    return { following: false };
  }

  async getFollowers(userId: string) {
    const followerIds = await this.store.getFollowers(userId);
    return { followers: await this.enrichUsers(followerIds) };
  }

  async getFollowing(userId: string) {
    const followingIds = await this.store.getFollowing(userId);
    return { following: await this.enrichUsers(followingIds) };
  }

  private async enrichUsers(userIds: string[]) {
    const users = await Promise.all(userIds.map(id => this.store.findUserById(id)));
    return users.filter(u => u !== null).map(u => ({
      id: u!.id,
      username: u!.username,
      displayName: u!.displayName,
    }));
  }
}
