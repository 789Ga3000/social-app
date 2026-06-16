export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
};

export type JwtAccessPayload = {
  sub: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
