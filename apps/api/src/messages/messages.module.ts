import { Module } from '@nestjs/common';
import { RealtimeBusModule } from '../realtime/realtime-bus.module';
import { StorageModule } from '../storage/storage.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [RealtimeBusModule, StorageModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
