import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  create(@CurrentUser() user: AuthUser, @Param('postId') postId: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user.id, postId, dto);
  }

  @Get('posts/:postId/comments')
  listByPost(@CurrentUser() user: AuthUser, @Param('postId') postId: string) {
    return this.commentsService.listByPost(postId, user.id);
  }

  @Delete('comments/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.commentsService.remove(id, user.id, user.role);
  }
}
