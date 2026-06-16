import { IsEmail, IsString, Length, Matches, IsOptional } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'username may contain letters, numbers, dots, and underscores',
  })
  username!: string;

  @IsString()
  @Length(8, 128)
  password!: string;

  @IsString()
  @Length(1, 80)
  displayName!: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
