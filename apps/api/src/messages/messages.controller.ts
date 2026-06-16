import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/types';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post('conversations/:conversationId/join')
  joinConversation(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messages.joinConversation(user.id, conversationId);
  }

  @Get('conversations/:conversationId')
  listMessages(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
  ) {
    return this.messages.listMessages(
      user.id,
      conversationId,
      this.parseLimit(limit),
    );
  }

  @Post('conversations/:conversationId')
  async sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.messages.sendMessage(
      user.id,
      conversationId,
      dto,
    );

    return { message };
  }

  private parseLimit(value?: string): number {
    const parsed = value ? Number(value) : 50;
    if (!Number.isFinite(parsed)) {
      return 50;
    }

    return Math.max(1, Math.min(Math.trunc(parsed), 100));
  }
}
