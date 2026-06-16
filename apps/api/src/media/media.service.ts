import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class MediaService {
  private s3Client?: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || '';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';

    // If R2 credentials exist, initialize S3Client
    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  async uploadFile(file: any, folder = 'uploads'): Promise<string> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('Cloudflare R2 is not configured in the backend');
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${randomUUID()}${fileExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      });

      await this.s3Client.send(command);

      // Return the public URL
      const url = this.publicUrl.endsWith('/') ? this.publicUrl : `${this.publicUrl}/`;
      return `${url}${fileName}`;
    } catch (error: any) {
      console.error('R2 Upload Error:', error);
      throw new InternalServerErrorException(`Failed to upload file to storage: ${error?.message || 'Unknown error'}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.s3Client || !fileUrl) return;
    
    // Extract key from URL
    try {
      // url format is usually https://publicUrl/folder/filename.ext
      const publicUrlBase = this.publicUrl.endsWith('/') ? this.publicUrl : `${this.publicUrl}/`;
      let key = fileUrl;
      if (fileUrl.startsWith(publicUrlBase)) {
        key = fileUrl.substring(publicUrlBase.length);
      } else {
        // If it's a generic URL, try to grab the pathname without leading slash
        const urlObj = new URL(fileUrl);
        key = urlObj.pathname.substring(1);
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('R2 Delete Error:', error);
      // We log but don't throw, so we don't break the post deletion if file is already gone
    }
  }
}
