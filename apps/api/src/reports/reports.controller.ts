import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/types';
import { ReportsService } from './reports.service';
import { CreateReportInput } from '../storage/types';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() input: CreateReportInput,
  ) {
    return this.reportsService.create(user.id, input);
  }
}
