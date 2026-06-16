const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const files = {
  // --- POSTS MODULE ---
  'posts/dto/create-post.dto.ts': `import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @Length(1, 2200)
  caption!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  imageUrl?: string;
}
`,
  'posts/posts.service.ts': `import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly store: CustomStoreService) {}

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

  async remove(postId: string, userId: string) {
    const post = await this.store.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new NotFoundException('Post not found'); // Hide unauthorized instead of 403
    await this.store.deletePost(postId, userId);
  }

  private async enrichPost(post: any, requestingUserId: string) {
    const author = await this.store.findUserById(post.userId);
    const likesCount = await this.store.countLikes(post.id);
    const comments = await this.store.listCommentsByPost(post.id);
    const isLiked = !!(await this.store.findLike(post.id, requestingUserId));

    return {
      id: post.id,
      caption: post.caption,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      author: author ? {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
      } : { id: 'unknown', username: 'unknown', displayName: 'Unknown User' },
      likesCount,
      commentsCount: comments.length,
      isLiked,
    };
  }
}
`,
  'posts/posts.controller.ts': `import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.id, dto);
  }

  @Get()
  getFeed(@CurrentUser() user: AuthUser) {
    return this.postsService.getFeed(user.id);
  }

  @Get('user/:userId')
  getUserPosts(@CurrentUser() user: AuthUser, @Param('userId') targetUserId: string) {
    return this.postsService.getUserPosts(targetUserId, user.id);
  }

  @Get(':id')
  getPost(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.postsService.getPostById(id, user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.postsService.remove(id, user.id);
  }
}
`,
  'posts/posts.module.ts': `import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [StorageModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
`,

  // --- LIKES MODULE ---
  'likes/likes.service.ts': `import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';

@Injectable()
export class LikesService {
  constructor(private readonly store: CustomStoreService) {}

  async like(userId: string, postId: string) {
    const post = await this.store.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const like = await this.store.createLike(postId, userId);

    if (post.userId !== userId) {
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
`,
  'likes/likes.controller.ts': `import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types';
import { LikesService } from './likes.service';

@Controller('posts/:postId/like')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  like(@CurrentUser() user: AuthUser, @Param('postId') postId: string) {
    return this.likesService.like(user.id, postId);
  }

  @Delete()
  unlike(@CurrentUser() user: AuthUser, @Param('postId') postId: string) {
    return this.likesService.unlike(user.id, postId);
  }
}
`,
  'likes/likes.module.ts': `import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';

@Module({
  imports: [StorageModule],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
`,

  // --- COMMENTS MODULE ---
  'comments/dto/create-comment.dto.ts': `import { IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @Length(1, 1000)
  text!: string;
}
`,
  'comments/comments.service.ts': `import { Injectable, NotFoundException } from '@nestjs/common';
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

  async listByPost(postId: string) {
    const post = await this.store.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const comments = await this.store.listCommentsByPost(postId);
    return { comments: await Promise.all(comments.map(c => this.enrichComment(c))) };
  }

  async remove(commentId: string, userId: string) {
    await this.store.deleteComment(commentId, userId);
  }

  private async enrichComment(comment: any) {
    const author = await this.store.findUserById(comment.userId);
    return {
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      author: author ? {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
      } : { id: 'unknown', username: 'unknown', displayName: 'Unknown User' },
    };
  }
}
`,
  'comments/comments.controller.ts': `import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  create(@CurrentUser() user: AuthUser, @Param('postId') postId: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user.id, postId, dto);
  }

  @Get('posts/:postId/comments')
  listByPost(@Param('postId') postId: string) {
    return this.commentsService.listByPost(postId);
  }

  @Delete('comments/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.commentsService.remove(id, user.id);
  }
}
`,
  'comments/comments.module.ts': `import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [StorageModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
`,

  // --- FOLLOWS MODULE ---
  'follows/follows.service.ts': `import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';

@Injectable()
export class FollowsService {
  constructor(private readonly store: CustomStoreService) {}

  async follow(followerId: string, followingId: string) {
    const target = await this.store.findUserById(followingId);
    if (!target) throw new NotFoundException('User not found');
    if (followerId === followingId) throw new BadRequestException('Cannot follow yourself');

    await this.store.createFollow(followerId, followingId);

    await this.store.createNotification({
      recipientId: followingId,
      actorId: followerId,
      type: 'FOLLOW',
    });

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
`,
  'follows/follows.controller.ts': `import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types';
import { FollowsService } from './follows.service';

@Controller('users/:userId')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('follow')
  follow(@CurrentUser() user: AuthUser, @Param('userId') followingId: string) {
    return this.followsService.follow(user.id, followingId);
  }

  @Delete('follow')
  unfollow(@CurrentUser() user: AuthUser, @Param('userId') followingId: string) {
    return this.followsService.unfollow(user.id, followingId);
  }

  @Get('followers')
  getFollowers(@Param('userId') userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @Get('following')
  getFollowing(@Param('userId') userId: string) {
    return this.followsService.getFollowing(userId);
  }
}
`,
  'follows/follows.module.ts': `import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';

@Module({
  imports: [StorageModule],
  controllers: [FollowsController],
  providers: [FollowsService],
})
export class FollowsModule {}
`,

  // --- NOTIFICATIONS MODULE ---
  'notifications/notifications.service.ts': `import { Injectable } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly store: CustomStoreService) {}

  async list(userId: string) {
    const notifications = await this.store.listNotifications(userId);
    return {
      notifications: await Promise.all(notifications.map(async (n) => {
        const actor = await this.store.findUserById(n.actorId);
        return {
          id: n.id,
          type: n.type,
          actor: actor ? {
            id: actor.id,
            username: actor.username,
            displayName: actor.displayName,
          } : { id: 'unknown', username: 'unknown', displayName: 'Unknown User' },
          postId: n.postId,
          read: n.read,
          createdAt: n.createdAt,
        };
      }))
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.store.markNotificationAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string) {
    await this.store.markAllNotificationsAsRead(userId);
  }

  async countUnread(userId: string) {
    const count = await this.store.countUnreadNotifications(userId);
    return { count };
  }
}
`,
  'notifications/notifications.controller.ts': `import { Controller, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notificationsService.list(user.id);
  }

  @Get('unread-count')
  countUnread(@CurrentUser() user: AuthUser) {
    return this.notificationsService.countUnread(user.id);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('read-all')
  markAllAsRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
`,
  'notifications/notifications.module.ts': `import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [StorageModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
`,
};

// Create files and directories
for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(srcDir, filePath);
  const dirPath = path.dirname(fullPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
  console.log('Created:', filePath);
}
