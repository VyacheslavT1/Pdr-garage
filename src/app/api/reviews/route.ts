// src/app/api/reviews/route.ts

import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/api/supabase/server";
import { securityHeaders } from "@/shared/api/next/securityHeaders";
import type { ReviewItem } from "@/modules/reviews/model/types";
import { mapRowToReviewItem } from "@/modules/reviews/lib/mappers";
import { normalizeAndValidateAdminUpdate, normalizeAndValidateAdminCreate } from "@/modules/reviews/model/validation";
import { hasAccessTokenCookie } from "@/modules/auth/lib/cookies";

// Единые безопасные заголовки (shared)

// Тип перенесён в модуль reviews

// Демо-хранилище (память процесса)
// const demoReviews: ReviewItem[] = [];

// ---------- GET /api/reviews (список ИЛИ один по ?id=) ----------
export async function GET(incomingRequest: Request) {
  // 1) Авторизация по cookie — оставляем как было
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = hasAccessTokenCookie(cookieHeader);
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
      const item: ReviewItem = mapRowToReviewItem(data);
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

    const items: ReviewItem[] = (data || []).map(mapRowToReviewItem);

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
  const hasAccessToken = hasAccessTokenCookie(cookieHeader);
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
  let parsedBody: unknown;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", details: { body: "JSON invalide" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 4) partial update + validation (module)
  const { update, errors: validationErrors } =
    normalizeAndValidateAdminUpdate(parsedBody);

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: securityHeaders }
    );
  }

  // 6) mapping snake_case + updated_at
  const nowIso = new Date().toISOString();
  const updateRow: Record<string, unknown> = { updated_at: nowIso };

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
    const item: ReviewItem = mapRowToReviewItem(data);

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
  const hasAccessToken = hasAccessTokenCookie(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 2) Читаем JSON-тело запроса
  let parsedBody: unknown;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", details: { body: "JSON invalide" } },
      { status: 400, headers: securityHeaders }
    );
  }

  // 3) Нормализация + валидация (модуль)
  const { payload, errors } = normalizeAndValidateAdminCreate(parsedBody);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: errors },
      { status: 400, headers: securityHeaders }
    );
  }

  // 4) Вставка в Supabase
  const id = `rv_${crypto.randomUUID()}`;
  const nowIso = new Date().toISOString();
  const insertRow: Record<string, unknown> = {
    id,
    client_name: payload.clientName,
    rating: payload.rating ?? null,
    status: payload.status,
    date: payload.date ?? null,
    updated_at: nowIso,
    created_at: nowIso,
  };

  const { data, error } = await supabaseServer
    .from("reviews")
    .insert([insertRow])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "ServerError", details: error.message },
      { status: 500, headers: securityHeaders }
    );
  }

  const item: ReviewItem = mapRowToReviewItem(data);
  return NextResponse.json(
    { item },
    { status: 201, headers: securityHeaders }
  );
}
// ---------- DELETE /api/reviews?id=<id> (удаление отзыва) ----------
export async function DELETE(incomingRequest: Request) {
  // 1) Авторизация по cookie — как у тебя в остальных методах
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
    // 3) Удаляем из БД и просим вернуть id удалённой строки
    const { error } = await supabaseServer
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
