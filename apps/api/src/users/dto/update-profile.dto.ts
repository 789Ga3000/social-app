import { IsBoolean, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  displayName?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Length(0, 160)
  bio?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  location?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
