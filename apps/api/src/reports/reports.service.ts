import { Injectable } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';
import { CreateReportInput } from '../storage/types';

@Injectable()
export class ReportsService {
  constructor(private readonly store: CustomStoreService) {}

  async create(reporterId: string, input: CreateReportInput) {
    return this.store.createReport(reporterId, input);
  }
}
