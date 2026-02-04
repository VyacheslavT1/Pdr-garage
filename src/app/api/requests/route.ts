// Назначение: обработчик /api/requests
// - GET: возвращает массив заявок (с сортировкой, фильтрами, пагинацией)
// - POST: создаёт новую заявку (публичная форма, без авторизации)
// - PATCH: меняет статус заявки
// - DELETE: удаляет заявку и привязанные файлы из Supabase Storage

import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/api/supabase/server";
import { securityHeaders } from "@/shared/api/next/securityHeaders";
import type { RequestItem } from "@/modules/requests/model/types";
import { mapRowToRequestItem } from "@/modules/requests/lib/mappers";
import { normalizeAndValidateCreate } from "@/modules/requests/model/validation";
import { normalizeIncomingAttachments } from "@/modules/requests/lib/attachments";
import {
  populateAttachmentUrls,
  uploadAttachmentsForRequest,
} from "@/modules/requests/lib/storage";
import { hasAccessTokenCookie } from "@/modules/auth/lib/cookies";

const ATTACHMENTS_BUCKET =
  process.env.SUPABASE_ATTACHMENTS_BUCKET || "requests";

// ---------- GET /api/requests ----------
export async function GET(incomingRequest: Request) {
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = hasAccessTokenCookie(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  try {
    const url = new URL(incomingRequest.url);
    const rawPage = Number(url.searchParams.get("page") || 1);
    const rawPageSize = Number(url.searchParams.get("pageSize") || 10);
    const rawOrder = (url.searchParams.get("order") || "desc").toLowerCase();
    const rawStatus = url.searchParams.get("status");
    const rawSearch = url.searchParams.get("search");
    const rawFrom = url.searchParams.get("from");
    const rawTo = url.searchParams.get("to");

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const pageSize =
      Number.isFinite(rawPageSize) && rawPageSize > 0 && rawPageSize <= 100
        ? rawPageSize
        : 10;
    const order: "asc" | "desc" = rawOrder === "asc" ? "asc" : "desc";

    const allowedStatuses = ["Non traité", "Traité"] as const;
    const normalizedStatus: RequestItem["status"] | null =
      typeof rawStatus === "string" &&
      (allowedStatuses as readonly string[]).includes(rawStatus)
        ? (rawStatus as RequestItem["status"])
        : null;

    const hasSearch =
      typeof rawSearch === "string" && rawSearch.trim().length > 0;
    const searchValue = hasSearch ? rawSearch!.trim() : "";

    const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
    const hasFrom = typeof rawFrom === "string" && ymdRegex.test(rawFrom);
    const hasTo = typeof rawTo === "string" && ymdRegex.test(rawTo);

    const fromIso = hasFrom ? `${rawFrom}T00:00:00.000Z` : null;
    const toIso = hasTo ? `${rawTo}T23:59:59.999Z` : null;

    let query = supabaseServer
      .from("requests")
      .select("*")
      .order("created_at", { ascending: order === "asc" });

    if (normalizedStatus) {
      query = query.eq("status", normalizedStatus);
    }

    if (fromIso) query = query.gte("created_at", fromIso);
    if (toIso) query = query.lte("created_at", toIso);

    if (hasSearch) {
      query = query.or(
        `client_name.ilike.%${searchValue}%,phone.ilike.%${searchValue}%`
      );
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const itemsWithRawAttachments: RequestItem[] = (data || []).map(
      mapRowToRequestItem
    );

    const items: RequestItem[] = await Promise.all(
      itemsWithRawAttachments.map(async (item) => {
        if (!Array.isArray(item.attachments) || item.attachments.length === 0) {
          return item;
        }

        return {
          ...item,
          attachments: await populateAttachmentUrls(item.attachments),
        };
      })
    );

    return NextResponse.json(
      { items },
      { status: 200, headers: securityHeaders }
    );
  } catch (caughtError) {
    const readable =
      caughtError instanceof Error ? caughtError.message : "Unknown error";

    // логгируем ошибку на сервере
    console.error({
      type: "request_error",
      route: "/api/requests",
      method: "GET",
      status: 500,
      errorMessage: readable,
      errorStack: caughtError instanceof Error ? caughtError.stack : null,
    });
    return NextResponse.json(
      { error: "ServerError", details: readable },
      { status: 500, headers: securityHeaders }
    );
  }
}

// ---------- POST /api/requests (публичное создание заявки) ----------
export async function POST(incomingRequest: Request) {
  const localSecurityHeaders = securityHeaders;

  let parsedBody: unknown = null;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    // игнорируем некорректный JSON
    console.error({
      type: "request_error",
      route: "/api/requests",
      method: "POST",
      status: 400,
      errorMessage: "Invalid JSON",
    });

    return NextResponse.json(
      { error: "ValidationError", details: { body: "Invalid JSON" } },
      { status: 400, headers: localSecurityHeaders }
    );
  }

  const pb = (parsedBody ?? {}) as Record<string, unknown>;

  // honeypot
  if (typeof pb.company === "string" && pb.company.trim().length > 0) {
    return new NextResponse(null, {
      status: 204,
      headers: localSecurityHeaders,
    });
  }

  // rate-limit (in-memory)
  type RateLimitBucket = { count: number; windowStart: number };

  const globalForRateLimit = globalThis as unknown as {
    __requestsRateLimitStore?: Map<string, RateLimitBucket>;
  };

  if (!globalForRateLimit.__requestsRateLimitStore) {
    globalForRateLimit.__requestsRateLimitStore = new Map<
      string,
      RateLimitBucket
    >();
  }

  const rateLimitStore = globalForRateLimit.__requestsRateLimitStore;

  const forwardedHeader = incomingRequest.headers.get("x-forwarded-for") || "";
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
      // логгируем событие превышения лимита на сервере
      console.error({
        type: "rate_limit_exceeded",
        route: "/api/requests",
        method: "POST",
        status: 429,
        clientIp,
        errorMessage: "Rate limit exceeded",
      });

      return NextResponse.json(
        { error: "TooManyRequests" },
        { status: 429, headers: localSecurityHeaders }
      );
    }
    existingBucket.count += 1;
  }

  const { payload: incomingPayload, errors: validationErrors } =
    normalizeAndValidateCreate(parsedBody);
  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: localSecurityHeaders }
    );
  }

  // attachments из тела запроса (после processAttachmentsBeforeSubmit на клиенте)
  const normalizedAttachments = normalizeIncomingAttachments(
    (pb as { attachments?: unknown }).attachments
  );

  const generatedRequestId = `rq_${crypto.randomUUID()}`;

  // uploadAttachmentsForRequest сейчас просто возвращает attachments как есть
  const uploadedAttachments = await uploadAttachmentsForRequest(
    generatedRequestId,
    normalizedAttachments || []
  );

  const storagePaths =
    uploadedAttachments
      .map((att) => att.storagePath)
      .filter((p): p is string => typeof p === "string" && p.length > 0) ?? [];

  const newRequestItemForFirestore: RequestItem = {
    id: generatedRequestId,
    createdAt: new Date().toISOString(),
    clientName: incomingPayload.clientName,
    phone: incomingPayload.phone,
    email: incomingPayload.email,
    comment: incomingPayload.comment,
    status: "Non traité",
    attachments: uploadedAttachments,
    gender: incomingPayload.gender,
    storagePaths,
  };

  const { error: insertError } = await supabaseServer.from("requests").insert([
    {
      id: newRequestItemForFirestore.id,
      created_at: newRequestItemForFirestore.createdAt,
      client_name: newRequestItemForFirestore.clientName,
      gender: newRequestItemForFirestore.gender ?? null,
      phone: newRequestItemForFirestore.phone,
      email: newRequestItemForFirestore.email,
      comment: newRequestItemForFirestore.comment,
      status: newRequestItemForFirestore.status,
      attachments: newRequestItemForFirestore.attachments ?? [],
    },
  ]);

  if (insertError) {
    return NextResponse.json(
      { error: "ServerError", details: insertError.message },
      { status: 500, headers: localSecurityHeaders }
    );
  }

  return NextResponse.json(
    { item: newRequestItemForFirestore },
    { status: 201, headers: localSecurityHeaders }
  );
}

// ---------- PATCH /api/requests?id=<id> ----------
export async function PATCH(incomingRequest: Request) {
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = hasAccessTokenCookie(cookieHeader);
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
      {
        error: "ValidationError",
        details: { id: "L’identifiant est obligatoire" },
      },
      { status: 400, headers: securityHeaders }
    );
  }

  let parsedBody: unknown = null;
  try {
    const raw = await incomingRequest.text();
    parsedBody = raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    // игнорируем некорректный JSON
  }

  const p = (parsedBody ?? {}) as Record<string, unknown>;
  const requestedStatus: RequestItem["status"] =
    p.status === "Non traité" || p.status === "Traité"
      ? (p.status as RequestItem["status"])
      : "Traité";

  try {
    const { data, error } = await supabaseServer
      .from("requests")
      .update({ status: requestedStatus })
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

    const updatedItem: RequestItem = mapRowToRequestItem(data);
    if (Array.isArray(updatedItem.attachments) && updatedItem.attachments.length > 0) {
      updatedItem.attachments = await populateAttachmentUrls(
        updatedItem.attachments
      );
    }

    return NextResponse.json(
      { item: updatedItem },
      { status: 200, headers: securityHeaders }
    );
  } catch (caughtError) {
    const readable =
      caughtError instanceof Error ? caughtError.message : "Unknown error";

    // логгируем ошибку на сервере
    console.error({
      type: "request_error",
      route: "/api/requests",
      method: "PATCH",
      status: 500,
      requestedId: idParam,
      errorMessage: readable,
      errorStack: caughtError instanceof Error ? caughtError.stack : null,
    });

    return NextResponse.json(
      { error: "ServerError", details: readable },
      { status: 500, headers: securityHeaders }
    );
  }
}

// ---------- DELETE /api/requests?id=<id> ----------
export async function DELETE(incomingRequest: Request) {
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = hasAccessTokenCookie(cookieHeader);
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
      {
        error: "ValidationError",
        details: { id: "L’identifiant est obligatoire" },
      },
      { status: 400, headers: securityHeaders }
    );
  }

  try {
    const requestsTable = supabaseServer.from("requests");
    const { data: existingRequest, error: selectError } = await requestsTable
      .select("id, attachments")
      .eq("id", idParam)
      .single();

    if (selectError && /no rows|Row not found/i.test(selectError.message)) {
      return NextResponse.json(
        { error: "NotFound" },
        { status: 404, headers: securityHeaders }
      );
    }

    const rawAttachments = (existingRequest?.attachments ?? []) as {
      storagePath?: string;
    }[];

    const attachmentPaths: string[] = rawAttachments
      .map((att) => att.storagePath)
      .filter((p): p is string => typeof p === "string" && p.length > 0);

    if (attachmentPaths.length > 0) {
      const { error: storageError } = await supabaseServer.storage
        .from(ATTACHMENTS_BUCKET)
        .remove(attachmentPaths);

      if (storageError) {
        return NextResponse.json(
          { error: "ServerError", details: storageError.message },
          { status: 500, headers: securityHeaders }
        );
      }
    }

    const { error } = await requestsTable
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

    return new NextResponse(null, {
      status: 204,
      headers: securityHeaders,
    });
  } catch (caughtError) {
    const readable =
      caughtError instanceof Error ? caughtError.message : "Unknown error";

    // логгируем ошибку на сервере
    console.error({
      type: "request_error",
      route: "/api/requests",
      method: "DELETE",
      status: 500,
      requestedId: idParam,
      errorMessage: readable,
      errorStack: caughtError instanceof Error ? caughtError.stack : null,
    });

    return NextResponse.json(
      { error: "ServerError", details: readable },
      { status: 500, headers: securityHeaders }
    );
  }
}

export const dynamic = "force-dynamic";
