import { Module } from '@nestjs/common';
import { CustomStoreService } from './custom-store.service';

@Module({
  providers: [CustomStoreService],
  exports: [CustomStoreService],
})
export class StorageModule {}
