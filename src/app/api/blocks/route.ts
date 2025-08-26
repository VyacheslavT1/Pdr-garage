// ... существующие импорты и заголовки оставляем без изменений ...
import { NextResponse } from "next/server";

const securityHeaders = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

// ⬇️ ДОПОЛНЕНО: расширили тип записи опциональными полями контента/медиа (таблицы их игнорируют)
type BlockItem = {
  id: string;
  titleRu: string;
  slug: string;
  status: "Черновик" | "Опубликовано" | "Скрыто";
  orderIndex: number;
  updatedAt: string;
  // опциональные поля для форм редактирования:
  subtitleRu?: string;
  descriptionRu?: string;
  ctaText?: string;
  ctaLink?: string;
  cover?: string | null;
  gallery?: string[];
};

// Оставляем то же «памятное» хранилище
const demoBlocks: BlockItem[] = [
  {
    id: "blk_about",
    titleRu: "О нас",
    slug: "about",
    status: "Опубликовано",
    orderIndex: 10,
    updatedAt: new Date().toISOString(),
    descriptionRu: "Краткое описание компании",
  },
  {
    id: "blk_services",
    titleRu: "Наши услуги",
    slug: "services",
    status: "Черновик",
    orderIndex: 20,
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// ---------- GET /api/blocks (список или один по id через query) ----------
export async function GET(incomingRequest: Request) {
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // ⬇️ НОВОЕ: поддержка ?id= для выборки одной записи
  const currentUrl = new URL(incomingRequest.url);
  const idParam = currentUrl.searchParams.get("id");

  if (idParam) {
    const foundItem = demoBlocks.find((existing) => existing.id === idParam);
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

  // как и раньше — список
  return NextResponse.json(
    { items: demoBlocks },
    { status: 200, headers: securityHeaders }
  );
}

// ---------- POST /api/blocks (создание) ----------
export async function POST(incomingRequest: Request) {
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  let parsedBody: any;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", details: { body: "Invalid JSON" } },
      { status: 400, headers: securityHeaders }
    );
  }

  const payload = {
    slug: (parsedBody?.slug ?? "").toString().trim(),
    orderIndex: Number(parsedBody?.orderIndex ?? 0),
    status: parsedBody?.status as BlockItem["status"],
    titleRu: (parsedBody?.titleRu ?? "").toString().trim(),
    subtitleRu: (parsedBody?.subtitleRu ?? "").toString(),
    descriptionRu: (parsedBody?.descriptionRu ?? "").toString(),
    ctaText: (parsedBody?.ctaText ?? "").toString(),
    ctaLink: (parsedBody?.ctaLink ?? "").toString().trim(),
    cover: parsedBody?.cover ?? null,
    gallery: Array.isArray(parsedBody?.gallery) ? parsedBody.gallery : [],
  };

  const validationErrors: Record<string, string> = {};
  if (!payload.slug) validationErrors.slug = "Ключ блока обязателен";
  else if (!/^[a-z0-9-]{2,}$/.test(payload.slug))
    validationErrors.slug =
      "Только строчные латинские, цифры и дефис; минимум 2 символа";
  if (!payload.titleRu) validationErrors.titleRu = "Заголовок (RU) обязателен";
  else if (payload.titleRu.length > 120)
    validationErrors.titleRu = "Заголовок (RU) слишком длинный";
  if (payload.subtitleRu && payload.subtitleRu.length > 200)
    validationErrors.subtitleRu = "Подзаголовок (RU) слишком длинный";
  if (payload.descriptionRu && payload.descriptionRu.length > 2000)
    validationErrors.descriptionRu = "Описание (RU) слишком длинное";
  if (!["Черновик", "Опубликовано", "Скрыто"].includes(payload.status))
    validationErrors.status = "Недопустимый статус";
  if (!(Number.isFinite(payload.orderIndex) && payload.orderIndex >= 0))
    validationErrors.orderIndex = "Порядок должен быть числом ≥ 0";
  if (payload.ctaText && payload.ctaText.length > 40)
    validationErrors.ctaText = "Текст CTA слишком длинный";
  if (payload.ctaLink) {
    const link = payload.ctaLink;
    const isAnchor = link.startsWith("#");
    const isTel = link.startsWith("tel:");
    const isMailto = link.startsWith("mailto:");
    const isHttp = /^https?:\/\//i.test(link);
    if (!(isAnchor || isTel || isMailto || isHttp))
      validationErrors.ctaLink = "Неверный формат ссылки";
  }
  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: securityHeaders }
    );
  }

  const isSlugExists = demoBlocks.some(
    (existing) => existing.slug === payload.slug
  );
  if (isSlugExists) {
    return NextResponse.json(
      { error: "Conflict", details: { slug: "Ключ блока уже существует" } },
      { status: 409, headers: securityHeaders }
    );
  }
  // ✅ Явно «сужаем» тип: TS теперь знает, что это именно BlockItem['status'], а не union с undefined
  const finalStatusValue: BlockItem["status"] =
    payload.status as BlockItem["status"];

  const newItem: BlockItem = {
    id: `blk_${crypto.randomUUID()}`,
    titleRu: payload.titleRu,
    slug: payload.slug,
    status: finalStatusValue,
    orderIndex: payload.orderIndex,
    updatedAt: new Date().toISOString(),
    subtitleRu: payload.subtitleRu || undefined,
    descriptionRu: payload.descriptionRu || undefined,
    ctaText: payload.ctaText || undefined,
    ctaLink: payload.ctaLink || undefined,
    cover: payload.cover ?? null,
    gallery: payload.gallery ?? [],
  };
  demoBlocks.push(newItem);

  return NextResponse.json(
    { item: newItem },
    { status: 201, headers: securityHeaders }
  );
}

// ---------- PUT /api/blocks?id=<id> (обновление) ----------
export async function PUT(incomingRequest: Request) {
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  const currentUrl = new URL(incomingRequest.url);
  const idParam = currentUrl.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json(
      { error: "ValidationError", details: { id: "id обязателен" } },
      { status: 400, headers: securityHeaders }
    );
  }

  const foundIndex = demoBlocks.findIndex(
    (existing) => existing.id === idParam
  );
  if (foundIndex < 0) {
    return NextResponse.json(
      { error: "NotFound" },
      { status: 404, headers: securityHeaders }
    );
  }

  let parsedBody: any;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", details: { body: "Invalid JSON" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // те же поля, что в POST; все опциональны, но валидируем если присутствуют
  const update = {
    slug:
      typeof parsedBody?.slug === "string" ? parsedBody.slug.trim() : undefined,
    orderIndex:
      typeof parsedBody?.orderIndex === "number"
        ? parsedBody.orderIndex
        : undefined,
    status: parsedBody?.status as BlockItem["status"] | undefined,
    titleRu:
      typeof parsedBody?.titleRu === "string"
        ? parsedBody.titleRu.trim()
        : undefined,
    subtitleRu:
      typeof parsedBody?.subtitleRu === "string"
        ? parsedBody.subtitleRu
        : undefined,
    descriptionRu:
      typeof parsedBody?.descriptionRu === "string"
        ? parsedBody.descriptionRu
        : undefined,
    ctaText:
      typeof parsedBody?.ctaText === "string" ? parsedBody.ctaText : undefined,
    ctaLink:
      typeof parsedBody?.ctaLink === "string"
        ? parsedBody.ctaLink.trim()
        : undefined,
    cover: parsedBody?.cover ?? undefined,
    gallery: Array.isArray(parsedBody?.gallery)
      ? parsedBody.gallery
      : undefined,
  };

  const validationErrors: Record<string, string> = {};
  if (update.slug !== undefined) {
    if (!/^[a-z0-9-]{2,}$/.test(update.slug))
      validationErrors.slug = "Неверный формат slug";
    const isSlugExists = demoBlocks.some(
      (existing) => existing.slug === update.slug && existing.id !== idParam
    );
    if (isSlugExists) validationErrors.slug = "Ключ блока уже существует";
  }
  if (update.titleRu !== undefined && update.titleRu.length === 0)
    validationErrors.titleRu = "Заголовок (RU) обязателен";
  if (update.titleRu !== undefined && update.titleRu.length > 120)
    validationErrors.titleRu = "Заголовок (RU) слишком длинный";
  if (update.subtitleRu !== undefined && update.subtitleRu.length > 200)
    validationErrors.subtitleRu = "Подзаголовок (RU) слишком длинный";
  if (update.descriptionRu !== undefined && update.descriptionRu.length > 2000)
    validationErrors.descriptionRu = "Описание (RU) слишком длинное";
  if (
    update.status !== undefined &&
    !["Черновик", "Опубликовано", "Скрыто"].includes(update.status)
  )
    validationErrors.status = "Недопустимый статус";
  if (
    update.orderIndex !== undefined &&
    !(Number.isFinite(update.orderIndex) && update.orderIndex >= 0)
  )
    validationErrors.orderIndex = "Порядок должен быть числом ≥ 0";
  if (update.ctaText !== undefined && update.ctaText.length > 40)
    validationErrors.ctaText = "Текст CTA слишком длинный";
  if (update.ctaLink !== undefined && update.ctaLink.length > 0) {
    const link = update.ctaLink;
    const isAnchor = link.startsWith("#");
    const isTel = link.startsWith("tel:");
    const isMailto = link.startsWith("mailto:");
    const isHttp = /^https?:\/\//i.test(link);
    if (!(isAnchor || isTel || isMailto || isHttp))
      validationErrors.ctaLink = "Неверный формат ссылки";
  }
  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: securityHeaders }
    );
  }

  const current = demoBlocks[foundIndex];
  const nextStatusValue: BlockItem["status"] = (update.status ??
    current.status) as BlockItem["status"];

  const merged: BlockItem = {
    ...current,
    ...update,
    status: nextStatusValue, // ⬅️ важен порядок: после ...update, чтобы перекрыть возможное undefined
    updatedAt: new Date().toISOString(),
  };
  demoBlocks[foundIndex] = merged;

  return NextResponse.json(
    { item: merged },
    { status: 200, headers: securityHeaders }
  );
}

// ---------- DELETE /api/blocks?id=<id> (удаление) ----------
export async function DELETE(incomingRequest: Request) {
  // 1) Авторизация по cookie (как во всех методах)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 2) Получаем id из query (?id=...)
  const currentUrl = new URL(incomingRequest.url);
  const idParam = currentUrl.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json(
      { error: "ValidationError", details: { id: "id обязателен" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 3) Ищем запись и удаляем из "памятного" массива
  const foundIndex = demoBlocks.findIndex(
    (existing) => existing.id === idParam
  );
  if (foundIndex < 0) {
    return NextResponse.json(
      { error: "NotFound" },
      { status: 404, headers: securityHeaders }
    );
  }

  demoBlocks.splice(foundIndex, 1); // фактическое удаление (в dev-памяти процесса)

  // 4) Отдаём 204 No Content без тела
  return new NextResponse(null, { status: 204, headers: securityHeaders });
}

export const dynamic = "force-dynamic";
