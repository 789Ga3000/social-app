import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.id, dto);
  }

  @Get()
  getFeed(@CurrentUser() user: AuthUser) {
    return this.postsService.getFeed(user.id);
  }

  @Post(':id/view')
  async registerView(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('durationMs') durationMs: number,
  ) {
    await this.postsService.registerView(id, user.id, durationMs || 0);
    return { success: true };
  }

  @Get('user/:userId')
  getUserPosts(@CurrentUser() user: AuthUser, @Param('userId') targetUserId: string) {
    return this.postsService.getUserPosts(targetUserId, user.id);
  }

  @Get(':id')
  getPost(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.postsService.getPostById(id, user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.postsService.remove(id, user.id, user.role);
  }
}
