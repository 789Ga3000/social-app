import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  async listUsers() {
    const users = await this.adminService.listUsers();
    return { users };
  }

  @Patch('users/:id/status')
  async toggleUserStatus(
    @Param('id') userId: string,
    @Body('isDisabled') isDisabled: boolean,
  ) {
    await this.adminService.toggleUserStatus(userId, isDisabled);
    return { success: true };
  }

  @Patch('users/:id/role')
  async changeUserRole(
    @Param('id') userId: string,
    @Body('role') role: 'USER' | 'ADMIN',
  ) {
    await this.adminService.changeUserRole(userId, role);
    return { success: true };
  }

  @Get('posts')
  async listPosts() {
    const posts = await this.adminService.listPosts();
    return { posts };
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') postId: string) {
    await this.adminService.deletePost(postId);
    return { success: true };
  }

  @Patch('posts/:id/restore')
  async restorePost(@Param('id') postId: string) {
    await this.adminService.restorePost(postId);
    return { success: true };
  }

  @Get('comments')
  async listComments() {
    const comments = await this.adminService.listComments();
    return { comments };
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id') commentId: string) {
    await this.adminService.deleteComment(commentId);
    return { success: true };
  }

  @Patch('comments/:id/restore')
  async restoreComment(@Param('id') commentId: string) {
    await this.adminService.restoreComment(commentId);
    return { success: true };
  }

  @Get('reports')
  async listReports() {
    const reports = await this.adminService.listReports();
    return { reports };
  }

  @Post('reports/:id/resolve')
  async resolveReport(
    @Param('id') reportId: string,
    @CurrentUser() admin: any,
    @Body('action') action: 'DISMISS' | 'DELETE_POST' | 'BAN_USER',
  ) {
    await this.adminService.resolveReport(reportId, action, admin.id);
    return { success: true };
  }
}
