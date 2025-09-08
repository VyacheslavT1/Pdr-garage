// Назначение: публичный приём отзывов без авторизации.
// Сохраняет запись в БД (Supabase/PostgreSQL) со статусом "Черновик" для последующей модерации в админке.

import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabaseServer";

// Единые безопасные заголовки (аналогично другим роутам)
const securityHeaders = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

// Допустимые статусы для совместимости с админкой
type ReviewStatus = "Brouillon" | "Publié" | "Masqué";

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
        "id, client_name, rating, comment, date, admin_reply, admin_reply_author, admin_reply_date"
      )
      .eq("status", "Publié")
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    const items = (data || []).map((row: any) => ({
      id: row.id,
      clientName: row.client_name,
      rating: row.rating ?? null,
      comment: row.comment ?? null,
      date: row.date ?? null,
      adminReply: row.admin_reply ?? null,
      adminReplyAuthor: row.admin_reply_author ?? null,
      adminReplyDate: row.admin_reply_date ?? null,
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
    let parsedBody: any;
    try {
      parsedBody = await incomingRequest.json();
    } catch {
      return NextResponse.json(
        { error: "ValidationError", details: { body: "Invalid JSON" } },
        { status: 400, headers: securityHeaders }
      );
    }
    if (
      typeof parsedBody?.company === "string" &&
      parsedBody.company.trim().length > 0
    ) {
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

    // 3) Нормализация входных полей
    const payload = {
      clientName: (parsedBody?.clientName ?? "").toString().trim(),
      rating:
        parsedBody?.rating === null || parsedBody?.rating === ""
          ? null
          : Number(parsedBody?.rating),
      comment:
        typeof parsedBody?.comment === "string" &&
        parsedBody.comment.trim().length > 0
          ? parsedBody.comment.trim()
          : null,
    };

    // 4) Валидация
    const validationErrors: Record<string, string> = {};
    if (!payload.clientName) {
      validationErrors.clientName = "Имя обязательно";
    } else if (payload.clientName.length > 120) {
      validationErrors.clientName = "Имя слишком длинное";
    }

    if (payload.rating !== null) {
      if (
        !Number.isFinite(payload.rating) ||
        payload.rating < 1 ||
        payload.rating > 5
      ) {
        validationErrors.rating = "Оценка должна быть числом 1–5 или null";
      }
    }

    if (payload.comment !== null && payload.comment.length > 2000) {
      validationErrors.comment = "Текст отзыва слишком длинный";
    }

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: "ValidationError", details: validationErrors },
        { status: 400, headers: securityHeaders }
      );
    }

    // 5) Сборка записи для БД
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

    // 6) Возвращаем минимально нужные данные
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
