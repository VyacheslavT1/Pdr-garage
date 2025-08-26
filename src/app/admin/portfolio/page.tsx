"use client"; // Клиентская страница: кнопки, поиск, фильтры, уведомления

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
import Link from "next/link";
import { useRouter } from "next/navigation"; // для программной навигации

import styles from "./AdminPortfolio.module.scss";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 1) Тип строки таблицы (как был): структура одной записи портфолио (кейса)
type PortfolioRow = {
  id: string;
  titleRu: string;
  category: string;
  publishedAt?: string | null;
  status: "Черновик" | "Опубликовано" | "Скрыто";
  orderIndex: number;
  updatedAt: string;
};

export default function AdminPortfolioPage() {
  // 2) Состояния данных/загрузки/ошибки (новое):
  const [portfolioData, setPortfolioData] = useState<PortfolioRow[]>([]); // массив записей из API
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false); // индикатор загрузки таблицы
  const [errorMessage, setErrorMessage] = useState<string>(""); // текст ошибки (для отладки/тостов)
  const [deletingPortfolioId, setDeletingPortfolioId] = useState<string | null>(
    null
  );
  /*
  Зачем:
  - показываем спиннер на конкретной кнопке "Удалить"
  - блокируем повторные клики по этой кнопке, пока идёт запрос
*/
  const routerInstance = useRouter(); // объект для переходов внутри админки

  // 3) Колонки таблицы (без изменений)
  const tableColumns = [
    {
      title: "Название (RU)",
      dataIndex: "titleRu",
      key: "titleRu",
      ellipsis: true,
      render: (cellValue: string, currentRecord: PortfolioRow) => (
        <Link
          href={`/admin/portfolio/${currentRecord.id}`}
          aria-label={`Открыть редактирование кейса ${cellValue}`}
        >
          {cellValue}
        </Link>
      ),
    },

    {
      title: "Категория",
      dataIndex: "category",
      key: "category",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Дата публикации",
      dataIndex: "publishedAt",
      key: "publishedAt",
      width: 200,
      render: (value: string | null | undefined) =>
        value ? (
          <Text>{new Date(value).toLocaleDateString()}</Text>
        ) : (
          <Tag color="default">не опубликовано</Tag>
        ),
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (value: PortfolioRow["status"]) => {
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
      title: "Порядок",
      dataIndex: "orderIndex",
      key: "orderIndex",
      width: 120,
      sorter: true, // обработчик добавим, когда подключим серверную сортировку
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
      render: (_: unknown, record: PortfolioRow) => (
        <Space wrap>
          {/* оставляем прочие кнопки как есть */}
          <Button
            size="small"
            onClick={() => message.info(`Открыть кейс: ${record.titleRu}`)}
          >
            Редактировать
          </Button>
          <Button
            size="small"
            onClick={() => message.info(`Дублировать кейс: ${record.titleRu}`)}
          >
            Дублировать
          </Button>

          {/* ⬇️ подтверждение удаления + спиннер именно на этой строке */}
          <Popconfirm
            title="Удалить этот кейс?"
            description={`Действие необратимо: ${record.titleRu}`}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeletePortfolio(record.id)}
          >
            <Button
              size="small"
              danger
              loading={deletingPortfolioId === record.id} // показываем прогресс на конкретной строке
              disabled={deletingPortfolioId === record.id} // не даём повторно нажимать
            >
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 4) Загрузка данных из защищённого API /api/portfolio при монтировании страницы (новое)
  useEffect(() => {
    // AbortController — чтобы отменять запрос, если пользователь уйдёт со страницы
    const requestAbortController = new AbortController();

    async function loadPortfolioItems() {
      try {
        setIsTableLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/portfolio", {
          method: "GET",
          credentials: "include", // отправляем cookie access_token
          signal: requestAbortController.signal, // поддержка отмены запроса
          headers: { Accept: "application/json" },
        });

        if (response.status === 401) {
          // Теоретически middleware не пустит сюда без токена, но на всякий случай:
          message.error("Сессия недействительна. Войдите заново.");
          return;
        }

        if (!response.ok) {
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }

        // Ожидаем структуру { items: PortfolioRow[] } из API-заглушки
        const payload = (await response.json()) as { items: PortfolioRow[] };
        setPortfolioData(Array.isArray(payload.items) ? payload.items : []);
      } catch (caughtError) {
        const readableMessage =
          caughtError instanceof Error
            ? caughtError.message
            : "Неизвестная ошибка";
        setErrorMessage(readableMessage);
        message.error("Не удалось загрузить список кейсов");
      } finally {
        setIsTableLoading(false);
      }
    }

    loadPortfolioItems();

    // Отмена запроса при размонтировании
    return () => requestAbortController.abort();
  }, []);

  // 5) Табличные данные: сохраняем имя переменной tableData, как и раньше (без переименований)
  const tableData: PortfolioRow[] = portfolioData;

  // 6) Обработчики верхних элементов управления (как были — без изменений)
  function handleCreateCaseClick() {
    message.info("Создание нового кейса (заглушка)");
  }

  function handleSearchByTitle(value: string) {
    message.info(`Поиск по названию: ${value || "—"}`);
  }

  function handleFilterByCategory(categoryValue: string) {
    message.info(`Фильтр по категории: ${categoryValue || "все"}`);
  }

  function handleFilterByStatus(statusValue: string) {
    message.info(`Фильтр по статусу: ${statusValue || "все"}`);
  }

  function handleFilterByDateRange(_: unknown, dateStrings: [string, string]) {
    const [fromDate, toDate] = dateStrings || [];
    message.info(`Диапазон публикации: ${fromDate || "—"} → ${toDate || "—"}`);
  }

  function handleCreatePortfolioClick() {
    // Переходим на страницу создания нового кейса портфолио
    routerInstance.push("/admin/portfolio/new");
  }

  async function handleDeletePortfolio(targetPortfolioId: string) {
    try {
      setDeletingPortfolioId(targetPortfolioId); // включаем спиннер на нужной строке

      const response = await fetch(
        `/api/portfolio?id=${encodeURIComponent(targetPortfolioId)}`,
        {
          method: "DELETE",
          credentials: "include", // отправляем httpOnly-cookie сессии
          headers: { Accept: "application/json" },
        }
      );

      if (response.status === 401) {
        message.error("Сессия недействительна. Войдите заново.");
        return;
      }
      if (response.status === 404) {
        message.error("Кейс не найден (возможно, уже удалён).");
        // синхронизируем локальное состояние на всякий случай
        setPortfolioData((previous) =>
          previous.filter((existing) => existing.id !== targetPortfolioId)
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Успех: убираем запись из таблицы без дополнительной загрузки
      setPortfolioData((previous) =>
        previous.filter((existing) => existing.id !== targetPortfolioId)
      );
      message.success("Кейс удалён");
    } catch {
      message.error("Не удалось удалить кейс");
    } finally {
      setDeletingPortfolioId(null); // снимаем спиннер
    }
  }

  // 7) Разметка страницы без структурных изменений
  return (
    <div className={styles.pageRoot}>
      {/* Если у тебя уже подключён AdminNav на этой странице — оставь как есть */}
      <AdminNav />
      {/* Шапка: заголовок «Портфолио» и кнопка «Создать кейс» */}
      <div className={styles.headerRow}>
        <Title level={3} className={styles.titleReset}>
          Портфолио
        </Title>

        <div className={styles.actions}>
          <Button type="primary" onClick={handleCreatePortfolioClick}>
            Создать кейс
          </Button>
        </div>
      </div>

      {/* Панель фильтров/поиска */}
      <div className={styles.filters}>
        <Input.Search
          placeholder="Поиск по названию (RU)"
          allowClear
          onSearch={handleSearchByTitle}
          enterButton="Найти"
        />

        <Select
          placeholder="Категория"
          style={{ width: 220 }}
          onChange={handleFilterByCategory}
          options={[
            { value: "", label: "Все" },
            { value: "Вмятины без покраски", label: "Вмятины без покраски" },
            { value: "Полировка", label: "Полировка" },
            { value: "Стекло", label: "Стекло" },
          ]}
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

        <RangePicker onChange={handleFilterByDateRange} />
      </div>

      {/* Таблица: теперь получает данные из /api/portfolio и показывает состояние загрузки */}
      <Card className={styles.tableContainer}>
        <Table<PortfolioRow>
          columns={tableColumns}
          dataSource={tableData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
          loading={isTableLoading} // ⬅️ индикатор загрузки
        />
      </Card>

      {/* Опционально: техническая подсказка об ошибке под таблицей */}
      {errorMessage && (
        <Text type="danger">Техническая информация: {errorMessage}</Text>
      )}
    </div>
  );
}
