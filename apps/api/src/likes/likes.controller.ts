import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/types';
import { LikesService } from './likes.service';

@Controller('posts/:postId/like')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  like(@CurrentUser() user: AuthUser, @Param('postId') postId: string) {
    return this.likesService.like(user.id, postId);
  }

  @Delete()
  unlike(@CurrentUser() user: AuthUser, @Param('postId') postId: string) {
    return this.likesService.unlike(user.id, postId);
  }
}
