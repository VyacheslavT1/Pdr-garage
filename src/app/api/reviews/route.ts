// Назначение: API для отзывов.
// GET /api/reviews            → список
// GET /api/reviews?id=<id>    → один отзыв по id
// PUT /api/reviews?id=<id>    → обновить отзыв по id (редактирование)

import { NextResponse } from "next/server";

// Единые безопасные заголовки
const securityHeaders = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

// Тип одной записи отзыва (синхронизирован со списком /admin/reviews)
type ReviewItem = {
  id: string; // уникальный id
  clientName: string; // имя клиента
  rating?: number | null; // рейтинг 1–5 (может быть null/не указан)
  status: "Черновик" | "Опубликовано" | "Скрыто"; // статус публикации
  date?: string | null; // дата отзыва (ISO) или null/не указана
  updatedAt: string; // дата последнего изменения (ISO)
};

// Демо-хранилище (память процесса)
const demoReviews: ReviewItem[] = [
  {
    id: "rv_001",
    clientName: "Иван Петров",
    rating: 5,
    status: "Опубликовано",
    date: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 дней назад
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rv_002",
    clientName: "Мария Смирнова",
    rating: null,
    status: "Черновик",
    date: null,
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 дня назад
  },
];

// ---------- GET /api/reviews (список ИЛИ один по ?id=) ----------
export async function GET(incomingRequest: Request) {
  // 1) Авторизация по cookie
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 2) Если передан id — отдаём одну запись
  const currentUrl = new URL(incomingRequest.url);
  const idParam = currentUrl.searchParams.get("id");
  if (idParam) {
    const foundItem = demoReviews.find((existing) => existing.id === idParam);
    if (!foundItem) {
      return NextResponse.json(
        { error: "NotFound" },
        { status: 404, headers: securityHeaders }
      );
    }
    return NextResponse.json(
      { item: foundItem },
      { status: 200, headers: securityHeaders }
    );
  }

  // 3) Иначе — весь список
  return NextResponse.json(
    { items: demoReviews },
    { status: 200, headers: securityHeaders }
  );
}

// ---------- PUT /api/reviews?id=<id> (обновление) ----------
export async function PUT(incomingRequest: Request) {
  // 1) Авторизация по cookie
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 2) Идентификатор записи обязателен
  const currentUrl = new URL(incomingRequest.url);
  const idParam = currentUrl.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json(
      { error: "ValidationError", details: { id: "id обязателен" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 3) Ищем запись
  const foundIndex = demoReviews.findIndex(
    (existing) => existing.id === idParam
  );
  if (foundIndex < 0) {
    return NextResponse.json(
      { error: "NotFound" },
      { status: 404, headers: securityHeaders }
    );
  }

  // 4) Читаем тело запроса
  let parsedBody: any;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", details: { body: "Invalid JSON" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 5) Разрешён частичный апдейт — все поля опциональны
  const update = {
    clientName:
      typeof parsedBody?.clientName === "string"
        ? parsedBody.clientName.trim()
        : undefined,
    rating:
      parsedBody?.rating === null
        ? null
        : typeof parsedBody?.rating === "number"
        ? parsedBody.rating
        : undefined,
    status: parsedBody?.status as ReviewItem["status"] | undefined,
    date:
      parsedBody?.date === null
        ? null
        : typeof parsedBody?.date === "string"
        ? parsedBody.date
        : undefined,
  };

  // 6) Валидация только тех полей, которые пришли
  const validationErrors: Record<string, string> = {};

  if (update.clientName !== undefined) {
    if (update.clientName.length === 0)
      validationErrors.clientName = "Имя обязательно";
    if (update.clientName.length > 120)
      validationErrors.clientName = "Имя слишком длинное";
  }

  if (update.rating !== undefined) {
    const value = update.rating;
    const isNull = value === null;
    const isValidNumber =
      Number.isFinite(value as number) &&
      (value as number) >= 1 &&
      (value as number) <= 5;
    if (!(isNull || isValidNumber)) {
      validationErrors.rating = "Рейтинг должен быть числом 1–5 или null";
    }
  }

  if (
    update.status !== undefined &&
    !["Черновик", "Опубликовано", "Скрыто"].includes(update.status)
  ) {
    validationErrors.status = "Недопустимый статус";
  }

  if (update.date !== undefined) {
    // Допускаем null ИЛИ валидную дату (ISO-строку).
    if (update.date !== null && Number.isNaN(Date.parse(update.date))) {
      validationErrors.date =
        "Неверный формат даты (ожидается ISO-строка или null)";
    }
  }

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: securityHeaders }
    );
  }

  // 7) Сборка итогового объекта: аккуратно задаём статус, чтобы тип не стал union с undefined
  const current = demoReviews[foundIndex];
  const nextStatusValue: ReviewItem["status"] = (update.status ??
    current.status) as ReviewItem["status"];

  const merged: ReviewItem = {
    ...current,
    ...update, // перезапишет clientName/rating/date если они пришли (null допустим)
    status: nextStatusValue, // гарантируем корректный тип статуса
    updatedAt: new Date().toISOString(),
  };

  demoReviews[foundIndex] = merged;

  return NextResponse.json(
    { item: merged },
    { status: 200, headers: securityHeaders }
  );
}

// ---------- POST /api/reviews (создание нового отзыва) ----------
export async function POST(incomingRequest: Request) {
  // 1) Авторизация по cookie (единый подход во всех наших эндпоинтах)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 2) Читаем JSON-тело запроса
  let parsedBody: any;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", details: { body: "Invalid JSON" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 3) Извлекаем и нормализуем поля (ровно те, что есть в форме)
  const payload = {
    clientName: (parsedBody?.clientName ?? "").toString().trim(),
    rating:
      parsedBody?.rating === null
        ? null
        : typeof parsedBody?.rating === "number"
        ? parsedBody.rating
        : undefined,
    status: parsedBody?.status as ReviewItem["status"],
    date:
      parsedBody?.date === null
        ? null
        : typeof parsedBody?.date === "string"
        ? parsedBody.date
        : undefined,
  };

  // 4) Валидация
  const validationErrors: Record<string, string> = {};

  if (!payload.clientName) validationErrors.clientName = "Имя обязательно";
  else if (payload.clientName.length > 120)
    validationErrors.clientName = "Имя слишком длинное";

  if (payload.rating !== undefined) {
    const value = payload.rating;
    const isNull = value === null;
    const isValidNumber =
      Number.isFinite(value as number) &&
      (value as number) >= 1 &&
      (value as number) <= 5;
    if (!(isNull || isValidNumber)) {
      validationErrors.rating = "Рейтинг должен быть числом 1–5 или null";
    }
  }

  if (!["Черновик", "Опубликовано", "Скрыто"].includes(payload.status)) {
    validationErrors.status = "Недопустимый статус";
  }

  if (payload.date !== undefined) {
    if (payload.date !== null && Number.isNaN(Date.parse(payload.date))) {
      validationErrors.date =
        "Неверный формат даты (нужна ISO-строка или null)";
    }
  }

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: securityHeaders }
    );
  }

  // 5) Сужаем тип статуса, чтобы исключить undefined для TS
  const finalStatusValue: ReviewItem["status"] =
    payload.status as ReviewItem["status"];

  // 6) Создаём запись в демо-хранилище
  const newItem: ReviewItem = {
    id: `rv_${crypto.randomUUID()}`,
    clientName: payload.clientName,
    rating: payload.rating ?? null,
    status: finalStatusValue,
    date: payload.date ?? null,
    updatedAt: new Date().toISOString(),
  };
  demoReviews.push(newItem);

  // 7) Отдаём 201 Created
  return NextResponse.json(
    { item: newItem },
    { status: 201, headers: securityHeaders }
  );
}
// ---------- DELETE /api/reviews?id=<id> (удаление отзыва) ----------
export async function DELETE(incomingRequest: Request) {
  // 1) Простая авторизация по cookie (как в GET/PUT/POST)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
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
      { error: "ValidationError", details: { id: "id обязателен" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 3) Ищем запись в демо-хранилище (память процесса)
  const foundIndex = demoReviews.findIndex(
    (existing) => existing.id === idParam
  );
  if (foundIndex < 0) {
    return NextResponse.json(
      { error: "NotFound" },
      { status: 404, headers: securityHeaders }
    );
  }

  // 4) Удаляем
  demoReviews.splice(foundIndex, 1);

  // 5) 204 No Content (без тела)
  return new NextResponse(null, { status: 204, headers: securityHeaders });
}

// Dev-флаг: избегаем SSG/кэшей в разработке
export const dynamic = "force-dynamic";
