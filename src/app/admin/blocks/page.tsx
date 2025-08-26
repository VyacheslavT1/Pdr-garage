"use client";

import React, { useEffect, useState } from "react"; // ⬅️ + useEffect/useState
import {
  Typography,
  Button,
  Input,
  Select,
  Space,
  Card,
  Table,
  message,
  Popconfirm,
} from "antd";
import AdminNav from "../shared/AdminNav/AdminNav";
import Link from "next/link";

import { useRouter } from "next/navigation";
import styles from "./AdminBlocks.module.scss";

const { Title, Text } = Typography;

// Тип строки таблицы
type BlockRow = {
  id: string;
  titleRu: string;
  slug: string;
  status: "Черновик" | "Опубликовано" | "Скрыто";
  orderIndex: number;
  updatedAt: string;
};

export default function AdminBlocksPage() {
  // 1) Состояния данных и загрузки таблицы
  const [blocksData, setBlocksData] = useState<BlockRow[]>([]); // массив записей из API
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false); // индикатор загрузки
  const [errorMessage, setErrorMessage] = useState<string>(""); // текст ошибки (для отладки/тостов)
  const routerInstance = useRouter();
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
  /* 
  Зачем:
  - показываем спиннер на конкретной кнопке «Удалить»
  - не даём по ней кликать повторно, пока идёт запрос
*/

  // 2) Колонки таблицы (без изменений)
  const tableColumns = [
    {
      title: "Название (RU)",
      dataIndex: "titleRu",
      key: "titleRu",
      ellipsis: true, // оставляем обрезку длинных названий
      render: (cellValue: string, currentRecord: BlockRow) => (
        // Ссылка на форму редактирования конкретного блока
        <Link
          href={`/admin/blocks/${currentRecord.id}`}
          aria-label={`Открыть редактирование блока ${cellValue}`}
        >
          {cellValue}
        </Link>
      ),
    },

    {
      title: "Ключ/Тип",
      dataIndex: "slug",
      key: "slug",
      width: 200,
      ellipsis: true,
      render: (cellValue: string, currentRecord: BlockRow) => (
        // Ссылка на форму редактирования блока по его id
        <Link
          href={`/admin/blocks/${currentRecord.id}`}
          aria-label={`Открыть редактирование блока ${cellValue}`}
        >
          <code>{cellValue}</code>
        </Link>
      ),
    },

    { title: "Статус", dataIndex: "status", key: "status", width: 150 },
    {
      title: "Порядок",
      dataIndex: "orderIndex",
      key: "orderIndex",
      width: 120,
      sorter: true,
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
      width: 220,
      render: (_: unknown, record: BlockRow) => (
        <Space wrap>
          <Button
            size="small"
            onClick={() => routerInstance.push(`/admin/blocks/${record.id}`)}
          >
            Редактировать
          </Button>

          <Button
            size="small"
            onClick={() => message.info(`Дублировать: ${record.slug}`)}
          >
            Дублировать
          </Button>

          {/* ⬇️ подтверждение удаления + спиннер на конкретной строке */}
          <Popconfirm
            title="Удалить этот блок?"
            description={`Действие необратимо: ${record.titleRu}`}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteBlock(record.id)}
          >
            <Button
              size="small"
              danger
              loading={deletingBlockId === record.id} // показываем спиннер именно на этой кнопке
              disabled={deletingBlockId === record.id} // не даём повторно нажимать
            >
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 3) Загрузка данных из защищённого API /api/blocks при монтировании страницы
  useEffect(() => {
    // AbortController — чтобы корректно отменять запрос при уходе со страницы
    const requestAbortController = new AbortController();

    async function loadBlocks() {
      try {
        setIsTableLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/blocks", {
          method: "GET",
          credentials: "include", // ⬅️ отправляем cookie access_token
          signal: requestAbortController.signal, // ⬅️ для отмены при анмаунте
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

        // Ожидаем структуру { items: BlockRow[] } из API-заглушки
        const payload = (await response.json()) as { items: BlockRow[] };
        setBlocksData(Array.isArray(payload.items) ? payload.items : []);
      } catch (caughtError) {
        const readableMessage =
          caughtError instanceof Error
            ? caughtError.message
            : "Неизвестная ошибка";
        setErrorMessage(readableMessage);
        message.error("Не удалось загрузить список блоков");
      } finally {
        setIsTableLoading(false);
      }
    }

    loadBlocks();

    // Отмена запроса при размонтировании
    return () => requestAbortController.abort();
  }, []);

  // 4) Ранее у нас был локальный пустой массив.
  //    Сохраняем имя переменной tableData, но теперь берём данные из состояния:
  const tableData: BlockRow[] = blocksData;

  // 5) Заглушки верхних действий (без изменений)
  function handleCreateBlockClick() {
    // Переходим на страницу создания нового блока
    routerInstance.push("/admin/blocks/new");
  }
  function handleSearchByTitle(value: string) {
    message.info(`Поиск по названию: ${value || "—"}`);
  }
  function handleFilterByStatus(selectedStatus: string) {
    message.info(`Фильтр по статусу: ${selectedStatus || "все"}`);
  }
  async function handleDeleteBlock(targetBlockId: string) {
    try {
      setDeletingBlockId(targetBlockId); // включаем спиннер на нужной строке

      const response = await fetch(
        `/api/blocks?id=${encodeURIComponent(targetBlockId)}`,
        {
          method: "DELETE",
          credentials: "include", // отправляем httpOnly-cookie
          headers: { Accept: "application/json" },
        }
      );

      if (response.status === 401) {
        message.error("Сессия недействительна. Войдите заново.");
        return;
      }
      if (response.status === 404) {
        message.error("Блок не найден (возможно, его уже удалили).");
        // На всякий случай синхронизируем локальное состояние:
        setBlocksData((previous) =>
          previous.filter((existing) => existing.id !== targetBlockId)
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Успешно: убираем запись из состояния таблицы без повторной загрузки
      setBlocksData((previous) =>
        previous.filter((existing) => existing.id !== targetBlockId)
      );
      message.success("Блок удалён");
    } catch {
      message.error("Не удалось удалить блок");
    } finally {
      setDeletingBlockId(null); // снимаем спиннер
    }
  }

  return (
    <div className={styles.pageRoot}>
      <AdminNav />

      <div className={styles.headerRow}>
        <Title level={3} className={styles.titleReset}>
          Блоки сайта
        </Title>
        <div className={styles.actions}>
          <Button type="primary" onClick={handleCreateBlockClick}>
            Создать блок
          </Button>
        </div>
      </div>

      <Space direction="horizontal" wrap>
        <Input.Search
          placeholder="Поиск по названию (RU)"
          allowClear
          onSearch={handleSearchByTitle}
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
      </Space>

      <Card className={styles.tableContainer}>
        <Table<BlockRow>
          columns={tableColumns}
          dataSource={tableData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 900 }}
          loading={isTableLoading} // ⬅️ показываем спиннер во время загрузки
        />
      </Card>

      {/* Можно временно вывести ошибку под таблицей для наглядности (опционально) */}
      {errorMessage && (
        <Text type="danger">Техническая информация: {errorMessage}</Text>
      )}
    </div>
  );
}
