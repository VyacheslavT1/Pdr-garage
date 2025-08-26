"use client"; // Клиентская страница: кнопки, поиск, фильтры, уведомления

import React, { useEffect, useState } from "react"; // ⬅️ добавили useEffect/useState для загрузки
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
  Rate,
  Popconfirm,
} from "antd";
import AdminNav from "../shared/AdminNav/AdminNav";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./AdminReviews.module.scss";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 1) Тип строки таблицы: структура одной записи отзыва.
//    (Без изменений — используем как и раньше)
type ReviewRow = {
  id: string; // Уникальный идентификатор записи
  clientName: string; // Имя клиента (обязательное поле)
  rating?: number | null; // Рейтинг 1–5 (опционально)
  status: "Черновик" | "Опубликовано" | "Скрыто"; // Публикационный статус
  date?: string | null; // Дата отзыва (ISO), может быть пустой
  updatedAt: string; // Дата последнего изменения (ISO)
};

export default function AdminReviewsPage() {
  // 2) Новые состояния: данные таблицы, индикатор загрузки и текст ошибки.
  //    Названия осмысленные и «длинные», как ты просил (никаких однобуквенных).
  const [reviewsData, setReviewsData] = useState<ReviewRow[]>([]); // массив отзывов из API
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false); // индикатор загрузки таблицы
  const [errorMessage, setErrorMessage] = useState<string>(""); // текст ошибки (для подсказки под таблицей)
  const routerInstance = useRouter(); // программная навигация внутри админки
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // 3) Колонки таблицы (как и были — без переименований)
  const tableColumns = [
    {
      title: "Имя",
      dataIndex: "clientName",
      key: "clientName",
      ellipsis: true,
      render: (cellValue: string, currentRecord: ReviewRow) => (
        // Ссылка на форму редактирования конкретного отзыва
        <Link
          href={`/admin/reviews/${currentRecord.id}`}
          aria-label={`Открыть редактирование отзыва ${cellValue}`}
        >
          {cellValue}
        </Link>
      ),
    },

    {
      title: "Рейтинг",
      dataIndex: "rating",
      key: "rating",
      width: 160,
      render: (value: number | null | undefined) =>
        typeof value === "number" ? (
          <Rate disabled value={value} />
        ) : (
          <Text type="secondary">нет</Text>
        ),
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (value: ReviewRow["status"]) => {
        const color =
          value === "Опубликовано"
            ? "green"
            : value === "Черновик"
            ? "default"
            : "orange";
        return <Tag color={color}>{value}</Tag>;
      },
    },
    {
      title: "Дата",
      dataIndex: "date",
      key: "date",
      width: 200,
      render: (value: string | null | undefined) =>
        value ? (
          <Text>{new Date(value).toLocaleDateString()}</Text>
        ) : (
          <Tag color="default">не указана</Tag>
        ),
    },
    {
      title: "Обновлено",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 220,
      render: (value: string) => (
        <Text>{new Date(value).toLocaleString()}</Text>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 260,
      render: (_: unknown, record: ReviewRow) => (
        <Space wrap>
          {/* Заглушки действий — оставляем как есть */}
          <Button
            size="small"
            onClick={() => message.info(`Открыть отзыв: ${record.clientName}`)}
          >
            Редактировать
          </Button>
          <Button
            size="small"
            onClick={() =>
              message.info(`Дублировать отзыв: ${record.clientName}`)
            }
          >
            Дублировать
          </Button>
          <Popconfirm
            title="Удалить отзыв?"
            description={`Действие необратимо. ID: ${record.id}`}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteReview(record.id)}
          >
            <Button
              size="small"
              danger
              loading={deletingReviewId === record.id} // спиннер именно на этой строке
              disabled={deletingReviewId === record.id} // блокируем повторные клики
            >
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 4) Загрузка данных из защищённого API /api/reviews при монтировании страницы
  useEffect(() => {
    const requestAbortController = new AbortController(); // позволит отменить запрос при анмаунте

    async function loadReviews() {
      try {
        setIsTableLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/reviews", {
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

        // Ожидаем структуру { items: ReviewRow[] } из API-заглушки
        const payload = (await response.json()) as { items: ReviewRow[] };
        setReviewsData(Array.isArray(payload.items) ? payload.items : []);
      } catch (caughtError) {
        const readableMessage =
          caughtError instanceof Error
            ? caughtError.message
            : "Неизвестная ошибка";
        setErrorMessage(readableMessage);
        message.error("Не удалось загрузить список отзывов");
      } finally {
        setIsTableLoading(false);
      }
    }

    loadReviews();
    return () => requestAbortController.abort(); // отмена запроса при уходе со страницы
  }, []);

  // 5) Сохраняем прежнее имя переменной tableData (ничего не переименовываем):
  const tableData: ReviewRow[] = reviewsData;

  // 6) Обработчики верхних элементов управления (оставляем без изменений)
  function handleCreateReviewClick() {
    // Переход на форму создания нового отзыва
    routerInstance.push("/admin/reviews/new");
  }

  function handleSearchByName(value: string) {
    message.info(`Поиск по имени: ${value || "—"}`);
  }

  function handleFilterByStatus(statusValue: string) {
    message.info(`Фильтр по статусу: ${statusValue || "все"}`);
  }

  function handleFilterByRating(ratingValue: number) {
    message.info(`Фильтр по рейтингу: ${ratingValue || "все"}`);
  }

  function handleFilterByDateRange(_: unknown, dateStrings: [string, string]) {
    const [fromDate, toDate] = dateStrings || [];
    message.info(`Диапазон даты: ${fromDate || "—"} → ${toDate || "—"}`);
  }

  async function handleDeleteReview(targetReviewId: string) {
    try {
      setDeletingReviewId(targetReviewId); // включаем спиннер на нужной строке

      const response = await fetch(
        `/api/reviews?id=${encodeURIComponent(targetReviewId)}`,
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
        message.error("Отзыв не найден (возможно, уже удалён).");
        // синхронизируем локально на всякий случай
        setReviewsData((previous) =>
          previous.filter((existing) => existing.id !== targetReviewId)
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Успешно: убираем строку без полного refetch
      setReviewsData((previous) =>
        previous.filter((existing) => existing.id !== targetReviewId)
      );
      message.success("Отзыв удалён");
    } catch {
      message.error("Не удалось удалить отзыв");
    } finally {
      setDeletingReviewId(null); // снимаем спиннер
    }
  }

  // 7) Разметка страницы без структурных изменений
  return (
    <div className={styles.pageRoot}>
      {/* Если у тебя уже подключён AdminNav — оставляй как есть */}
      <AdminNav />
      <div className={styles.headerRow}>
        <Title level={3} className={styles.titleReset}>
          Отзывы
        </Title>

        <div className={styles.actions}>
          <Button type="primary" onClick={handleCreateReviewClick}>
            Создать отзыв
          </Button>
        </div>
      </div>

      <div className={styles.filters}>
        <Input.Search
          placeholder="Поиск по имени"
          allowClear
          onSearch={handleSearchByName}
          enterButton="Найти"
        />

        <Select
          placeholder="Статус"
          style={{ width: 180 }}
          onChange={handleFilterByStatus}
          options={[
            { value: "", label: "Все" },
            { value: "Опубликовано", label: "Опубликовано" },
            { value: "Черновик", label: "Черновик" },
            { value: "Скрыто", label: "Скрыто" },
          ]}
        />

        <Select
          placeholder="Рейтинг"
          style={{ width: 160 }}
          onChange={handleFilterByRating}
          options={[
            { value: 5, label: "5" },
            { value: 4, label: "4" },
            { value: 3, label: "3" },
            { value: 2, label: "2" },
            { value: 1, label: "1" },
          ]}
        />

        <RangePicker onChange={handleFilterByDateRange} />
      </div>

      <Card className={styles.tableContainer}>
        <Table<ReviewRow>
          columns={tableColumns}
          dataSource={tableData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 960 }}
          loading={isTableLoading} // ⬅️ показываем спиннер во время загрузки
        />
      </Card>

      {/* Опционально: выводим техническую ошибку под таблицей */}
      {errorMessage && (
        <Text type="danger">Техническая информация: {errorMessage}</Text>
      )}
    </div>
  );
}
