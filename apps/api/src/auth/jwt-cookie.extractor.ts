import { Request } from 'express';
import { ExtractJwt } from 'passport-jwt';

export function extractAccessToken(request: Request): string | null {
  const bearerToken = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
  if (bearerToken) {
    return bearerToken;
  }

  return request.cookies?.access_token ?? null;
}
