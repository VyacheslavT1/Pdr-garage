// Назначение: публичный приём отзывов без авторизации.
// Сохраняет запись в БД (Supabase/PostgreSQL) со статусом "Черновик" для последующей модерации в админке.

import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/api/supabase/server";
import { securityHeaders } from "@/shared/api/next/securityHeaders";
import { normalizeAndValidatePublicCreate } from "@/modules/reviews/model/validation";
import { mapRowToReviewItem } from "@/modules/reviews/lib/mappers";
import type { ReviewItem, ReviewStatus } from "@/modules/reviews/model/types";

// Единые безопасные заголовки (из shared)

// Типы — из модуля reviews

// Антиспам-корзина (как у заявок), переживает HMR в dev
type RateLimitBucket = { count: number; windowStart: number };
const globalForRateLimit = globalThis as unknown as {
  __reviewsRateLimitStore?: Map<string, RateLimitBucket>;
};
if (!globalForRateLimit.__reviewsRateLimitStore) {
  globalForRateLimit.__reviewsRateLimitStore = new Map();
}
const rateLimitStore = globalForRateLimit.__reviewsRateLimitStore!;

// ---------- GET /api/reviews/public (список опубликованных для витрины) ----------
export async function GET(incomingRequest: Request) {
  try {
    const url = new URL(incomingRequest.url);
    const rawLimit = Number(url.searchParams.get("limit") || 20);
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 100
        ? rawLimit
        : 20;

    // Берём только опубликованные и добавляем поля ответа администратора
    const { data, error } = await supabaseServer
      .from("reviews")
      .select(
        "id, client_name, rating, comment, date, admin_reply, admin_reply_author, admin_reply_date, status, updated_at"
      )
      .eq("status", "Publié")
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    const fullItems: ReviewItem[] = (data || []).map(mapRowToReviewItem);
    // публичному списку отдадим тот же контракт, но фактически это подмножество
    const items = fullItems.map((it) => ({
      id: it.id,
      clientName: it.clientName,
      rating: it.rating ?? null,
      comment: it.comment ?? null,
      date: it.date ?? null,
      adminReply: it.adminReply ?? null,
      adminReplyAuthor: it.adminReplyAuthor ?? null,
      adminReplyDate: it.adminReplyDate ?? null,
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

export async function POST(incomingRequest: Request) {
  try {
    // 1) Honeypot: скрытое поле "company" должно быть пустым
    let parsedBody: unknown;
    try {
      parsedBody = await incomingRequest.json();
    } catch {
      return NextResponse.json(
        { error: "ValidationError", details: { body: "Invalid JSON" } },
        { status: 400, headers: securityHeaders }
      );
    }
    const pb = (parsedBody ?? {}) as Record<string, unknown>;
    if (typeof pb.company === "string" && pb.company.trim().length > 0) {
      // Тихо "проглатываем" бота
      return new NextResponse(null, { status: 204, headers: securityHeaders });
    }

    // 2) Простейший rate-limit по IP (окно 5 мин, лимит 8)
    const forwardedHeader =
      incomingRequest.headers.get("x-forwarded-for") || "";
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
          { status: 429, headers: securityHeaders }
        );
      }
      existingBucket.count += 1;
    }

    // 3) Нормализация + валидация (модуль reviews)
    const { payload, errors: validationErrors } =
      normalizeAndValidatePublicCreate(parsedBody);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: "ValidationError", details: validationErrors },
        { status: 400, headers: securityHeaders }
      );
    }

    // 4) Сборка записи для БД
    const generatedReviewId = `rv_${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();
    const status: ReviewStatus = "Brouillon";

    // Сохраняем в таблицу "reviews" (snake_case колонки)
    const { error: insertError } = await supabaseServer.from("reviews").insert([
      {
        id: generatedReviewId,
        client_name: payload.clientName,
        rating: payload.rating, // number | null
        comment: payload.comment, // text | null
        status: status, // "Черновик" по умолчанию
        date: nowIso, // дата отзыва (можно показывать на сайте)
        updated_at: nowIso, // для админки
        created_at: nowIso, // для истории
      },
    ]);

    if (insertError) {
      return NextResponse.json(
        { error: "ServerError", details: insertError.message },
        { status: 500, headers: securityHeaders }
      );
    }

    // 5) Возвращаем минимально нужные данные
    return NextResponse.json(
      {
        item: {
          id: generatedReviewId,
          clientName: payload.clientName,
          rating: payload.rating,
          status,
          date: nowIso,
          updatedAt: nowIso,
          // comment можно не отдавать публичной форме — на твоё усмотрение
        },
      },
      { status: 201, headers: securityHeaders }
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

export const dynamic = "force-dynamic";
