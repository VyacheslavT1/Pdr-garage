// src/app/api/reviews/count/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/api/supabase/server";
import { securityHeaders } from "@/shared/api/next/securityHeaders";
import type { ReviewStatus } from "@/modules/reviews/model/types";
import { hasAccessTokenCookie } from "@/modules/auth/lib/cookies";

// Те же безопасные заголовки, что и в остальных роутов (shared)

// Тип статуса — из модуля reviews

export async function GET(incomingRequest: Request) {
  // Авторизация — как у тебя в /api/reviews
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
    const rawStatus = currentUrl.searchParams.get("status");
    const allowedStatuses: ReviewStatus[] = ["Brouillon", "Publié", "Masqué"];
    const targetStatus: ReviewStatus = allowedStatuses.includes(
      rawStatus as ReviewStatus
    )
      ? (rawStatus as ReviewStatus)
      : "Brouillon";

    // Точный счёт без выборки строк
    const { count, error } = await supabaseServer
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", targetStatus);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(
      { count: count ?? 0, status: targetStatus },
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

export const dynamic = "force-dynamic";
