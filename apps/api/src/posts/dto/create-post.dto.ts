import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @Length(0, 2200)
  caption!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  imageUrl?: string;
}
