// src/modules/auth/model/types.ts

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin";
};

export type SessionPayload = {
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  rememberMe: boolean;
};

export type LoginResponse = {
  user: AuthUser;
  session: SessionPayload;
};

export const AUTH_COOKIE = {
  access: "access_token",
  refresh: "refresh_token",
  remember: "remember_me",
} as const;
