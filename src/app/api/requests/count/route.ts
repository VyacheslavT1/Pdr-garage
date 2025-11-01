// src/app/api/requests/count/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/api/supabase/server";
import { securityHeaders } from "@/shared/api/next/securityHeaders";
import { hasAccessTokenCookie } from "@/modules/auth/lib/cookies";

// Те же заголовки, что в /api/requests — из shared

type RequestStatus = "Non traité" | "Traité";

export async function GET(incomingRequest: Request) {
  // Авторизация — как в твоём /api/requests
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = hasAccessTokenCookie(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  try {
    // По умолчанию считаем «новые» = Non traité; можно передать ?status=Traité
    const url = new URL(incomingRequest.url);
    const rawStatus = url.searchParams.get("status");
    const allowed: RequestStatus[] = ["Non traité", "Traité"];
    const targetStatus: RequestStatus = allowed.includes(
      rawStatus as RequestStatus
    )
      ? (rawStatus as RequestStatus)
      : "Non traité";

    // Точный счёт без выборки строк
    const { count, error } = await supabaseServer
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("status", targetStatus);

    if (error) throw new Error(error.message);

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
