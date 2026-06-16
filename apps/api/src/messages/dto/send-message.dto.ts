import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @Length(1, 4000)
  body!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  clientMessageId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-f0-9-]{36}$/i)
  replyToId?: string;
}
