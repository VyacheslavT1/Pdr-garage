"use client";

import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Input,
  Select,
  DatePicker,
  Card,
  Table,
  Tag,
  message,
} from "antd";
import AdminNav from "../shared/AdminNav/AdminNav";
import styles from "./AdminRequests.module.css";

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
  status: "Non traité" | "Traité"; // Статус обработки админом
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

  // ⬇️ новый обработчик: переход на страницу детали заявки
  function handleRowClick(targetRequestId: string) {
    window.location.href = `/admin/requests/${encodeURIComponent(
      targetRequestId
    )}`;
  }

  // 3) Колонки таблицы — без изменений логики и названий
  const tableColumns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 200,
      render: (value: string) => (
        <Text>{new Date(value).toLocaleString()}</Text>
      ),
      sorter: true,
    },
    {
      title: "Client",
      dataIndex: "clientName",
      key: "clientName",
      render: (_: unknown, record: RequestRow) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {record.gender && (
            <span>{record.gender === "male" ? "M." : "Mme"}</span>
          )}
          <span>{record.clientName}</span>
        </div>
      ),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (value: RequestRow["status"]) => (
        <Tag color={value === "Traité" ? "green" : "default"}>{value}</Tag>
      ),
      filters: [
        { text: "Tous", value: "" },
        { text: "Non traité", value: "Non traité" },
        { text: "Traité", value: "Traité" },
      ],
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
        message.error("Session invalide. Veuillez vous reconnecter.");
        return;
      }
      if (!response.ok) {
        throw new Error(`Erreur de chargement: ${response.status}`);
      }
      const payload = (await response.json()) as { items: RequestRow[] };
      setRequestsData(Array.isArray(payload.items) ? payload.items : []);
      message.success("Liste mise à jour");
    } catch (caughtError) {
      const readableMessage =
        caughtError instanceof Error ? caughtError.message : "Erreur inconnue";
      setErrorMessage(readableMessage);
      message.error("Impossible de charger la liste des demandes");
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
          message.error("Session invalide. Veuillez vous reconnecter.");
          return;
        }

        if (!response.ok) {
          throw new Error(`Erreur de chargement: ${response.status}`);
        }

        // Ожидаем структуру { items: RequestRow[] } из API-заглушки
        const payload = (await response.json()) as { items: RequestRow[] };
        setRequestsData(Array.isArray(payload.items) ? payload.items : []);
      } catch (caughtError) {
        const readableMessage =
          caughtError instanceof Error
            ? caughtError.message
            : "Erreur inconnue";
        setErrorMessage(readableMessage);
        message.error("Impossible de charger la liste des demandes");
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
          message.error("Session invalide. Veuillez vous reconnecter.");
          return { items: [] };
        }
        if (!response.ok) {
          throw new Error(`Erreur de chargement: ${response.status}`);
        }
        return (await response.json()) as { items: RequestRow[] };
      })
      .then((payload) => {
        setRequestsData(Array.isArray(payload.items) ? payload.items : []);
        message.success(
          hasQuery
            ? `Résultats trouvés: ${payload.items?.length ?? 0}`
            : "Toutes les demandes sont affichées"
        );
      })
      .catch((caught) => {
        const readable =
          caught instanceof Error ? caught.message : "Erreur inconnue";
        setErrorMessage(readable);
        message.error("Échec de la recherche");
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
          message.error("Session invalide. Veuillez vous reconnecter.");
          return { items: [] };
        }
        if (!response.ok) {
          throw new Error(`Erreur de chargement: ${response.status}`);
        }
        return (await response.json()) as { items: RequestRow[] };
      })
      .then((payload) => {
        setRequestsData(Array.isArray(payload.items) ? payload.items : []);
      })
      .catch((caught) => {
        const readable =
          caught instanceof Error ? caught.message : "Erreur inconnue";
        setErrorMessage(readable);
        message.error("Échec de l’application du filtre de statut");
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
          message.error("Session invalide. Veuillez vous reconnecter.");
          return { items: [] };
        }
        if (!response.ok) {
          throw new Error(`Erreur de chargement: ${response.status}`);
        }
        return (await response.json()) as { items: RequestRow[] };
      })
      .then((payload) => {
        setRequestsData(Array.isArray(payload.items) ? payload.items : []);
        // Небольшая подсказка пользователю
        if (fromDate || toDate) {
          message.success(
            `Plage de dates appliquée: ${fromDate || "—"} → ${toDate || "—"}`
          );
        } else {
          message.success("Demandes pour toutes les dates affichées");
        }
      })
      .catch((caught) => {
        const readable =
          caught instanceof Error ? caught.message : "Erreur inconnue";
        setErrorMessage(readable);
        message.error("Échec de l’application du filtre des dates");
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
        message.error("Session invalide. Veuillez vous reconnecter.");
        return;
      }
      if (response.status === 404) {
        message.error("Demande introuvable (peut-être supprimée).");
        // синхронизируем локальное состояние — уберём её из списка
        setRequestsData((previous) =>
          previous.filter((existing) => existing.id !== requestId)
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      // Локально обновляем статус строки без полного refetch
      setRequestsData((previous) =>
        previous.map((item) =>
          item.id === requestId ? { ...item, status: "Traité" } : item
        )
      );

      message.success(`Demande ${requestId} marquée comme traitée`);
    } catch {
      message.error("Échec de la mise à jour du statut de la demande");
    } finally {
      setProcessingRequestId(null); // снимаем спиннер
    }
  }

  // ⬇️ Новый универсальный обработчик: тумблер статуса
  async function handleToggleProcessed(targetRow: RequestRow) {
    const nextStatus: RequestRow["status"] =
      targetRow.status === "Traité" ? "Non traité" : "Traité";
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
        message.error("Session invalide. Veuillez vous reconnecter.");
        return;
      }
      if (response.status === 404) {
        message.error("Demande introuvable (peut-être supprimée).");
        setRequestsData((previous) =>
          previous.filter((existing) => existing.id !== targetRow.id)
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      // Локально обновляем статус
      setRequestsData((previous) =>
        previous.map((item) =>
          item.id === targetRow.id ? { ...item, status: nextStatus } : item
        )
      );
      message.success(
        nextStatus === "Traité"
          ? `Demande ${targetRow.id} marquée comme traitée`
          : `Statut de la demande ${targetRow.id} remis à « Traité »`
      );
    } catch {
      message.error("Échec de la modification du statut de la demande");
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
        message.error("Session invalide. Veuillez vous reconnecter.");
        return;
      }
      if (response.status === 404) {
        message.error("Demande introuvable (peut-être déjà supprimée).");
        // синхронизируем локально: уберём строку, если её уже нет на бэкенде
        setRequestsData((previous) =>
          previous.filter((existing) => existing.id !== targetRequestId)
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      // Успех: удаляем строку без дополнительного refetch
      setRequestsData((previous) =>
        previous.filter((existing) => existing.id !== targetRequestId)
      );
      message.success("Demande supprimée");
    } catch {
      message.error("Échec de la suppression de la demande");
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
      message.error("Échec de la génération du CSV");
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
          Demandes
        </Title>

        <div className={styles.actions}>
          <Button onClick={handleExportRequestsCsvClick}>Exporter</Button>
          <Button onClick={refetchRequestsNow} loading={isTableLoading}>
            Actualiser
          </Button>
        </div>
      </div>

      {/* Панель фильтров/поиска — сейчас только вызывает заглушки-обработчики */}
      <div className={styles.filters}>
        <Input.Search
          placeholder="Recherche par nom ou téléphone"
          allowClear
          onSearch={handleSearchByNameOrPhone}
          enterButton="Rechercher"
        />

        <Select
          placeholder="Statut"
          style={{ width: 200 }}
          onChange={handleFilterByStatus}
          options={[
            { value: "", label: "Tous" },
            { value: "Non traité", label: "Non traité" },
            { value: "Traité", label: "Traité" },
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
          onRow={(record) => ({
            onClick: (mouseEvent) => {
              // игнорируем клики по интерактивным элементам внутри строки
              const targetElement = mouseEvent.target as HTMLElement;
              const interactiveSelector =
                'a, button, [role="button"], input, textarea, select, .ant-btn, .ant-popover, .ant-image';
              if (targetElement.closest(interactiveSelector)) return;

              handleRowClick(record.id);
            },
            style: { cursor: "pointer" },
          })}
        />
      </Card>

      {/* Опционально: техническая подсказка об ошибке под таблицей */}
      {errorMessage && (
        <Text type="danger">Informations techniques: {errorMessage}</Text>
      )}
    </div>
  );
}
