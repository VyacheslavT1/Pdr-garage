"use client"; // Клиентская страница: кнопки, фильтры, уведомления

import React, { useEffect, useState } from "react"; // ⬅️ добавили useEffect/useState для загрузки данных
import {
  Typography,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Card,
  Table,
  Tag,
  message,
  Popconfirm,
  Image,
} from "antd";
import AdminNav from "../shared/AdminNav/AdminNav";
import styles from "./AdminRequests.module.scss";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 1) Тип одной заявки (как был). Структура строки таблицы.
type RequestRow = {
  id: string; // Уникальный идентификатор заявки
  createdAt: string; // Дата создания (ISO)
  clientName: string; // Имя клиента (обязательное поле формы)
  phone: string; // Телефон (обязательное поле формы)
  email: string;
  comment?: string | null; // Комментарий (опционально)
  status: "Не обработано" | "Обработано"; // Статус обработки админом
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    dataUrl?: string | null;
  }>;
  gender?: "male" | "female";
};

export default function AdminRequestsPage() {
  // 2) Новые состояния: данные таблицы, индикатор загрузки и текст ошибки.
  //    Названия осмысленные и «длинные», без однобуквенных переменных.
  const [requestsData, setRequestsData] = useState<RequestRow[]>([]); // массив заявок из API
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false); // индикатор загрузки таблицы
  const [errorMessage, setErrorMessage] = useState<string>(""); // текст ошибки (под таблицей)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null
  );
  /*
  Зачем:
  - показываем спиннер именно на кнопке строки, которую помечаем;
  - блокируем повторные клики по этой кнопке.
*/
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(
    null
  );
  /*
  Показываем спиннер на конкретной кнопке "Удалить"
  и блокируем повторные клики, пока идёт запрос.
*/
  // ⬇️ спиннер для обратного действия (возврат в "Не обработано")
  const [revertingRequestId, setRevertingRequestId] = useState<string | null>(
    null
  );

  // 3) Колонки таблицы — без изменений логики и названий
  const tableColumns = [
    {
      title: "Дата",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 200,
      render: (value: string) => (
        <Text>{new Date(value).toLocaleString()}</Text>
      ),
      sorter: true, // обработчик добавим позже, когда появится серверная сортировка
    },

    {
      title: "Клиент",
      dataIndex: "clientName",
      key: "clientName",
      // ⬇️ показываем бейдж гендера слева от имени, если он передан с API
      render: (_: unknown, record: RequestRow) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {record.gender && (
            <span>{record.gender === "male" ? "Г-н" : "Г-жа"}</span>
          )}
          <span>{record.clientName}</span>
        </div>
      ),
    },

    {
      title: "Телефон",
      dataIndex: "phone",
      key: "phone",
      width: 180,
      render: (value: string) => <a href={`tel:${value}`}>{value}</a>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (value: string) => <a href={`email:${value}`}>{value}</a>,
    },
    {
      title: "Комментарий",
      dataIndex: "comment",
      key: "comment",
      ellipsis: true,
      render: (value: string | null | undefined) =>
        value ? <Text>{value}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: "Фотографии",
      dataIndex: "attachments",
      key: "attachments",
      width: 200,
      render: (cellValue: RequestRow["attachments"], record: RequestRow) => {
        const attachments = Array.isArray(record.attachments)
          ? record.attachments
          : [];
        const imagePreviews = attachments.filter(
          (a) => !!a?.dataUrl && typeof a.dataUrl === "string"
        );

        if (imagePreviews.length === 0) {
          return <span style={{ opacity: 0.6 }}>нет</span>;
        }

        // Покажем до 3 миниатюр, остальное — счётчиком
        const previewSlice = imagePreviews.slice(0, 3);
        const hiddenCount = imagePreviews.length - previewSlice.length;

        return (
          <Image.PreviewGroup>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {previewSlice.map((item) => (
                <Image
                  key={item.id}
                  src={item.dataUrl!}
                  alt={item.name}
                  width={48}
                  height={48}
                  style={{ objectFit: "cover", borderRadius: 6 }}
                  placeholder
                />
              ))}
              {hiddenCount > 0 && (
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  +{hiddenCount}
                </span>
              )}
            </div>
          </Image.PreviewGroup>
        );
      },
    },

    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (value: RequestRow["status"]) => (
        <Tag color={value === "Обработано" ? "green" : "default"}>{value}</Tag>
      ),
      filters: [
        { text: "Не обработано", value: "Не обработано" },
        { text: "Обработано", value: "Обработано" },
      ],
    },
    {
      title: "Действия",
      key: "actions",
      width: 260,
      render: (_: unknown, record: RequestRow) => (
        <Space wrap>
          <Button onClick={handleExportRequestsCsvClick}>Экспорт CSV</Button>

          {/* ОДНА кнопка: меняет лейбл и действие по текущему статусу */}
          <Button
            size="small"
            type="primary"
            onClick={() => handleToggleProcessed(record)}
            loading={processingRequestId === record.id}
            disabled={processingRequestId === record.id}
          >
            {record.status === "Обработано"
              ? "Вернуть в «Не обработано»"
              : "Отметить обработанной"}
          </Button>

          {/* ⬇️ Подтверждение удаления + спиннер и блокировка на время запроса */}
          <Popconfirm
            title="Удалить заявку?"
            description={`Действие необратимо. ID: ${record.id}`}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteRequest(record.id)} // фактическое удаление
          >
            <Button
              size="small"
              danger
              loading={deletingRequestId === record.id} // спиннер именно на этой кнопке строки
              disabled={deletingRequestId === record.id} // не даём нажимать повторно
            >
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  // ⬇️ Явный рефетч по клику "Обновить" (без рефакторинга существующего кода)
  async function refetchRequestsNow() {
    const requestAbortController = new AbortController();
    try {
      setIsTableLoading(true);
      setErrorMessage("");
      const response = await fetch("/api/requests", {
        method: "GET",
        credentials: "include",
        signal: requestAbortController.signal,
        headers: { Accept: "application/json" },
      });
      if (response.status === 401) {
        message.error("Сессия недействительна. Войдите заново.");
        return;
      }
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      const payload = (await response.json()) as { items: RequestRow[] };
      setRequestsData(Array.isArray(payload.items) ? payload.items : []);
      message.success("Список обновлён");
    } catch (caughtError) {
      const readableMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "Неизвестная ошибка";
      setErrorMessage(readableMessage);
      message.error("Не удалось загрузить список заявок");
    } finally {
      setIsTableLoading(false);
    }
  }
  // 4) Загрузка данных из защищённого API /api/requests при монтировании страницы
  useEffect(() => {
    const requestAbortController = new AbortController(); // позволит отменить запрос при уходе со страницы

    async function loadRequests() {
      try {
        setIsTableLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/requests", {
          method: "GET",
          credentials: "include", // отправляем cookie access_token
          signal: requestAbortController.signal, // поддержка отмены запроса
          headers: { Accept: "application/json" },
        });

        if (response.status === 401) {
          // Теоретически middleware не пустит сюда без токена; сообщение — на всякий случай
          message.error("Сессия недействительна. Войдите заново.");
          return;
        }

        if (!response.ok) {
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }

        // Ожидаем структуру { items: RequestRow[] } из API-заглушки
        const payload = (await response.json()) as { items: RequestRow[] };
        setRequestsData(Array.isArray(payload.items) ? payload.items : []);
      } catch (caughtError) {
        const readableMessage =
          caughtError instanceof Error
            ? caughtError.message
            : "Неизвестная ошибка";
        setErrorMessage(readableMessage);
        message.error("Не удалось загрузить список заявок");
      } finally {
        setIsTableLoading(false);
      }
    }

    loadRequests();
    return () => requestAbortController.abort(); // отмена запроса при размонтировании
  }, []);

  // 5) Табличные данные: сохраняем имя переменной tableData (без переименований)
  const tableData: RequestRow[] = requestsData;

  function handleSearchByNameOrPhone(value: string) {
    // Пустой запрос — показываем все заявки (без параметра ?search)
    const hasQuery = typeof value === "string" && value.trim().length > 0;
    const baseUrl = "/api/requests";
    const requestUrl = hasQuery
      ? `${baseUrl}?search=${encodeURIComponent(value.trim())}`
      : baseUrl;

    setIsTableLoading(true);
    setErrorMessage("");

    fetch(requestUrl, {
      method: "GET",
      credentials: "include", // cookie access_token для админ-доступа
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (response.status === 401) {
          message.error("Сессия недействительна. Войдите заново.");
          return { items: [] };
        }
        if (!response.ok) {
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        return (await response.json()) as { items: RequestRow[] };
      })
      .then((payload) => {
        setRequestsData(Array.isArray(payload.items) ? payload.items : []);
        message.success(
          hasQuery
            ? `Найдено записей: ${payload.items?.length ?? 0}`
            : "Показаны все заявки"
        );
      })
      .catch((caught) => {
        const readable =
          caught instanceof Error ? caught.message : "Неизвестная ошибка";
        setErrorMessage(readable);
        message.error("Не удалось выполнить поиск");
      })
      .finally(() => {
        setIsTableLoading(false);
      });
  }

  function handleFilterByStatus(statusValue: string) {
    // Пояснение:
    // - пустая строка ("Все") -> запрашиваем без фильтра: /api/requests
    // - конкретный статус -> /api/requests?status=<значение>, обязательно кодируем кириллицу

    const isAllStatusesSelected = !statusValue; // "Все" в вашем Select = пустая строка
    const baseUrl = "/api/requests";
    const requestUrl = isAllStatusesSelected
      ? baseUrl
      : `${baseUrl}?status=${encodeURIComponent(statusValue)}`;

    setIsTableLoading(true);
    setErrorMessage("");

    fetch(requestUrl, {
      method: "GET",
      credentials: "include", // нужны cookie access_token
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (response.status === 401) {
          message.error("Сессия недействительна. Войдите заново.");
          return { items: [] };
        }
        if (!response.ok) {
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        return (await response.json()) as { items: RequestRow[] };
      })
      .then((payload) => {
        setRequestsData(Array.isArray(payload.items) ? payload.items : []);
      })
      .catch((caught) => {
        const readable =
          caught instanceof Error ? caught.message : "Неизвестная ошибка";
        setErrorMessage(readable);
        message.error("Не удалось применить фильтр статуса");
      })
      .finally(() => {
        setIsTableLoading(false);
      });
  }

  function handleFilterByDateRange(_: unknown, dateStrings: [string, string]) {
    // dateStrings приходит как ["YYYY-MM-DD", "YYYY-MM-DD"] или ["", ""], если очистили
    const [fromDate, toDate] = Array.isArray(dateStrings)
      ? dateStrings
      : ["", ""];

    // Собираем URL: /api/requests[?from=YYYY-MM-DD][&to=YYYY-MM-DD]
    const baseUrl = "/api/requests";
    const params: string[] = [];

    if (fromDate) params.push(`from=${encodeURIComponent(fromDate)}`);
    if (toDate) params.push(`to=${encodeURIComponent(toDate)}`);

    const requestUrl = params.length
      ? `${baseUrl}?${params.join("&")}`
      : baseUrl;

    setIsTableLoading(true);
    setErrorMessage("");

    fetch(requestUrl, {
      method: "GET",
      credentials: "include", // нужны cookie access_token
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (response.status === 401) {
          message.error("Сессия недействительна. Войдите заново.");
          return { items: [] };
        }
        if (!response.ok) {
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        return (await response.json()) as { items: RequestRow[] };
      })
      .then((payload) => {
        setRequestsData(Array.isArray(payload.items) ? payload.items : []);
        // Небольшая подсказка пользователю
        if (fromDate || toDate) {
          message.success(
            `Диапазон дат применён: ${fromDate || "—"} → ${toDate || "—"}`
          );
        } else {
          message.success("Показаны заявки за все даты");
        }
      })
      .catch((caught) => {
        const readable =
          caught instanceof Error ? caught.message : "Неизвестная ошибка";
        setErrorMessage(readable);
        message.error("Не удалось применить фильтр по датам");
      })
      .finally(() => {
        setIsTableLoading(false);
      });
  }

  // 7) Обработчики действий по строке (как были)
  async function handleMarkProcessed(requestId: string) {
    try {
      setProcessingRequestId(requestId); // включаем спиннер на нужной строке

      const response = await fetch(
        `/api/requests?id=${encodeURIComponent(requestId)}`,
        {
          method: "PATCH",
          credentials: "include", // отправим httpOnly-cookie
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status: "Обработано" }), // можно не передавать — API по умолчанию ставит 'Обработано'
        }
      );

      if (response.status === 401) {
        message.error("Сессия недействительна. Войдите заново.");
        return;
      }
      if (response.status === 404) {
        message.error("Заявка не найдена (возможно, была удалена).");
        // синхронизируем локальное состояние — уберём её из списка
        setRequestsData((previous) =>
          previous.filter((existing) => existing.id !== requestId)
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Локально обновляем статус строки без полного refetch
      setRequestsData((previous) =>
        previous.map((item) =>
          item.id === requestId ? { ...item, status: "Обработано" } : item
        )
      );

      message.success(`Заявка ${requestId} отмечена обработанной`);
    } catch {
      message.error("Не удалось обновить статус заявки");
    } finally {
      setProcessingRequestId(null); // снимаем спиннер
    }
  }

  // ⬇️ Новый универсальный обработчик: тумблер статуса
  async function handleToggleProcessed(targetRow: RequestRow) {
    const nextStatus: RequestRow["status"] =
      targetRow.status === "Обработано" ? "Не обработано" : "Обработано";
    try {
      setProcessingRequestId(targetRow.id);
      const response = await fetch(
        `/api/requests?id=${encodeURIComponent(targetRow.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      if (response.status === 401) {
        message.error("Сессия недействительна. Войдите заново.");
        return;
      }
      if (response.status === 404) {
        message.error("Заявка не найдена (возможно, была удалена).");
        setRequestsData((previous) =>
          previous.filter((existing) => existing.id !== targetRow.id)
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      // Локально обновляем статус
      setRequestsData((previous) =>
        previous.map((item) =>
          item.id === targetRow.id ? { ...item, status: nextStatus } : item
        )
      );
      message.success(
        nextStatus === "Обработано"
          ? `Заявка ${targetRow.id} отмечена обработанной`
          : `Статус заявки ${targetRow.id} возвращён в «Не обработано»`
      );
    } catch {
      message.error("Не удалось изменить статус заявки");
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function handleDeleteRequest(targetRequestId: string) {
    try {
      setDeletingRequestId(targetRequestId);

      const response = await fetch(
        `/api/requests?id=${encodeURIComponent(targetRequestId)}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );

      if (response.status === 401) {
        message.error("Сессия недействительна. Войдите заново.");
        return;
      }
      if (response.status === 404) {
        message.error("Заявка не найдена (возможно, уже удалена).");
        // синхронизируем локально: уберём строку, если её уже нет на бэкенде
        setRequestsData((previous) =>
          previous.filter((existing) => existing.id !== targetRequestId)
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Успех: удаляем строку без дополнительного refetch
      setRequestsData((previous) =>
        previous.filter((existing) => existing.id !== targetRequestId)
      );
      message.success("Заявка удалена");
    } catch {
      message.error("Не удалось удалить заявку");
    } finally {
      setDeletingRequestId(null);
    }
  }

  // 🔹 Утилита: экранируем ячейки под CSV (кавычки/запятые/переводы строк)
  function escapeCsvCell(inputValue: unknown): string {
    const stringValue =
      inputValue === null || inputValue === undefined ? "" : String(inputValue);
    // Если нет спецсимволов — возвращаем как есть
    if (!/[",\n\r]/.test(stringValue)) return stringValue;
    // Иначе удваиваем кавычки и оборачиваем всё в кавычки
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  // 🔹 Собираем CSV по текущему списку заявок (без запроса на сервер)
  function buildCsvContentFromRequests(currentRequests: RequestRow[]): string {
    // Заголовки колонок CSV — можно расширить при необходимости
    const headerColumns = [
      "id",
      "createdAt",
      "clientGender",
      "clientName",
      "phone",
      "comment",
      "status",
    ];

    const headerLine = headerColumns.map(escapeCsvCell).join(",");

    const dataLines = currentRequests.map((requestItem) => {
      // Формат даты: ISO, чтобы было универсально. При желании можно поставить локальный формат.
      const createdAtIso = requestItem.createdAt;

      return [
        escapeCsvCell(requestItem.id),
        escapeCsvCell(createdAtIso),
        escapeCsvCell(requestItem.gender),
        escapeCsvCell(requestItem.clientName),
        escapeCsvCell(requestItem.phone),
        escapeCsvCell(requestItem.comment ?? ""),
        escapeCsvCell(requestItem.status),
      ].join(",");
    });

    // Соединяем заголовок и строки данных через перевод строк
    return [headerLine, ...dataLines].join("\n");
  }

  // 🔹 Обработчик клика по кнопке «Экспорт CSV»
  function handleExportRequestsCsvClick() {
    try {
      // 1) Формируем текст CSV из текущего состояния таблицы
      const csvContent = buildCsvContentFromRequests(requestsData);

      // 2) Добавляем BOM, чтобы Excel на Windows корректно распознал UTF-8
      const utf8Bom = "\uFEFF";
      const csvWithBom = utf8Bom + csvContent;

      // 3) Создаём Blob и ссылку для скачивания
      const csvBlob = new Blob([csvWithBom], {
        type: "text/csv;charset=utf-8;",
      });

      // Имя файла: requests_YYYYMMDD_HHmm.csv
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const fileName = `requests_${now.getFullYear()}${pad(
        now.getMonth() + 1
      )}${pad(now.getDate())}_${pad(now.getHours())}${pad(
        now.getMinutes()
      )}.csv`;

      const blobUrl = URL.createObjectURL(csvBlob);
      const tempLinkElement = document.createElement("a");
      tempLinkElement.href = blobUrl;
      tempLinkElement.download = fileName;

      // 4) Триггерим скачивание и освобождаем URL
      document.body.appendChild(tempLinkElement);
      tempLinkElement.click();
      document.body.removeChild(tempLinkElement);
      URL.revokeObjectURL(blobUrl);
    } catch {
      message.error("Не удалось сформировать CSV");
    }
  }

  // 8) Разметка страницы: без структурных изменений
  return (
    <div className={styles.pageRoot}>
      {/* Если AdminNav уже подключён на этой странице — оставляй как есть */}
      <AdminNav />
      {/* Шапка: заголовок «Заявки» и действия справа */}
      <div className={styles.headerRow}>
        <Title level={3} className={styles.titleReset}>
          Заявки
        </Title>

        <div className={styles.actions}>
          <Button onClick={handleExportRequestsCsvClick}>Экспорт</Button>
          <Button onClick={refetchRequestsNow} loading={isTableLoading}>
            Обновить
          </Button>
        </div>
      </div>

      {/* Панель фильтров/поиска — сейчас только вызывает заглушки-обработчики */}
      <div className={styles.filters}>
        <Input.Search
          placeholder="Поиск по имени или телефону"
          allowClear
          onSearch={handleSearchByNameOrPhone}
          enterButton="Найти"
        />

        <Select
          placeholder="Статус"
          style={{ width: 200 }}
          onChange={handleFilterByStatus}
          options={[
            { value: "", label: "Все" },
            { value: "Не обработано", label: "Не обработано" },
            { value: "Обработано", label: "Обработано" },
          ]}
        />

        <RangePicker onChange={handleFilterByDateRange} />
      </div>

      {/* Таблица — теперь получает данные из /api/requests и показывает индикатор загрузки */}
      <Card className={styles.tableContainer}>
        <Table<RequestRow>
          columns={tableColumns}
          dataSource={tableData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
          loading={isTableLoading} // ⬅️ индикатор загрузки во время запроса
        />
      </Card>

      {/* Опционально: техническая подсказка об ошибке под таблицей */}
      {errorMessage && (
        <Text type="danger">Техническая информация: {errorMessage}</Text>
      )}
    </div>
  );
}
