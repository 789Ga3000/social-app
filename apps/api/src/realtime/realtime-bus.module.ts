import { Module } from '@nestjs/common';
import { RealtimeBusService } from './realtime-bus.service';

@Module({
  providers: [RealtimeBusService],
  exports: [RealtimeBusService],
})
export class RealtimeBusModule {}
