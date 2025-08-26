// Назначение: API для портфолио.
// GET  /api/portfolio             → список
// GET  /api/portfolio?id=<id>     → одна запись по id
// PUT  /api/portfolio?id=<id>     → частичное обновление записи по id (редактирование)

import { NextResponse } from "next/server";

// 1) Единые заголовки безопасности
const securityHeaders = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

// 2) Тип одной записи (оставляем имя и поля как раньше, расширяем опциональными при необходимости)
type PortfolioItem = {
  id: string; // уникальный id записи
  titleRu: string; // заголовок (RU)
  category: string; // категория
  publishedAt?: string | null; // дата публикации (ISO) или null
  status: "Черновик" | "Опубликовано" | "Скрыто";
  orderIndex: number; // порядок на сайте
  updatedAt: string; // последнее изменение (ISO)
  // при желании можно будет добавить опциональные поля (описание/медиа) без ломки UI
};

// 3) Демо-данные (in-memory)
const demoPortfolio: PortfolioItem[] = [
  {
    id: "pf_001",
    titleRu: "Удаление вмятины на двери",
    category: "Вмятины без покраски",
    publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 дня назад
    status: "Опубликовано",
    orderIndex: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pf_002",
    titleRu: "Полировка капота после царапин",
    category: "Полировка",
    publishedAt: null, // черновик
    status: "Черновик",
    orderIndex: 20,
    updatedAt: new Date(Date.now() - 86400000).toISOString(), // вчера
  },
];

// ---------- GET /api/portfolio (список ИЛИ одна запись по ?id=) ----------
export async function GET(incomingRequest: Request) {
  // 4.1) Авторизация по cookie (единый подход во всех наших эндпоинтах)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 4.2) Если передан id → возвращаем конкретный элемент
  const currentUrl = new URL(incomingRequest.url);
  const idParam = currentUrl.searchParams.get("id");
  if (idParam) {
    const foundItem = demoPortfolio.find((existing) => existing.id === idParam);
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

  // 4.3) Иначе → весь список
  return NextResponse.json(
    { items: demoPortfolio },
    { status: 200, headers: securityHeaders }
  );
}

// ---------- PUT /api/portfolio?id=<id> (частичное обновление) ----------
export async function PUT(incomingRequest: Request) {
  // 5.1) Авторизация
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 5.2) id обязателен
  const currentUrl = new URL(incomingRequest.url);
  const idParam = currentUrl.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json(
      { error: "ValidationError", details: { id: "id обязателен" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 5.3) Ищем запись
  const foundIndex = demoPortfolio.findIndex(
    (existing) => existing.id === idParam
  );
  if (foundIndex < 0) {
    return NextResponse.json(
      { error: "NotFound" },
      { status: 404, headers: securityHeaders }
    );
  }

  // 5.4) Парсим JSON-тело
  let parsedBody: any;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", details: { body: "Invalid JSON" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 5.5) Разрешаем частичный апдейт — все поля опциональны
  const update = {
    titleRu:
      typeof parsedBody?.titleRu === "string"
        ? parsedBody.titleRu.trim()
        : undefined,
    category:
      typeof parsedBody?.category === "string"
        ? parsedBody.category.trim()
        : undefined,
    publishedAt:
      parsedBody?.publishedAt === null
        ? null
        : typeof parsedBody?.publishedAt === "string"
        ? parsedBody.publishedAt
        : undefined,
    status: parsedBody?.status as PortfolioItem["status"] | undefined,
    orderIndex:
      typeof parsedBody?.orderIndex === "number"
        ? parsedBody.orderIndex
        : undefined,
  };

  // 5.6) Валидация только переданных полей
  const validationErrors: Record<string, string> = {};

  if (update.titleRu !== undefined) {
    if (update.titleRu.length === 0)
      validationErrors.titleRu = "Заголовок обязателен";
    if (update.titleRu.length > 120)
      validationErrors.titleRu = "Заголовок слишком длинный";
  }

  if (update.category !== undefined) {
    if (update.category.length === 0)
      validationErrors.category = "Категория обязательна";
    if (update.category.length > 100)
      validationErrors.category = "Категория слишком длинная";
  }

  if (update.publishedAt !== undefined) {
    // Допускаем null ИЛИ корректную ISO-дату
    if (
      update.publishedAt !== null &&
      Number.isNaN(Date.parse(update.publishedAt))
    ) {
      validationErrors.publishedAt =
        "Неверный формат даты публикации (нужна ISO-строка или null)";
    }
  }

  if (
    update.status !== undefined &&
    !["Черновик", "Опубликовано", "Скрыто"].includes(update.status)
  ) {
    validationErrors.status = "Недопустимый статус";
  }

  if (
    update.orderIndex !== undefined &&
    !(Number.isFinite(update.orderIndex) && update.orderIndex >= 0)
  ) {
    validationErrors.orderIndex = "Порядок должен быть числом ≥ 0";
  }

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: securityHeaders }
    );
  }

  // 5.7) Сборка итогового объекта: гарантируем корректный тип status
  const current = demoPortfolio[foundIndex];
  const nextStatusValue: PortfolioItem["status"] = (update.status ??
    current.status) as PortfolioItem["status"];

  const merged: PortfolioItem = {
    ...current,
    ...update, // перезапишет только те поля, что реально пришли (может быть null для publishedAt)
    status: nextStatusValue, // статус не undefined
    updatedAt: new Date().toISOString(),
  };

  demoPortfolio[foundIndex] = merged;

  return NextResponse.json(
    { item: merged },
    { status: 200, headers: securityHeaders }
  );
}

// ---------- POST /api/portfolio (создание новой записи) ----------
export async function POST(incomingRequest: Request) {
  // 1) Авторизация по cookie (единый подход во всех эндпоинтах)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 2) Парсим JSON-тело запроса
  let parsedBody: any;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", details: { body: "Invalid JSON" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 3) Извлекаем поля. Здесь — ровно те, что уже есть на странице редактирования.
  const payload = {
    titleRu: (parsedBody?.titleRu ?? "").toString().trim(), // обязательный
    category: (parsedBody?.category ?? "").toString().trim(), // обязательный
    publishedAt:
      parsedBody?.publishedAt === null
        ? null
        : typeof parsedBody?.publishedAt === "string"
        ? parsedBody.publishedAt
        : undefined, // опционально
    status: parsedBody?.status as PortfolioItem["status"], // обязателен и из допустимых
    orderIndex: Number(parsedBody?.orderIndex ?? 0), // число ≥ 0
  };

  // 4) Валидация полей
  const validationErrors: Record<string, string> = {};

  if (!payload.titleRu) validationErrors.titleRu = "Название обязательно";
  else if (payload.titleRu.length > 120)
    validationErrors.titleRu = "Название слишком длинное";

  if (!payload.category) validationErrors.category = "Категория обязательна";
  else if (payload.category.length > 100)
    validationErrors.category = "Категория слишком длинная";

  if (payload.publishedAt !== undefined) {
    if (
      payload.publishedAt !== null &&
      Number.isNaN(Date.parse(payload.publishedAt))
    ) {
      validationErrors.publishedAt =
        "Неверный формат даты публикации (нужна ISO-строка или null)";
    }
  }

  if (!["Черновик", "Опубликовано", "Скрыто"].includes(payload.status)) {
    validationErrors.status = "Недопустимый статус";
  }

  if (!(Number.isFinite(payload.orderIndex) && payload.orderIndex >= 0)) {
    validationErrors.orderIndex = "Порядок должен быть числом ≥ 0";
  }

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: securityHeaders }
    );
  }

  // 5) Создаём запись в «памятном» хранилище (демо). Генерируем id и updatedAt.
  //    Здесь мы не вводим проверку на уникальность названия — бизнес-правило можно будет добавить позже.
  const newItem: PortfolioItem = {
    id: `pf_${crypto.randomUUID()}`, // стабильный префикс для удобства
    titleRu: payload.titleRu,
    category: payload.category,
    publishedAt: payload.publishedAt ?? null, // может быть null
    status: payload.status as PortfolioItem["status"],
    orderIndex: payload.orderIndex,
    updatedAt: new Date().toISOString(),
  };

  demoPortfolio.push(newItem);

  // 6) Возвращаем 201 Created с созданной записью
  return NextResponse.json(
    { item: newItem },
    { status: 201, headers: securityHeaders }
  );
}
// ---------- DELETE /api/portfolio?id=<id> (удаление кейса) ----------
export async function DELETE(incomingRequest: Request) {
  // 1) Авторизация по cookie (как и в остальных методах)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 2) Получаем id из query-параметра
  const currentUrl = new URL(incomingRequest.url);
  const idParam = currentUrl.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json(
      { error: "ValidationError", details: { id: "id обязателен" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 3) Ищем запись и удаляем из демо-хранилища (память процесса)
  const foundIndex = demoPortfolio.findIndex(
    (existing) => existing.id === idParam
  );
  if (foundIndex < 0) {
    return NextResponse.json(
      { error: "NotFound" },
      { status: 404, headers: securityHeaders }
    );
  }

  demoPortfolio.splice(foundIndex, 1); // физическое удаление из массива

  // 4) Отдаём 204 No Content без тела
  return new NextResponse(null, { status: 204, headers: securityHeaders });
}

// 6) Dev-флаг: избегаем кэшей/SSG
export const dynamic = "force-dynamic";
