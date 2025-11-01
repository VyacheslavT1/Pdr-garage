// src/modules/auth/lib/cookies.ts
import type { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/modules/auth/model/types";

export function setAuthCookies(
  response: NextResponse,
  args: {
    access: string;
    refresh: string;
    accessTtlSeconds: number;
    refreshTtlSeconds: number;
  }
) {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: AUTH_COOKIE.access,
    value: args.access,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: args.accessTtlSeconds,
  });

  response.cookies.set({
    name: AUTH_COOKIE.refresh,
    value: args.refresh,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: args.refreshTtlSeconds,
  });
}

export function clearAuthCookies(response: NextResponse) {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: AUTH_COOKIE.access,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: AUTH_COOKIE.refresh,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 0,
  });
}

export function hasAccessTokenCookie(cookieHeader: string | null | undefined): boolean {
  const name = AUTH_COOKIE.access;
  const source = cookieHeader || "";
  const pattern = new RegExp(`(?:^|;\\s*)${name}=`);
  return pattern.test(source);
}
