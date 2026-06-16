import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthUser, TokenPair } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.signup(dto, this.getRequestMeta(request));
    this.setAuthCookies(response, result.tokens);
    return { user: result.user, accessToken: result.tokens.accessToken, refreshToken: result.tokens.refreshToken, expiresIn: result.tokens.expiresIn };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log('\n\n=== INCOMING LOGIN REQUEST ===');
    console.log('Body:', dto);
    console.log('==============================\n\n');
    const result = await this.auth.login(dto, this.getRequestMeta(request));
    this.setAuthCookies(response, result.tokens);
    return { user: result.user, accessToken: result.tokens.accessToken, refreshToken: result.tokens.refreshToken, expiresIn: result.tokens.expiresIn };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body('refreshToken') bodyRefreshToken?: string,
  ) {
    const refreshToken = request.cookies?.refresh_token || bodyRefreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokens = await this.auth.refresh(
      refreshToken,
      this.getRequestMeta(request),
    );
    this.setAuthCookies(response, tokens);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(request.cookies?.refresh_token);
    this.clearAuthCookies(response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  private setAuthCookies(response: Response, tokens: TokenPair) {
    const secure = process.env.COOKIE_SECURE === 'true';
    response.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: tokens.expiresIn * 1000,
      path: '/',
    });
    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge:
        Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30) * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/api/v1/auth' });
  }

  private getRequestMeta(request: Request) {
    return {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    };
  }
}
