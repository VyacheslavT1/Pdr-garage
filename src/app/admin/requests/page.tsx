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
  message,
  Tag,
  Popconfirm,
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
  comment?: string | null; // Комментарий (опционально)
  status: "Не обработано" | "Обработано"; // Статус обработки админом
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
      title: "Имя",
      dataIndex: "clientName",
      key: "clientName",
      ellipsis: true,
    },
    {
      title: "Телефон",
      dataIndex: "phone",
      key: "phone",
      width: 180,
      render: (value: string) => <a href={`tel:${value}`}>{value}</a>,
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

          {/* Отметить обработанной — оставляем как есть */}
          <Button
            size="small"
            type="primary"
            onClick={() => handleMarkProcessed(record.id)}
            loading={processingRequestId === record.id} // спиннер на конкретной строке
            disabled={
              record.status === "Обработано" ||
              processingRequestId === record.id
            } // нельзя кликать повторно
          >
            Отметить обработанной
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

  // 6) Обработчики верхних элементов управления (оставляем заглушками)
  function handleExportCsvClick() {
    message.info("Экспорт заявок (заглушка)");
  }

  function handleSearchByNameOrPhone(value: string) {
    message.info(`Поиск по имени/телефону: ${value || "—"}`);
  }

  function handleFilterByStatus(statusValue: string) {
    message.info(`Фильтр по статусу: ${statusValue || "все"}`);
  }

  function handleFilterByDateRange(_: unknown, dateStrings: [string, string]) {
    const [fromDate, toDate] = dateStrings || [];
    message.info(`Диапазон дат: ${fromDate || "—"} → ${toDate || "—"}`);
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
          <Button onClick={handleExportCsvClick}>Экспорт</Button>
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
