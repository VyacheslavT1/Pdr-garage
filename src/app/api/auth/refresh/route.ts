// Назначение файла: обработчик POST /api/auth/refresh
// - Проверяет наличие httpOnly refresh_token (и remember_me) в cookies
// - Выпускает новый access_token + новый refresh_token с тем же сроком действия, что и remember_me
// - Возвращает user + session, чтобы фронт мог обновить состояние без повторного логина
// ВАЖНО: это dev-заглушка. В проде refresh должен проверять подписи/базу данных.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { setAuthCookies } from "@/modules/auth/lib/cookies";
import { AUTH_COOKIE, type LoginResponse } from "@/modules/auth/model/types";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_LONG_SECONDS,
  REFRESH_TOKEN_TTL_SHORT_SECONDS,
} from "@/modules/auth/lib/tokenConfig";
import { securityHeaders } from "@/shared/api/next/securityHeaders";

export async function POST() {
  const cookieStore = await cookies();
  const refreshCookie = cookieStore.get(AUTH_COOKIE.refresh);

  if (!refreshCookie?.value) {
    return NextResponse.json(
      { error: "RefreshTokenMissing" },
      { status: 401, headers: securityHeaders }
    );
  }

  const rememberCookie = cookieStore.get(AUTH_COOKIE.remember);
  const rememberMe = rememberCookie?.value === "1";

  const accessTokenValue = crypto.randomUUID();
  const refreshTokenValue = crypto.randomUUID();

  const refreshTokenTtlSeconds = rememberMe
    ? REFRESH_TOKEN_TTL_LONG_SECONDS
    : REFRESH_TOKEN_TTL_SHORT_SECONDS;

  const accessExpiresAtIso = new Date(
    Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000
  ).toISOString();
  const refreshExpiresAtIso = new Date(
    Date.now() + refreshTokenTtlSeconds * 1000
  ).toISOString();

  const userPayload = {
    id: "admin-dev",
    name: process.env.ADMIN_NAME || "Admin",
    email: process.env.ADMIN_EMAIL?.toLowerCase() || "",
    role: "admin" as const,
  };

  const sessionPayload = {
    accessTokenExpiresAt: accessExpiresAtIso,
    refreshTokenExpiresAt: refreshExpiresAtIso,
    rememberMe,
  };

  const response = NextResponse.json(
    { user: userPayload, session: sessionPayload } satisfies LoginResponse,
    { status: 200, headers: securityHeaders }
  );

  setAuthCookies(response, {
    access: accessTokenValue,
    refresh: refreshTokenValue,
    accessTtlSeconds: ACCESS_TOKEN_TTL_SECONDS,
    refreshTtlSeconds: refreshTokenTtlSeconds,
    rememberMe,
  });

  return response;
}
