import { Controller, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notificationsService.list(user.id);
  }

  @Get('unread-count')
  countUnread(@CurrentUser() user: AuthUser) {
    return this.notificationsService.countUnread(user.id);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('read-all')
  markAllAsRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
