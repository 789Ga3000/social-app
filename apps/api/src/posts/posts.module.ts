import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { MediaModule } from '../media/media.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [StorageModule, MediaModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
