import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly store: CustomStoreService) {}

  async create(userId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.store.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.store.createComment({
      postId,
      userId,
      text: dto.text,
    });

    if (post.userId !== userId) {
      await this.store.createNotification({
        recipientId: post.userId,
        actorId: userId,
        type: 'COMMENT',
        postId: postId,
        commentId: comment.id,
      });
    }

    return this.enrichComment(comment);
  }

  async listByPost(postId: string, requestingUserId: string) {
    const post = await this.store.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const comments = await this.store.listCommentsByPost(postId);
    const filteredComments = [];
    for (const c of comments) {
      const blocked = await this.store.isBlocked(requestingUserId, c.userId);
      if (!blocked) {
        filteredComments.push(c);
      }
    }
    return { comments: await Promise.all(filteredComments.map(c => this.enrichComment(c))) };
  }

  async remove(commentId: string, userId: string, role?: string) {
    if (role === 'ADMIN') {
      await this.store.adminDeleteComment(commentId);
    } else {
      await this.store.deleteComment(commentId, userId);
    }
  }

  private async enrichComment(comment: any) {
    const author = await this.store.findUserById(comment.userId);
    const authorProfile = author ? await this.store.getProfile(author.id) : null;
    return {
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      author: author ? {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
        avatarUrl: authorProfile?.profile?.avatarUrl || null,
      } : { id: 'unknown', username: 'unknown', displayName: 'Unknown User', avatarUrl: null },
    };
  }
}
