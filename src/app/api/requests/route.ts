// Назначение: обработчик GET /api/requests
// - Возвращает массив заявок
// - Защищён: без cookie access_token вернёт 401 (как и раздел /admin/**)
// - Возвращает JSON с безопасными заголовками

import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

// 1) Единые заголовки безопасности для всех ответов
const securityHeaders = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

// 2) Тип одной записи заявки — синхронизирован с таблицей на /admin/requests
type RequestItem = {
  id: string; // уникальный идентификатор
  createdAt: string; // дата создания (ISO)
  clientName: string; // имя клиента (из формы)
  gender?: "male" | "female";
  phone: string; // телефон (из формы)
  email: string;
  comment?: string | null; // комментарий (опционально)
  status: "Non traité" | "Traité"; // статус обработки в админке
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    dataUrl?: string | null; // для изображений — превью (data:image/*;base64,...)
  }>;
};

// 4) Обработчик GET /api/requests (с сортировкой, пагинацией, статусом, поиском и диапазоном дат)
export async function GET(incomingRequest: Request) {
  // 1) Авторизация по cookie (как у тебя было)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  try {
    // 2) Разбор query-параметров (без переименований твоих переменных)
    const url = new URL(incomingRequest.url);
    const rawPage = Number(url.searchParams.get("page") || 1);
    const rawPageSize = Number(url.searchParams.get("pageSize") || 10);
    const rawOrder = (url.searchParams.get("order") || "desc").toLowerCase();
    const rawStatus = url.searchParams.get("status"); // "Не обработано" | "Обработано" | null
    const rawSearch = url.searchParams.get("search"); // строка или null
    const rawFrom = url.searchParams.get("from"); // YYYY-MM-DD или null
    const rawTo = url.searchParams.get("to"); // YYYY-MM-DD или null

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const pageSize =
      Number.isFinite(rawPageSize) && rawPageSize > 0 && rawPageSize <= 100
        ? rawPageSize
        : 10;
    const order: "asc" | "desc" = rawOrder === "asc" ? "asc" : "desc";

    const allowedStatuses: RequestItem["status"][] = ["Non traité", "Traité"];
    const normalizedStatus =
      typeof rawStatus === "string" &&
      allowedStatuses.includes(rawStatus as any)
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

    // 3) Базовый запрос к Supabase (public.requests), сортировка по created_at
    //    В БД: created_at, client_name, ... (snake_case)
    //    В ответе: createdAt, clientName, ... (camelCase) — маппим после выборки
    let query = supabaseServer
      .from("requests")
      .select("*")
      .order("created_at", { ascending: order === "asc" });

    // 4) Фильтр по статусу (если передан)
    if (normalizedStatus) {
      query = query.eq("status", normalizedStatus);
    }

    // 5) Фильтры по дате (если переданы границы)
    if (fromIso) query = query.gte("created_at", fromIso);
    if (toIso) query = query.lte("created_at", toIso);

    // 6) Поиск по имени/телефону (OR). Используем ilike с шаблоном %...%
    if (hasSearch) {
      // client_name ILIKE %term% OR phone ILIKE %term%
      query = query.or(
        `client_name.ilike.%${searchValue}%,phone.ilike.%${searchValue}%`
      );
    }

    // 7) Пагинация (range — включительно по end)
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    // 8) Выполняем запрос
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    // 9) Маппинг snake_case → camelCase под твой контракт (RequestItem)
    const items: RequestItem[] = (data || []).map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      clientName: row.client_name,
      gender: row.gender ?? undefined,
      phone: row.phone,
      email: row.email,
      comment: row.comment ?? null,
      status: row.status,
      attachments: Array.isArray(row.attachments)
        ? row.attachments
        : row.attachments ?? [],
    }));

    return NextResponse.json(
      { items },
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

// ---------- POST /api/requests (публичное создание заявки) ----------
// ВАЖНО: этот эндпоинт БЕЗ авторизации — его вызывает публичная форма сайта.
export async function POST(incomingRequest: Request) {
  // Локальные техзаголовки как в других методах (мы их не выносим — без рефакторинга)
  const localSecurityHeaders = {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  };

  // 1) Простая антиспам-проверка: "медовый горшок" — скрытое поле в форме должно быть ПУСТЫМ.
  //    Предлагаем имя поля "company" (или любое другое скрытое).
  //    Боты часто заполняют все поля — в таком случае мы тихо возвращаем 204 и НИЧЕГО не сохраняем.
  let parsedBody: any = null;
  try {
    parsedBody = await incomingRequest.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", details: { body: "Invalid JSON" } },
      { status: 400, headers: localSecurityHeaders }
    );
  }
  if (
    typeof parsedBody?.company === "string" &&
    parsedBody.company.trim().length > 0
  ) {
    // Тихий отказ: не подсказываем ботам, что поле было ловушкой
    return new NextResponse(null, {
      status: 204,
      headers: localSecurityHeaders,
    });
  }

  // 2) Простейший rate-limit по IP, чтобы не зафлудили (in-memory, только для dev/preview)
  //    ОКНО = 5 минут, ЛИМИТ = 8 заявок с одного IP.
  //    В проде лучше вынести в Redis/Upstash либо использовать готовый middleware.
  //    Не рефакторим: объявляем локальное хранилище, если его ещё нет.
  // @ts-ignore - прикрепим на глобал, чтобы переживать горячие перезапуски dev-сервера
  // 🔒 Тип корзины для лимита
  type RateLimitBucket = { count: number; windowStart: number };

  // ✅ Безопасно «расширяем» globalThis в рамках этого файла (без .d.ts)
  const globalForRateLimit = globalThis as unknown as {
    __requestsRateLimitStore?: Map<string, RateLimitBucket>;
  };

  // Инициализируем один раз (переживает HMR/fast refresh в dev)
  if (!globalForRateLimit.__requestsRateLimitStore) {
    globalForRateLimit.__requestsRateLimitStore = new Map<
      string,
      RateLimitBucket
    >();
  }

  // Рабочее хранилище для кода ниже — тип строго известен
  const rateLimitStore = globalForRateLimit.__requestsRateLimitStore!;

  // Определяем IP (за прокси/верчелем берём первый из X-Forwarded-For, иначе remote address недоступен)
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
      return NextResponse.json(
        { error: "TooManyRequests" },
        { status: 429, headers: localSecurityHeaders }
      );
    }
    existingBucket.count += 1;
  }

  // 3) Извлекаем и нормализуем поля формы (те, что показываем в админке)
  const incomingPayload = {
    clientName: (parsedBody?.clientName ?? "").toString().trim(),
    phone: (parsedBody?.phone ?? "").toString().trim(),
    comment:
      typeof parsedBody?.comment === "string"
        ? parsedBody.comment.trim()
        : null,
    email: (parsedBody?.email ?? "").toString().trim(),
  };

  // 4) Валидация (минимально достаточная под текущую таблицу)
  const validationErrors: Record<string, string> = {};

  if (!incomingPayload.clientName) {
    validationErrors.clientName = "Le nom est obligatoire";
  } else if (incomingPayload.clientName.length > 120) {
    validationErrors.clientName = "Le nom est trop long";
  }

  // Телефон: разрешим + цифры, пробелы, дефисы, скобки; приведём к компактному виду для сохранения
  if (!incomingPayload.phone) {
    validationErrors.phone = "Le numéro de téléphone est obligatoire";
  } else {
    const rawPhone = incomingPayload.phone;
    const normalizedPhone = rawPhone.replace(/[^\d+]/g, ""); // оставим + и цифры
    if (!/^\+?\d{6,20}$/.test(normalizedPhone)) {
      validationErrors.phone = "Format du numéro de téléphone invalide";
    } else {
      incomingPayload.phone = normalizedPhone;
    }
  }

  if (incomingPayload.comment && incomingPayload.comment.length > 1000) {
    validationErrors.comment = "Le commentaire est trop long";
  }

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: localSecurityHeaders }
    );
  }

  // ⬇️ ПОДДЕРЖКА ГЕНДЕРА: принимаем из тела запроса 'male' | 'female' (опционально)
  const rawGenderValue =
    typeof parsedBody?.gender === "string"
      ? parsedBody.gender.trim().toLowerCase()
      : undefined;

  // Если поле передано, но значение не из допустимых — вернём ошибку валидации
  let normalizedGenderValue: "male" | "female" | undefined = undefined;
  if (rawGenderValue !== undefined) {
    if (rawGenderValue === "male" || rawGenderValue === "female") {
      normalizedGenderValue = rawGenderValue;
    } else {
      validationErrors.gender = "Valeur de genre non autorisée";
    }
  }

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: localSecurityHeaders }
    );
  }

  // ⬇️ ПРИЁМ вложений из тела запроса: ожидаем attachments как массив объектов
  const incomingAttachmentsRaw = Array.isArray(parsedBody?.attachments)
    ? parsedBody.attachments
    : [];

  // Нормализуем и фильтруем вложения (в демо сохраняем только изображения с dataUrl)
  const normalizedAttachments: RequestItem["attachments"] =
    incomingAttachmentsRaw
      .slice(0, 10) // ограничим до 10 на всякий случай
      .map((it: any) => ({
        id: typeof it?.id === "string" ? it.id : `att_${crypto.randomUUID()}`,
        name: typeof it?.name === "string" ? it.name : "file",
        type:
          typeof it?.type === "string" ? it.type : "application/octet-stream",
        size: Number.isFinite(it?.size) ? Number(it.size) : 0,
        dataUrl:
          typeof it?.dataUrl === "string" &&
          it.dataUrl.startsWith("data:image/")
            ? it.dataUrl
            : null,
      }))
      // оставим только изображения ИЛИ метаданные с null-превью (на будущее)
      .filter(
        (att: { dataUrl?: string | null }) =>
          att.dataUrl === null ||
          (typeof att.dataUrl === "string" &&
            att.dataUrl.startsWith("data:image/"))
      );

  // ---------- ⬇️ НОВЫЙ БЛОК: сохраняем вложения в Supabase Storage (bucket: requests)
  // Генерируем id заявки (как и раньше)
  const generatedRequestId = `rq_${crypto.randomUUID()}`;

  // Если нужно уметь "выключать" загрузки — оставляем флаг как есть
  const isStorageUploadsDisabled =
    process.env.DISABLE_STORAGE_UPLOADS === "true";

  let uploadedAttachments: RequestItem["attachments"];

  if (isStorageUploadsDisabled) {
    // Ничего не грузим, сохраняем как есть (base64 или null)
    uploadedAttachments = normalizedAttachments || [];
  } else {
    const storageBucketName = "requests";

    // ⚠️ функция с тем же именем, что у тебя раньше — чтобы не менять вызовы
    async function saveImageDataUrlToStorage(args: {
      requestId: string;
      attachmentId: string;
      name: string;
      type: string;
      dataUrl: string; // "data:image/png;base64,..."
    }): Promise<{ publicUrl: string; bytes: number }> {
      // отделяем метаданные от base64
      const commaIndex = args.dataUrl.indexOf(",");
      if (commaIndex < 0) {
        throw new Error("Invalid dataUrl format");
      }
      const base64Part = args.dataUrl.slice(commaIndex + 1);
      const buffer = Buffer.from(base64Part, "base64");

      // безопасное имя файла
      const safeName = args.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      // путь хранения: сгруппировано по заявке
      const objectPath = `requests/${args.requestId}/${args.attachmentId}_${safeName}`;

      // загружаем в Supabase Storage
      const { error: uploadError } = await supabaseServer.storage
        .from(storageBucketName)
        .upload(objectPath, buffer, {
          contentType: args.type || "application/octet-stream",
          upsert: true, // разрешим перезапись, чтобы не падать при повторе
        });

      if (uploadError) {
        throw uploadError;
      }

      // получаем публичный URL
      const { data: publicData } = supabaseServer.storage
        .from(storageBucketName)
        .getPublicUrl(objectPath);

      return { publicUrl: publicData.publicUrl, bytes: buffer.byteLength };
    }

    uploadedAttachments = await Promise.all(
      (normalizedAttachments || []).map(async (att) => {
        if (att.dataUrl && typeof att.dataUrl === "string") {
          try {
            const { publicUrl, bytes } = await saveImageDataUrlToStorage({
              requestId: generatedRequestId,
              attachmentId: att.id,
              name: att.name,
              type: att.type,
              dataUrl: att.dataUrl,
            });
            return {
              ...att,
              size: Number.isFinite(att.size) ? att.size : bytes,
              dataUrl: publicUrl, // теперь тут публичная ссылка с Supabase
            };
          } catch {
            // не роняем весь запрос из-за одного файла
            return { ...att, dataUrl: null };
          }
        }
        return att;
      })
    );
  }

  // ---------- ⬇️ НОВЫЙ БЛОК: собираем объект заявки и пишем в Supabase (PostgreSQL)
  const newRequestItemForFirestore: RequestItem = {
    id: generatedRequestId,
    createdAt: new Date().toISOString(),
    clientName: incomingPayload.clientName,
    phone: incomingPayload.phone,
    email: incomingPayload.email,
    comment: incomingPayload.comment,
    status: "Non traité",
    attachments: uploadedAttachments,
    gender: normalizedGenderValue,
  };

  // ✅ Сохраняем заявку в Supabase (маппим camelCase → snake_case колонок таблицы)
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

  // ⬇️ Отдаём тот же контракт, что и раньше — ничего не меняем
  return NextResponse.json(
    { item: newRequestItemForFirestore },
    { status: 201, headers: localSecurityHeaders }
  );
}

// ---------- PATCH /api/requests?id=<id> (смена статуса заявки) ----------
export async function PATCH(incomingRequest: Request) {
  // 1) Авторизация по cookie (как в GET)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }

  // 2) Берём id заявки из query (?id=...)
  const currentUrl = new URL(incomingRequest.url);
  const idParam = currentUrl.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json(
      {
        error: "ValidationError",
        details: { id: "L’identifiant est obligatoire" },
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }

  // 3) Пытаемся прочитать желаемый статус из тела запроса (опционально)
  //    По умолчанию переводим в 'Обработано'
  let parsedBody: any = null;
  try {
    const raw = await incomingRequest.text(); // тело может быть пустым
    parsedBody = raw ? JSON.parse(raw) : null;
  } catch {
    // игнорируем некорректный JSON — используем значение по умолчанию
  }

  const requestedStatus =
    parsedBody?.status === "Non traité" || parsedBody?.status === "Traité"
      ? (parsedBody.status as RequestItem["status"])
      : ("Traité" as RequestItem["status"]); // статус по умолчанию

  try {
    // Обновляем только поле статуса по id и сразу читаем обновлённую строку
    const { data, error } = await supabaseServer
      .from("requests")
      .update({ status: requestedStatus })
      .eq("id", idParam)
      .select("*")
      .single(); // ожидаем ровно одну запись

    // Если записи с таким id нет — отдаём 404 (поведение сохраняем)
    if (error && /no rows|Row not found/i.test(error.message)) {
      return NextResponse.json(
        { error: "NotFound" },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
            Pragma: "no-cache",
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    }
    if (error) {
      throw new Error(error.message);
    }

    // Маппим snake_case → твой контракт RequestItem (camelCase)
    const updatedItem: RequestItem = {
      id: data.id,
      createdAt: data.created_at,
      clientName: data.client_name,
      gender: data.gender ?? undefined,
      phone: data.phone,
      email: data.email,
      comment: data.comment ?? null,
      status: data.status,
      attachments: Array.isArray(data.attachments)
        ? data.attachments
        : data.attachments ?? [],
    };

    return NextResponse.json(
      { item: updatedItem },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (caughtError) {
    const readable =
      caughtError instanceof Error ? caughtError.message : "Unknown error";
    return NextResponse.json(
      { error: "ServerError", details: readable },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }
}

// ---------- DELETE /api/requests?id=<id> (удаление заявки + файлов Storage) ----------
export async function DELETE(incomingRequest: Request) {
  // 1) Авторизация по cookie (как в GET/PATCH)
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);
  if (!hasAccessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      }
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
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }

  try {
    // Удаляем запись по id и просим вернуть удалённую строку, чтобы понять — была ли она
    const { data, error } = await supabaseServer
      .from("requests")
      .delete()
      .eq("id", idParam)
      .select("id") // вернуть хотя бы id удалённой записи
      .single(); // ожидаем ровно одну запись

    if (error && /no rows|Row not found/i.test(error.message)) {
      // Аналог твоего 404, если записи не было
      return NextResponse.json(
        { error: "NotFound" },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
            Pragma: "no-cache",
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    }
    if (error) {
      throw new Error(error.message);
    }

    // Успех: как и раньше — 204 No Content
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (caughtError) {
    const readable =
      caughtError instanceof Error ? caughtError.message : "Unknown error";
    return NextResponse.json(
      { error: "ServerError", details: readable },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }
}

// 5) Флаг динамики — чтобы Next не кэшировал ответ в dev/SSG
export const dynamic = "force-dynamic";
