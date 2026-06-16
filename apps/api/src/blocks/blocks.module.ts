import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';

@Module({
  imports: [StorageModule],
  controllers: [BlocksController],
  providers: [BlocksService],
})
export class BlocksModule {}
