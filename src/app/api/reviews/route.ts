// Назначение: API для отзывов.
// GET /api/reviews            → список
// GET /api/reviews?id=<id>    → один отзыв по id
// PUT /api/reviews?id=<id>    → обновить отзыв по id (редактирование)

import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

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
  status: "Brouillon" | "Publié" | "Masqué"; // статус публикации
  comment?: string | null;
  date?: string | null; // дата отзыва (ISO) или null/не указана
  updatedAt: string; // дата последнего изменения (ISO)

  adminReply?: string | null;
  adminReplyDate?: string | null;
  adminReplyAuthor?: string | null;
};

// Демо-хранилище (память процесса)
const demoReviews: ReviewItem[] = [
  {
    id: "rv_001",
    clientName: "Иван Петров",
    rating: 5,
    status: "Publié",
    date: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 дней назад
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rv_002",
    clientName: "Мария Смирнова",
    rating: null,
    status: "Brouillon",
    date: null,
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 дня назад
  },
];

// ---------- GET /api/reviews (список ИЛИ один по ?id=) ----------
export async function GET(incomingRequest: Request) {
  // 1) Авторизация по cookie — оставляем как было
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  try {
    const currentUrl = new URL(incomingRequest.url);
    const idParam = currentUrl.searchParams.get("id");

    // 2) Один отзыв по id
    if (idParam) {
      const { data, error } = await supabaseServer
        .from("reviews")
        .select("*")
        .eq("id", idParam)
        .single();

      if (error && /no rows|Row not found/i.test(error.message)) {
        return NextResponse.json(
          { error: "NotFound" },
          { status: 404, headers: securityHeaders }
        );
      }
      if (error) {
        throw new Error(error.message);
      }
      const item: ReviewItem = {
        id: data.id,
        clientName: data.client_name,
        comment: data.comment ?? null,
        rating: data.rating ?? null,
        status: data.status,
        date: data.date ?? null,
        updatedAt: data.updated_at,
      };
      return NextResponse.json(
        { item },
        { status: 200, headers: securityHeaders }
      );
    }

    // 3) Список (без пагинации на этом шаге): последние сверху
    const { data, error } = await supabaseServer
      .from("reviews")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const items: ReviewItem[] = (data || []).map((row: any) => ({
      id: row.id,
      clientName: row.client_name,
      comment: row.comment ?? null,
      rating: row.rating ?? null,
      status: row.status,
      date: row.date ?? null,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json(
      { items },
      { status: 200, headers: securityHeaders }
    );
  } catch (caughtError) {
    const readable =
      caughtError instanceof Error ? caughtError.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "ServerError", details: readable },
      { status: 500, headers: securityHeaders }
    );
  }
}

// ---------- PUT /api/reviews?id=<id> (обновление) ----------
// ---------- PUT /api/reviews?id=<id> (обновление в БД Supabase) ----------
// ---------- PUT /api/reviews?id=<id> (mise à jour + réponse admin) ----------
export async function PUT(incomingRequest: Request) {
  // 1) Auth
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 2) id requis
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

  // 3) body JSON
  let parsedBody: any;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", details: { body: "JSON invalide" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 4) partial update (tous les champs optionnels)
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
    status: parsedBody?.status as
      | ("Brouillon" | "Publié" | "Masqué")
      | undefined,
    date:
      parsedBody?.date === null
        ? null
        : typeof parsedBody?.date === "string"
        ? parsedBody.date
        : undefined,

    // ↓ nouveaux champs de réponse admin
    adminReply:
      parsedBody?.adminReply === null
        ? null
        : typeof parsedBody?.adminReply === "string"
        ? parsedBody.adminReply.trim()
        : undefined,
    adminReplyAuthor:
      parsedBody?.adminReplyAuthor === null
        ? null
        : typeof parsedBody?.adminReplyAuthor === "string"
        ? parsedBody.adminReplyAuthor.trim()
        : undefined,
  };

  // 5) validations FR (seulement pour les champs présents)
  const validationErrors: Record<string, string> = {};

  if (update.clientName !== undefined) {
    if (update.clientName.length === 0)
      validationErrors.clientName = "Le nom est obligatoire";
    if (update.clientName.length > 120)
      validationErrors.clientName = "Le nom est trop long";
  }

  if (update.rating !== undefined) {
    const value = update.rating;
    const isNull = value === null;
    const isValidNumber =
      Number.isFinite(value as number) &&
      (value as number) >= 1 &&
      (value as number) <= 5;
    if (!(isNull || isValidNumber)) {
      validationErrors.rating =
        "La note doit être comprise entre 1 et 5 ou null";
    }
  }

  if (
    update.status !== undefined &&
    !["Brouillon", "Publié", "Masqué"].includes(update.status)
  ) {
    validationErrors.status = "Statut non autorisé";
  }

  if (update.date !== undefined) {
    if (update.date !== null && Number.isNaN(Date.parse(update.date))) {
      validationErrors.date = "Format de date invalide (ISO requis ou null)";
    }
  }

  if (update.adminReply !== undefined) {
    if (update.adminReply !== null && update.adminReply.length > 4000) {
      validationErrors.adminReply =
        "La réponse de l’administrateur est trop longue";
    }
  }

  if (update.adminReplyAuthor !== undefined) {
    if (
      update.adminReplyAuthor !== null &&
      update.adminReplyAuthor.length > 120
    ) {
      validationErrors.adminReplyAuthor = "Le nom de l’auteur est trop long";
    }
  }

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: securityHeaders }
    );
  }

  // 6) mapping snake_case + updated_at
  const nowIso = new Date().toISOString();
  const updateRow: Record<string, any> = { updated_at: nowIso };

  if (update.clientName !== undefined)
    updateRow.client_name = update.clientName;
  if (update.rating !== undefined) updateRow.rating = update.rating;
  if (update.status !== undefined) updateRow.status = update.status;
  if (update.date !== undefined) updateRow.date = update.date;

  // champs de réponse admin
  if (update.adminReply !== undefined) {
    updateRow.admin_reply = update.adminReply;
    // дата ответа ставится/сбрасывается вместе с текстом
    updateRow.admin_reply_date = update.adminReply === null ? null : nowIso;
  }
  if (update.adminReplyAuthor !== undefined) {
    updateRow.admin_reply_author = update.adminReplyAuthor;
  }

  try {
    const { data, error } = await supabaseServer
      .from("reviews")
      .update(updateRow)
      .eq("id", idParam)
      .select("*")
      .single();

    if (error && /no rows|Row not found/i.test(error.message)) {
      return NextResponse.json(
        { error: "NotFound" },
        { status: 404, headers: securityHeaders }
      );
    }
    if (error) {
      throw new Error(error.message);
    }

    // 7) réponse: enrichie с полями admin*
    const item: ReviewItem = {
      id: data.id,
      clientName: data.client_name,
      rating: data.rating ?? null,
      status: data.status,
      date: data.date ?? null,
      updatedAt: data.updated_at,
      adminReply: data.admin_reply ?? null,
      adminReplyDate: data.admin_reply_date ?? null,
      adminReplyAuthor: data.admin_reply_author ?? null,
    };

    return NextResponse.json(
      { item },
      { status: 200, headers: securityHeaders }
    );
  } catch (caughtError) {
    const readable =
      caughtError instanceof Error ? caughtError.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "ServerError", details: readable },
      { status: 500, headers: securityHeaders }
    );
  }
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
      { error: "ValidationError", details: { body: "JSON invalide" } },
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

  if (!payload.clientName)
    validationErrors.clientName = "Le nom est obligatoire";
  else if (payload.clientName.length > 120)
    validationErrors.clientName = "Le nom est trop long";

  if (payload.rating !== undefined) {
    const value = payload.rating;
    const isNull = value === null;
    const isValidNumber =
      Number.isFinite(value as number) &&
      (value as number) >= 1 &&
      (value as number) <= 5;
    if (!(isNull || isValidNumber)) {
      validationErrors.rating =
        "La note doit être comprise entre 1 et 5 ou null";
    }
  }

  if (!["Brouillon", "Publié", "Masqué"].includes(payload.status)) {
    validationErrors.status = "Statut non autorisé";
  }

  if (payload.date !== undefined) {
    if (payload.date !== null && Number.isNaN(Date.parse(payload.date))) {
      validationErrors.date = "Format de date invalide (ISO requis ou null)";
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
  // 1) Авторизация по cookie — как у тебя в остальных методах
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
      {
        error: "ValidationError",
        details: { id: "L’identifiant est obligatoire" },
      },
      { status: 400, headers: securityHeaders }
    );
  }

  try {
    // 3) Удаляем из БД и просим вернуть id удалённой строки
    const { data, error } = await supabaseServer
      .from("reviews")
      .delete()
      .eq("id", idParam)
      .select("id")
      .single();

    if (error && /no rows|Row not found/i.test(error.message)) {
      return NextResponse.json(
        { error: "NotFound" },
        { status: 404, headers: securityHeaders }
      );
    }
    if (error) {
      throw new Error(error.message);
    }

    // 4) 204 No Content — как у тебя было
    return new NextResponse(null, { status: 204, headers: securityHeaders });
  } catch (caughtError) {
    const readable =
      caughtError instanceof Error ? caughtError.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "ServerError", details: readable },
      { status: 500, headers: securityHeaders }
    );
  }
}

// Dev-флаг: избегаем SSG/кэшей в разработке
export const dynamic = "force-dynamic";
