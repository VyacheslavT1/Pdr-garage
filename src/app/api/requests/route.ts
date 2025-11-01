// Назначение: обработчик GET /api/requests
// - Возвращает массив заявок
// - Защищён: без cookie access_token вернёт 401 (как и раздел /admin/**)
// - Возвращает JSON с безопасными заголовками

import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/api/supabase/server";
import { securityHeaders } from "@/shared/api/next/securityHeaders";
import type { RequestItem } from "@/modules/requests/model/types";
import { mapRowToRequestItem } from "@/modules/requests/lib/mappers";
import { normalizeAndValidateCreate } from "@/modules/requests/model/validation";
import { normalizeIncomingAttachments } from "@/modules/requests/lib/attachments";
import { uploadAttachmentsForRequest } from "@/modules/requests/lib/storage";
import { hasAccessTokenCookie } from "@/modules/auth/lib/cookies";

// Заголовки и типы вынесены в shared/modules

// 4) Обработчик GET /api/requests (с сортировкой, пагинацией, статусом, поиском и диапазоном дат)
export async function GET(incomingRequest: Request) {
  // 1) Авторизация по cookie (как у тебя было)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = hasAccessTokenCookie(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  try {
    // 2) Разбор query-параметров (без переименований твоих переменных)
    const url = new URL(incomingRequest.url);
    const rawPage = Number(url.searchParams.get("page") || 1);
    const rawPageSize = Number(url.searchParams.get("pageSize") || 10);
    const rawOrder = (url.searchParams.get("order") || "desc").toLowerCase();
    const rawStatus = url.searchParams.get("status"); // "Не обработано" | "Обработано" | null
    const rawSearch = url.searchParams.get("search"); // строка или null
    const rawFrom = url.searchParams.get("from"); // YYYY-MM-DD или null
    const rawTo = url.searchParams.get("to"); // YYYY-MM-DD или null

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const pageSize =
      Number.isFinite(rawPageSize) && rawPageSize > 0 && rawPageSize <= 100
        ? rawPageSize
        : 10;
    const order: "asc" | "desc" = rawOrder === "asc" ? "asc" : "desc";

    const allowedStatuses = ["Non traité", "Traité"] as const;
    const normalizedStatus: RequestItem["status"] | null =
      typeof rawStatus === "string" &&
      (allowedStatuses as readonly string[]).includes(rawStatus)
        ? (rawStatus as RequestItem["status"])
        : null;

    const hasSearch =
      typeof rawSearch === "string" && rawSearch.trim().length > 0;
    const searchValue = hasSearch ? rawSearch!.trim() : "";

    const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
    const hasFrom = typeof rawFrom === "string" && ymdRegex.test(rawFrom);
    const hasTo = typeof rawTo === "string" && ymdRegex.test(rawTo);

    const fromIso = hasFrom ? `${rawFrom}T00:00:00.000Z` : null;
    const toIso = hasTo ? `${rawTo}T23:59:59.999Z` : null;

    // 3) Базовый запрос к Supabase (public.requests), сортировка по created_at
    //    В БД: created_at, client_name, ... (snake_case)
    //    В ответе: createdAt, clientName, ... (camelCase) — маппим после выборки
    let query = supabaseServer
      .from("requests")
      .select("*")
      .order("created_at", { ascending: order === "asc" });

    // 4) Фильтр по статусу (если передан)
    if (normalizedStatus) {
      query = query.eq("status", normalizedStatus);
    }

    // 5) Фильтры по дате (если переданы границы)
    if (fromIso) query = query.gte("created_at", fromIso);
    if (toIso) query = query.lte("created_at", toIso);

    // 6) Поиск по имени/телефону (OR). Используем ilike с шаблоном %...%
    if (hasSearch) {
      // client_name ILIKE %term% OR phone ILIKE %term%
      query = query.or(
        `client_name.ilike.%${searchValue}%,phone.ilike.%${searchValue}%`
      );
    }

    // 7) Пагинация (range — включительно по end)
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    // 8) Выполняем запрос
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    // 9) Маппинг snake_case → camelCase под твой контракт (RequestItem)
    const items: RequestItem[] = (data || []).map(mapRowToRequestItem);

    return NextResponse.json(
      { items },
      { status: 200, headers: securityHeaders }
    );
  } catch (caughtError) {
    const readable =
      caughtError instanceof Error ? caughtError.message : "Unknown error";
    return NextResponse.json(
      { error: "ServerError", details: readable },
      { status: 500, headers: securityHeaders }
    );
  }
}

// ---------- POST /api/requests (публичное создание заявки) ----------
// ВАЖНО: этот эндпоинт БЕЗ авторизации — его вызывает публичная форма сайта.
export async function POST(incomingRequest: Request) {
  // Локальные техзаголовки как в других методах (мы их не выносим — без рефакторинга)
  const localSecurityHeaders = securityHeaders;

  // 1) Простая антиспам-проверка: "медовый горшок" — скрытое поле в форме должно быть ПУСТЫМ.
  //    Предлагаем имя поля "company" (или любое другое скрытое).
  //    Боты часто заполняют все поля — в таком случае мы тихо возвращаем 204 и НИЧЕГО не сохраняем.
  let parsedBody: unknown = null;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", details: { body: "Invalid JSON" } },
      { status: 400, headers: localSecurityHeaders }
    );
  }
  const pb = (parsedBody ?? {}) as Record<string, unknown>;
  if (typeof pb.company === "string" && pb.company.trim().length > 0) {
    // Тихий отказ: не подсказываем ботам, что поле было ловушкой
    return new NextResponse(null, {
      status: 204,
      headers: localSecurityHeaders,
    });
  }

  // 2) Простейший rate-limit по IP, чтобы не зафлудили (in-memory, только для dev/preview)
  //    ОКНО = 5 минут, ЛИМИТ = 8 заявок с одного IP.
  //    В проде лучше вынести в Redis/Upstash либо использовать готовый middleware.
  //    Не рефакторим: объявляем локальное хранилище, если его ещё нет.
  // "@ts-expect-error: расширяем глобал для переживания HMR в dev
  // 🔒 Тип корзины для лимита
  type RateLimitBucket = { count: number; windowStart: number };

  // ✅ Безопасно «расширяем» globalThis в рамках этого файла (без .d.ts)
  const globalForRateLimit = globalThis as unknown as {
    __requestsRateLimitStore?: Map<string, RateLimitBucket>;
  };

  // Инициализируем один раз (переживает HMR/fast refresh в dev)
  if (!globalForRateLimit.__requestsRateLimitStore) {
    globalForRateLimit.__requestsRateLimitStore = new Map<
      string,
      RateLimitBucket
    >();
  }

  // Рабочее хранилище для кода ниже — тип строго известен
  const rateLimitStore = globalForRateLimit.__requestsRateLimitStore!;

  // Определяем IP (за прокси/верчелем берём первый из X-Forwarded-For, иначе remote address недоступен)
  const forwardedHeader = incomingRequest.headers.get("x-forwarded-for") || "";
  const clientIp = forwardedHeader.split(",")[0].trim() || "unknown";

  const currentTime = Date.now();
  const windowMillis = 5 * 60 * 1000;
  const limitPerWindow = 8;

  const existingBucket = rateLimitStore.get(clientIp);
  if (
    !existingBucket ||
    currentTime - existingBucket.windowStart > windowMillis
  ) {
    rateLimitStore.set(clientIp, { count: 1, windowStart: currentTime });
  } else {
    if (existingBucket.count >= limitPerWindow) {
      return NextResponse.json(
        { error: "TooManyRequests" },
        { status: 429, headers: localSecurityHeaders }
      );
    }
    existingBucket.count += 1;
  }

  // 3) Нормализация + валидация входа (модуль requests)
  const { payload: incomingPayload, errors: validationErrors } =
    normalizeAndValidateCreate(parsedBody);
  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: localSecurityHeaders }
    );
  }

  // ⬇️ ПРИЁМ вложений из тела запроса: ожидаем attachments как массив объектов
  const normalizedAttachments = normalizeIncomingAttachments(
    (pb as { attachments?: unknown }).attachments
  );

  // Генерируем id заявки и загружаем вложения через модуль
  const generatedRequestId = `rq_${crypto.randomUUID()}`;
  const uploadedAttachments = await uploadAttachmentsForRequest(
    generatedRequestId,
    normalizedAttachments || []
  );

  // ---------- ⬇️ НОВЫЙ БЛОК: собираем объект заявки и пишем в Supabase (PostgreSQL)
  const newRequestItemForFirestore: RequestItem = {
    id: generatedRequestId,
    createdAt: new Date().toISOString(),
    clientName: incomingPayload.clientName,
    phone: incomingPayload.phone,
    email: incomingPayload.email,
    comment: incomingPayload.comment,
    status: "Non traité",
    attachments: uploadedAttachments,
    gender: incomingPayload.gender,
  };

  // ✅ Сохраняем заявку в Supabase (маппим camelCase → snake_case колонок таблицы)
  const { error: insertError } = await supabaseServer.from("requests").insert([
    {
      id: newRequestItemForFirestore.id,
      created_at: newRequestItemForFirestore.createdAt,
      client_name: newRequestItemForFirestore.clientName,
      gender: newRequestItemForFirestore.gender ?? null,
      phone: newRequestItemForFirestore.phone,
      email: newRequestItemForFirestore.email,
      comment: newRequestItemForFirestore.comment,
      status: newRequestItemForFirestore.status,
      attachments: newRequestItemForFirestore.attachments ?? [],
    },
  ]);

  if (insertError) {
    return NextResponse.json(
      { error: "ServerError", details: insertError.message },
      { status: 500, headers: localSecurityHeaders }
    );
  }

  // ⬇️ Отдаём тот же контракт, что и раньше — ничего не меняем
  return NextResponse.json(
    { item: newRequestItemForFirestore },
    { status: 201, headers: localSecurityHeaders }
  );
}

// ---------- PATCH /api/requests?id=<id> (смена статуса заявки) ----------
export async function PATCH(incomingRequest: Request) {
  // 1) Авторизация по cookie (как в GET)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = hasAccessTokenCookie(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 2) Берём id заявки из query (?id=...)
  const currentUrl = new URL(incomingRequest.url);
  const idParam = currentUrl.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json(
      {
        error: "ValidationError",
        details: { id: "L’identifiant est obligatoire" },
      },
      { status: 400, headers: securityHeaders }
    );
  }

  // 3) Пытаемся прочитать желаемый статус из тела запроса (опционально)
  //    По умолчанию переводим в 'Обработано'
  let parsedBody: unknown = null;
  try {
    const raw = await incomingRequest.text(); // тело может быть пустым
    parsedBody = raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    // игнорируем некорректный JSON — используем значение по умолчанию
  }

  const p = (parsedBody ?? {}) as Record<string, unknown>;
  const requestedStatus: RequestItem["status"] =
    p.status === "Non traité" || p.status === "Traité"
      ? (p.status as RequestItem["status"])
      : "Traité";

  try {
    // Обновляем только поле статуса по id и сразу читаем обновлённую строку
    const { data, error } = await supabaseServer
      .from("requests")
      .update({ status: requestedStatus })
      .eq("id", idParam)
      .select("*")
      .single(); // ожидаем ровно одну запись

    // Если записи с таким id нет — отдаём 404 (поведение сохраняем)
    if (error && /no rows|Row not found/i.test(error.message)) {
      return NextResponse.json(
        { error: "NotFound" },
        { status: 404, headers: securityHeaders }
      );
    }
    if (error) {
      throw new Error(error.message);
    }

    // Маппим snake_case → твой контракт RequestItem (camelCase)
    const updatedItem: RequestItem = mapRowToRequestItem(data);

    return NextResponse.json(
      { item: updatedItem },
      { status: 200, headers: securityHeaders }
    );
  } catch (caughtError) {
    const readable =
      caughtError instanceof Error ? caughtError.message : "Unknown error";
    return NextResponse.json(
      { error: "ServerError", details: readable },
      { status: 500, headers: securityHeaders }
    );
  }
}

// ---------- DELETE /api/requests?id=<id> (удаление заявки + файлов Storage) ----------
export async function DELETE(incomingRequest: Request) {
  // 1) Авторизация по cookie (как в GET/PATCH)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = hasAccessTokenCookie(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 2) Берём id из query (?id=...)
  const currentUrl = new URL(incomingRequest.url);
  const idParam = currentUrl.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json(
      {
        error: "ValidationError",
        details: { id: "L’identifiant est obligatoire" },
      },
      { status: 400, headers: securityHeaders }
    );
  }

  try {
    // Удаляем запись по id и просим вернуть удалённую строку, чтобы понять — была ли она
    const { data, error } = await supabaseServer
      .from("requests")
      .delete()
      .eq("id", idParam)
      .select("id") // вернуть хотя бы id удалённой записи
      .single(); // ожидаем ровно одну запись

    if (error && /no rows|Row not found/i.test(error.message)) {
      // Аналог твоего 404, если записи не было
      return NextResponse.json(
        { error: "NotFound" },
        { status: 404, headers: securityHeaders }
      );
    }
    if (error) {
      throw new Error(error.message);
    }

    // Успех: как и раньше — 204 No Content
    return new NextResponse(null, {
      status: 204,
      headers: securityHeaders,
    });
  } catch (caughtError) {
    const readable =
      caughtError instanceof Error ? caughtError.message : "Unknown error";
    return NextResponse.json(
      { error: "ServerError", details: readable },
      { status: 500, headers: securityHeaders }
    );
  }
}

// 5) Флаг динамики — чтобы Next не кэшировал ответ в dev/SSG
export const dynamic = "force-dynamic";
