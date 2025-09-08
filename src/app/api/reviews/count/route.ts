// src/app/api/reviews/count/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabaseServer";

// Те же безопасные заголовки, что и в остальных роутов
const securityHeaders = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

type ReviewStatus = "Черновик" | "Опубликовано" | "Скрыто";

export async function GET(incomingRequest: Request) {
  // Авторизация — как у тебя в /api/reviews
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
    const rawStatus = currentUrl.searchParams.get("status");
    const allowedStatuses: ReviewStatus[] = [
      "Черновик",
      "Опубликовано",
      "Скрыто",
    ];
    const targetStatus: ReviewStatus = allowedStatuses.includes(
      rawStatus as ReviewStatus
    )
      ? (rawStatus as ReviewStatus)
      : "Черновик";

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
