import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { LikesModule } from './likes/likes.module';
import { CommentsModule } from './comments/comments.module';
import { FollowsModule } from './follows/follows.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MediaModule } from './media/media.module';
import { AdminModule } from './admin/admin.module';
import { ReportsModule } from './reports/reports.module';
import { BlocksModule } from './blocks/blocks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    StorageModule,
    AuthModule,
    UsersModule,
    MessagesModule,
    RealtimeModule,
    PostsModule,
    LikesModule,
    CommentsModule,
    FollowsModule,
    NotificationsModule,
    MediaModule,
    AdminModule,
    ReportsModule,
    BlocksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
