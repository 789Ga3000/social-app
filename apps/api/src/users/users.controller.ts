import { Body, Controller, Delete, Get, Patch, Param, Query, UseGuards, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    await this.users.recordLogin(user.id);
    return this.users.getProfile(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Get('me/wallet')
  getWallet(@CurrentUser() user: AuthUser) {
    return this.users.getWalletTransactions(user.id);
  }

  @Post('me/spin')
  spinLuckyWheel(@CurrentUser() user: AuthUser) {
    return this.users.spinLuckyWheel(user.id);
  }

  @Get('me/missions')
  getDailyMissions(@CurrentUser() user: AuthUser) {
    return this.users.getDailyMissions(user.id);
  }

  @Post('me/missions/:id/claim')
  claimMission(@CurrentUser() user: AuthUser, @Param('id') missionId: string) {
    return this.users.claimMission(user.id, missionId);
  }

  @Post('me/withdraw')
  withdrawStars(@CurrentUser() user: AuthUser, @Body('amount') amount: number) {
    return this.users.withdrawStars(user.id, amount);
  }

  @Get('leaderboard')
  getLeaderboard() {
    return this.users.getLeaderboard();
  }

  @Get('search')
  searchUsers(@CurrentUser() user: AuthUser, @Query('q') query: string) {
    return this.users.searchUsers(query || '', user.id);
  }

  @Get(':username/profile')
  getPublicProfile(@CurrentUser() user: AuthUser, @Param('username') username: string) {
    return this.users.getPublicProfileByUsername(username, user.id);
  }

  @Delete('me')
  async deleteAccount(@CurrentUser() user: AuthUser) {
    await this.users.deleteAccount(user.id);
    return { success: true };
  }
}
