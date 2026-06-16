import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/types';
import { BlocksService } from './blocks.service';

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const blocked = await this.blocksService.list(user.id);
    return { blocked };
  }

  @Post(':userId')
  async block(
    @CurrentUser() user: AuthUser,
    @Param('userId') blockedId: string,
  ) {
    await this.blocksService.block(user.id, blockedId);
    return { success: true };
  }

  @Delete(':userId')
  async unblock(
    @CurrentUser() user: AuthUser,
    @Param('userId') blockedId: string,
  ) {
    await this.blocksService.unblock(user.id, blockedId);
    return { success: true };
  }
}
