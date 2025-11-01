// Назначение: обработчик POST /api/auth/logout
// - Удаляет httpOnly-cookie access_token и refresh_token (становятся просроченными)
// - Возвращает минимальный JSON для фронтенда (можно показать тост и сделать редирект)
// - Метод именно POST (а не GET), чтобы не плодить CSRF-риски

import { NextResponse } from "next/server";
import { securityHeaders } from "@/shared/api/next/securityHeaders";
import { clearAuthCookies } from "@/modules/auth/lib/cookies";

export async function POST() {
  // 2) Готовим JSON-ответ (можно расширить при необходимости)
  const response = NextResponse.json(
    { success: true },
    { status: 200, headers: securityHeaders }
  );

  // 3) Сбрасываем auth-cookies
  clearAuthCookies(response);

  // 4) Возвращаем ответ; middleware на следующем запросе в /admin уже не увидит токен
  //    и отправит пользователя на /admin/login
  return response;
}
