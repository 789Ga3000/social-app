import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';
import { MediaService } from '../media/media.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly store: CustomStoreService,
    private readonly mediaService: MediaService
  ) {}

  async create(userId: string, dto: CreatePostDto) {
    const post = await this.store.createPost({
      userId,
      caption: dto.caption,
      imageUrl: dto.imageUrl,
    });
    return this.enrichPost(post, userId);
  }

  async getFeed(userId: string) {
    const posts = await this.store.listFeedPosts(userId);
    return { posts: await Promise.all(posts.map(p => this.enrichPost(p, userId))) };
  }

  async getPostById(postId: string, requestingUserId: string) {
    const post = await this.store.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');
    return this.enrichPost(post, requestingUserId);
  }

  async getUserPosts(targetUserId: string, requestingUserId: string) {
    const posts = await this.store.listPostsByUser(targetUserId);
    return { posts: await Promise.all(posts.map(p => this.enrichPost(p, requestingUserId))) };
  }

  async remove(postId: string, userId: string, role?: string) {
    const post = await this.store.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId && role !== 'ADMIN') throw new NotFoundException('Post not found');
    
    if (role === 'ADMIN') {
      await this.store.adminDeletePost(postId);
    } else {
      await this.store.deletePost(postId, userId);
    }
    
    if (post.imageUrl) {
      await this.mediaService.deleteFile(post.imageUrl);
    }
  }

  private async enrichPost(post: any, requestingUserId: string) {
    const author = await this.store.findUserById(post.userId);
    const authorProfile = author ? await this.store.getProfile(author.id) : null;
    const likesCount = await this.store.countLikes(post.id);
    const comments = await this.store.listCommentsByPost(post.id);
    const isLiked = !!(await this.store.findLike(post.id, requestingUserId));
    const isFollowingAuthor = author ? !!(await this.store.findFollow(requestingUserId, author.id)) : false;

    return {
      id: post.id,
      caption: post.caption,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      author: author ? {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
        avatarUrl: authorProfile?.profile?.avatarUrl || null,
      } : { id: 'unknown', username: 'unknown', displayName: 'Unknown User', avatarUrl: null },
      likesCount,
      commentsCount: comments.length,
      viewsCount: post.viewsCount || 0,
      isLiked,
      isFollowingAuthor,
    };
  }

  async registerView(postId: string, userId: string, durationMs: number) {
    return this.store.registerPostView(postId, userId, durationMs);
  }
}
