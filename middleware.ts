// Назначение файла: единая middleware, которая
// 1) защищает ВСЁ под /admin/** (кроме /admin/login) по cookie access_token
// 2) для остальных путей передаёт управление next-intl middleware, как и раньше

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

// 0) Готовим middleware из next-intl — это твоя текущая логика локализации.
//    Мы её НЕ меняем, просто вызываем позже, если путь не относится к /admin/**
const i18nMiddleware = createMiddleware({ ...routing, localeDetection: false });

// 1) Экспортируем одну общую функцию — теперь это не просто вызов createMiddleware,
//    а «комбайн»: сначала security для админки, затем локализация для остальных путей.
export default function combinedMiddleware(incomingRequest: NextRequest) {
  const currentUrl = incomingRequest.nextUrl;

  // 2) Определяем, запрошен ли раздел админки, и не является ли это страница логина
  const isAdminSectionPath = currentUrl.pathname.startsWith("/admin");
  const isAdminLoginPath = currentUrl.pathname === "/admin/login";

  // 3) Достаём access_token из cookie (httpOnly cookie выставляет бэкенд при успешном логине)
  const accessTokenCookie = incomingRequest.cookies.get("access_token");
  const hasAccessToken = Boolean(accessTokenCookie?.value);

  // 4) Если пользователь идёт в админку (кроме /admin/login) без токена — отправляем на логин
  if (isAdminSectionPath && !isAdminLoginPath && !hasAccessToken) {
    const loginUrl = new URL("/admin/login", currentUrl.origin);
    // Параметр возврата: после входа перекинем туда, куда изначально шёл
    loginUrl.searchParams.set("from", currentUrl.pathname + currentUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // 5) Если это ИМЕННО админские пути — пропускаем дальше БЕЗ вмешательства next-intl,
  //    чтобы админка жила вне префиксов локалей и не была переписана i18n-миддлварой.
  if (isAdminSectionPath) {
    return NextResponse.next();
  }

  // 6) Все прочие пути — обрабатывает твой текущий next-intl middleware как прежде.
  return i18nMiddleware(incomingRequest);
}

// 7) Конфиг матчеров оставляем ТВОЙ, как есть: он уже охватывает все нужные пути и
//    исключает /api, /_next и прочее. Админка сюда тоже попадает — и её мы отфильтровали в коде выше.
export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
