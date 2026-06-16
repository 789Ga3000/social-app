import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';

@Injectable()
export class LikesService {
  constructor(private readonly store: CustomStoreService) {}

  async like(userId: string, postId: string) {
    const post = await this.store.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const { isNew } = await this.store.createLike(postId, userId);

    if (isNew && post.userId !== userId) {
      await this.store.createNotification({
        recipientId: post.userId,
        actorId: userId,
        type: 'LIKE',
        postId: postId,
      });
    }

    return { liked: true };
  }

  async unlike(userId: string, postId: string) {
    await this.store.removeLike(postId, userId);
    return { liked: false };
  }
}
