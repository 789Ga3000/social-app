import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';

@Module({
  imports: [StorageModule],
  controllers: [FollowsController],
  providers: [FollowsService],
})
export class FollowsModule {}
