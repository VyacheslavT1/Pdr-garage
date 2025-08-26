// Назначение: обработчик GET /api/requests
// - Возвращает массив заявок (заглушка для разработки)
// - Защищён: без cookie access_token вернёт 401 (как и раздел /admin/**)
// - Возвращает JSON с безопасными заголовками

import { NextResponse } from "next/server";

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
  phone: string; // телефон (из формы)
  comment?: string | null; // комментарий (опционально)
  status: "Не обработано" | "Обработано"; // статус обработки в админке
};

// 3) Демо-данные (заглушка). Позже заменим на подключение к БД/бэкенду.
const demoRequests: RequestItem[] = [
  {
    id: "rq_001",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 часа назад
    clientName: "Сергей Кузнецов",
    phone: "+33 6 12 34 56 78",
    comment: "Нужна оценка вмятины на двери",
    status: "Не обработано",
  },
  {
    id: "rq_002",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 дня назад
    clientName: "Anna Dupont",
    phone: "+33 7 98 76 54 32",
    comment: null,
    status: "Обработано",
  },
];

// 4) Обработчик GET /api/requests
export async function GET(incomingRequest: Request) {
  // 4.1) Простейшая проверка наличия access_token в cookies запроса
  const cookieHeader = incomingRequest.headers.get("cookie") || "";
  const hasAccessToken = /(?:^|;\s*)access_token=/.test(cookieHeader);

  if (!hasAccessToken) {
    // 4.2) Без токена — 401 Unauthorized (поведение согласовано с админ-разделом)
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  // 4.3) Возвращаем заглушечные данные
  return NextResponse.json(
    { items: demoRequests },
    { status: 200, headers: securityHeaders }
  );
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
  };

  // 4) Валидация (минимально достаточная под текущую таблицу)
  const validationErrors: Record<string, string> = {};

  if (!incomingPayload.clientName) {
    validationErrors.clientName = "Имя обязательно";
  } else if (incomingPayload.clientName.length > 120) {
    validationErrors.clientName = "Имя слишком длинное";
  }

  // Телефон: разрешим + цифры, пробелы, дефисы, скобки; приведём к компактному виду для сохранения
  if (!incomingPayload.phone) {
    validationErrors.phone = "Телефон обязателен";
  } else {
    const rawPhone = incomingPayload.phone;
    const normalizedPhone = rawPhone.replace(/[^\d+]/g, ""); // оставим + и цифры
    if (!/^\+?\d{6,20}$/.test(normalizedPhone)) {
      validationErrors.phone = "Неверный формат телефона";
    } else {
      incomingPayload.phone = normalizedPhone;
    }
  }

  if (incomingPayload.comment && incomingPayload.comment.length > 1000) {
    validationErrors.comment = "Комментарий слишком длинный";
  }

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json(
      { error: "ValidationError", details: validationErrors },
      { status: 400, headers: localSecurityHeaders }
    );
  }

  // 5) Создаём запись в демо-хранилище (в памяти процесса) со статусом "Не обработано"
  //    Типы RequestItem и массив demoRequests уже объявлены выше в файле — имена НЕ меняем.
  const newRequestItem: RequestItem = {
    id: `rq_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    clientName: incomingPayload.clientName,
    phone: incomingPayload.phone,
    comment: incomingPayload.comment,
    status: "Не обработано",
  };
  demoRequests.unshift(newRequestItem); // добавим в начало, чтобы в списке было видно сразу

  // 6) Отдаём 201 Created с созданной записью
  return NextResponse.json(
    { item: newRequestItem },
    { status: 201, headers: localSecurityHeaders }
  );
}

// ---------- PATCH /api/requests?id=<id> (смена статуса заявки) ----------
export async function PATCH(incomingRequest: Request) {
  // 1) Простая авторизация по cookie (как в GET)
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
      { error: "ValidationError", details: { id: "id обязателен" } },
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
    // тело может быть пустым; не падаем на пустоте
    const raw = await incomingRequest.text();
    parsedBody = raw ? JSON.parse(raw) : null;
  } catch {
    // игнорируем некорректный JSON и пойдём по значению по умолчанию
  }

  const requestedStatus =
    parsedBody?.status === "Не обработано" ||
    parsedBody?.status === "Обработано"
      ? (parsedBody.status as RequestItem["status"])
      : ("Обработано" as RequestItem["status"]); // статус по умолчанию

  // 4) Ищем заявку и обновляем статус
  const foundIndex = demoRequests.findIndex(
    (existing) => existing.id === idParam
  );
  if (foundIndex < 0) {
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

  // Перезаписываем только поле статуса
  const currentItem = demoRequests[foundIndex];
  const updatedItem: RequestItem = { ...currentItem, status: requestedStatus };
  demoRequests[foundIndex] = updatedItem;

  // 5) Отдаём обновлённую запись
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
}

// ---------- DELETE /api/requests?id=<id> (удаление заявки) ----------
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
      { error: "ValidationError", details: { id: "id обязателен" } },
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

  // 3) Ищем заявку
  const foundIndex = demoRequests.findIndex(
    (existing) => existing.id === idParam
  );
  if (foundIndex < 0) {
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

  // 4) Удаляем из демо-хранилища (память процесса)
  demoRequests.splice(foundIndex, 1);

  // 5) 204 No Content (тела нет намеренно)
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// 5) Флаг динамики — чтобы Next не кэшировал ответ в dev/SSG
export const dynamic = "force-dynamic";
