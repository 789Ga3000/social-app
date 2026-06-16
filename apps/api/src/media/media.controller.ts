import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    }
  }))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file provided or file exceeds 50MB limit');
    }

    // Limit file size to 50MB and ensure it's an image or video
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }

    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
      throw new BadRequestException('Only image and video files are allowed');
    }

    const url = await this.mediaService.uploadFile(file);
    return { url };
  }
}
