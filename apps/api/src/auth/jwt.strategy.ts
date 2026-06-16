import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { extractAccessToken } from './jwt-cookie.extractor';
import { AuthUser, JwtAccessPayload } from './types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT_ACCESS_SECRET is not configured');
    }

    super({
      jwtFromRequest: (request: Request) => extractAccessToken(request),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtAccessPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
  }
}
