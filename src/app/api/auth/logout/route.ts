// Назначение: обработчик POST /api/auth/logout
// - Удаляет httpOnly-cookie access_token и refresh_token (становятся просроченными)
// - Возвращает минимальный JSON для фронтенда (можно показать тост и сделать редирект)
// - Метод именно POST (а не GET), чтобы не плодить CSRF-риски

import { NextResponse } from "next/server";

export async function POST() {
  // 1) Базовые заголовки безопасности для всех ответов этого эндпоинта
  const securityHeaders = {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  };

  // 2) Готовим JSON-ответ (можно расширить при необходимости)
  const response = NextResponse.json(
    { success: true },
    { status: 200, headers: securityHeaders }
  );

  // 3) В проде cookie должны быть secure; в dev — нет (иначе не установятся по http)
  const isProductionEnvironment = process.env.NODE_ENV === "production";

  // 4) Удаляем access_token:
  //    Технически это делается установкой такого же cookie с maxAge=0 (или expires в прошлом)
  response.cookies.set({
    name: "access_token",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionEnvironment,
    path: "/",
    maxAge: 0,
  });

  // 5) И refresh_token — тем же способом
  response.cookies.set({
    name: "refresh_token",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionEnvironment,
    path: "/",
    maxAge: 0,
  });

  // 6) Возвращаем ответ; middleware на следующем запросе в /admin уже не увидит токен
  //    и отправит пользователя на /admin/login
  return response;
}
