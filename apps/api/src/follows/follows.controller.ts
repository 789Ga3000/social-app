import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types';
import { FollowsService } from './follows.service';

@Controller('users/:userId')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('follow')
  follow(@CurrentUser() user: AuthUser, @Param('userId') followingId: string) {
    return this.followsService.follow(user.id, followingId);
  }

  @Delete('follow')
  unfollow(@CurrentUser() user: AuthUser, @Param('userId') followingId: string) {
    return this.followsService.unfollow(user.id, followingId);
  }

  @Get('followers')
  getFollowers(@Param('userId') userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @Get('following')
  getFollowing(@Param('userId') userId: string) {
    return this.followsService.getFollowing(userId);
  }
}
