import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [StorageModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
