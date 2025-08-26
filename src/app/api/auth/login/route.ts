// Назначение файла: обработчик POST /api/auth/login
// - Принимает { email, password, rememberMe }
// - Сверяет с админскими учётными данными из .env.local (ADMIN_EMAIL, ADMIN_PASSWORD)
// - На успехе выставляет httpOnly-cookie: access_token (≈15 мин) и refresh_token (7 или 30 дней)
// - Возвращает JSON с user + session, как в контракте
// - На ошибках отдаёт статусы 400/401 (валидация/неверные данные)
// ВНИМАНИЕ: это заглушка для разработки. В проде её заменит настоящий бэкенд/JWT.

import { NextResponse } from "next/server";

// 1) Утилита: безопасно читаем JSON-тело и валидируем минимально
async function readAndValidateRequestBody(incomingRequest: Request) {
  // 1.1) Пытаемся распарсить JSON
  let parsedBody: unknown;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return {
      ok: false as const,
      status: 400,
      error: { error: "ValidationError", details: { body: "Invalid JSON" } },
    };
  }

  // 1.2) Проверяем структуру { email, password, rememberMe? }
  const maybeObject = parsedBody as Record<string, unknown>;
  const emailValue =
    typeof maybeObject.email === "string"
      ? maybeObject.email.trim().toLowerCase()
      : "";
  const passwordValue =
    typeof maybeObject.password === "string" ? maybeObject.password : "";
  const rememberMeValue =
    typeof maybeObject.rememberMe === "boolean"
      ? maybeObject.rememberMe
      : false;

  const validationErrors: Record<string, string> = {};
  // очень простая проверка email (для заглушки этого достаточно; реальная — на сервере)
  const isEmailLooksValid = /\S+@\S+\.\S+/.test(emailValue);

  if (!emailValue) validationErrors.email = "Email is required";
  else if (!isEmailLooksValid) validationErrors.email = "Invalid email format";

  if (!passwordValue) validationErrors.password = "Password is required";
  else if (passwordValue.length < 8)
    validationErrors.password = "Password must be at least 8 characters";

  if (Object.keys(validationErrors).length > 0) {
    return {
      ok: false as const,
      status: 400,
      error: { error: "ValidationError", details: validationErrors },
    };
  }

  return {
    ok: true as const,
    data: {
      emailValue,
      passwordValue,
      rememberMeValue,
    },
  };
}

// 2) Основной обработчик POST
export async function POST(incomingRequest: Request) {
  // 2.1) Базовые заголовки безопасности (для всех ответов)
  const securityHeaders = {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  };

  // 2.2) Валидируем тело запроса
  const validationResult = await readAndValidateRequestBody(incomingRequest);
  if (!validationResult.ok) {
    return NextResponse.json(validationResult.error, {
      status: validationResult.status,
      headers: securityHeaders,
    });
  }
  const { emailValue, passwordValue, rememberMeValue } = validationResult.data;

  // 2.3) Читаем «эталонные» учётные данные из переменных окружения (зададим в .env.local)
  const adminEmailFromEnvironment = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPasswordFromEnvironment = process.env.ADMIN_PASSWORD;

  // 2.4) Проверка учётных данных (для заглушки — простое сравнение строк).
  // В реальном бэкенде будет проверка хэша пароля (Argon2/BCrypt) и выдача JWT.
  const areCredentialsValid =
    adminEmailFromEnvironment &&
    adminPasswordFromEnvironment &&
    emailValue === adminEmailFromEnvironment &&
    passwordValue === adminPasswordFromEnvironment;

  if (!areCredentialsValid) {
    // 2.5) Единое сообщение без уточнения, что именно неверно (email или пароль)
    return NextResponse.json(
      { error: "InvalidCredentials" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 2.6) Генерируем псевдо-токены для dev-сценария
  // В проде здесь должны быть настоящие JWT с payload (sub, role, exp и т.п.)
  const accessTokenValue = crypto.randomUUID(); // короткоживущий
  const refreshTokenValue = crypto.randomUUID(); // долгоживущий

  // 2.7) Вычисляем сроки действия, как в контракте
  const accessTokenTtlSeconds = 15 * 60; // 15 минут
  const refreshTokenTtlSeconds = rememberMeValue
    ? 30 * 24 * 60 * 60
    : 7 * 24 * 60 * 60; // 30 дней или 7 дней

  const accessExpiresAtIso = new Date(
    Date.now() + accessTokenTtlSeconds * 1000
  ).toISOString();
  const refreshExpiresAtIso = new Date(
    Date.now() + refreshTokenTtlSeconds * 1000
  ).toISOString();

  // 2.8) Формируем JSON-ответ (минимум, как договорились)
  const userPayload = {
    id: "admin-dev", // для заглушки фиксируем
    name: process.env.ADMIN_NAME || "Admin",
    email: emailValue,
    role: "admin" as const,
  };
  const sessionPayload = {
    accessTokenExpiresAt: accessExpiresAtIso,
    refreshTokenExpiresAt: refreshExpiresAtIso,
    rememberMe: rememberMeValue,
  };

  // 2.9) Формируем ответ и выставляем httpOnly-cookie.
  // ВАЖНО: secure=true у cookie в dev-сервере (http) не сработает.
  // Поэтому делаем привязку к окружению: secure = (NODE_ENV === 'production').
  const response = NextResponse.json(
    { user: userPayload, session: sessionPayload },
    { status: 200, headers: securityHeaders }
  );

  const isProductionEnvironment = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: "access_token",
    value: accessTokenValue,
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionEnvironment,
    path: "/",
    maxAge: accessTokenTtlSeconds,
  });

  response.cookies.set({
    name: "refresh_token",
    value: refreshTokenValue,
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionEnvironment,
    path: "/",
    maxAge: refreshTokenTtlSeconds,
  });

  return response;
}
