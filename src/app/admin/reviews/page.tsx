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
import { useRouter } from "next/navigation";

import styles from "./AdminReviews.module.scss";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 1) Тип строки таблицы: структура одной записи отзыва.
//    (Без изменений — используем как и раньше)
type ReviewRow = {
  id: string; // Уникальный идентификатор записи
  clientName: string; // Имя клиента (обязательное поле)
  comment?: string | null;
  rating?: number | null; // Рейтинг 1–5 (опционально)
  status: "Brouillon" | "Publié" | "Masqué"; // Публикационный статус
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
  const [approvingReviewId, setApprovingReviewId] = useState<string | null>(
    null
  );
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyDraftValue, setReplyDraftValue] = useState<string>("");
  const [publishingReplyReviewId, setPublishingReplyReviewId] = useState<
    string | null
  >(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // 3) Колонки таблицы (как и были — без переименований)
  const tableColumns = [
    {
      title: "Client",
      dataIndex: "clientName",
      key: "clientName",
      ellipsis: true,
      render: (cellValue: string, currentRecord: ReviewRow) => (
        // Ссылка на форму редактирования конкретного отзыва
        <Text>{cellValue}</Text>
      ),
    },
    {
      title: "Avis",
      dataIndex: "comment",
      key: "comment",

      render: (value: string | null | undefined) =>
        value && value.trim().length > 0 ? (
          <Text>{value}</Text>
        ) : (
          <Tag color="default">Vide</Tag>
        ),
    },
    {
      title: "Note",
      dataIndex: "rating",
      key: "rating",
      width: 160,
      render: (value: number | null | undefined) =>
        typeof value === "number" ? (
          <Rate disabled value={value} />
        ) : (
          <Text type="secondary">non</Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (value: ReviewRow["status"]) => {
        const color =
          value === "Publié"
            ? "green"
            : value === "Brouillon"
            ? "default"
            : "orange";
        return <Tag color={color}>{value}</Tag>;
      },
    },

    {
      title: "Date",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 220,
      render: (value: string) => (
        <Text>{new Date(value).toLocaleString()}</Text>
      ),
    },
    {
      title: "Actons",
      key: "actions",
      width: 260,
      render: (_: unknown, record: ReviewRow) => {
        const isReplyingThisRow = replyingReviewId === record.id; // ← используется состояние из предыдущего шага
        return (
          <Space wrap>
            {/* Публикация */}
            <Popconfirm
              title="Publier l'avis?"
              description={`Action irréversible. ID: ${record.id}`}
              okText="Publier"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleApproveReview(record.id)}
            >
              <Button
                size="small"
                type="primary"
                loading={approvingReviewId === record.id}
                disabled={approvingReviewId === record.id}
              >
                Accorder
              </Button>
            </Popconfirm>

            {/* Répondre */}
            <Button
              size="small"
              onClick={() => handleStartReply(record.id)}
              disabled={publishingReplyReviewId === record.id}
            >
              Répondre
            </Button>

            {/* Удаление */}
            <Popconfirm
              title="Supprimer l'avis?"
              description={`Action irréversible. ID: ${record.id}`}
              okText="Supprimer"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDeleteReview(record.id)}
            >
              <Button
                size="small"
                danger
                loading={deletingReviewId === record.id} // спиннер именно на этой строке
                disabled={deletingReviewId === record.id} // блокируем повторные клики
              >
                Supprimer
              </Button>
            </Popconfirm>

            {/* Поле ответа + кнопка публикации (показываем только для выбранной строки) */}
          </Space>
        );
      },
    },
  ];

  const expandedRowRender = (record: ReviewRow) => {
    const isThis = replyingReviewId === record.id;
    return (
      <div className={styles.expandedReplyRow}>
        <Input.TextArea
          className={styles.replyTextarea}
          placeholder="Votre réponse…"
          value={isThis ? replyDraftValue : ""}
          onChange={(e) => setReplyDraftValue(e.target.value)}
          maxLength={4000}
          autoSize={{ minRows: 3, maxRows: 8 }}
          autoFocus={isThis} // ← фокус при раскрытии
          onKeyDown={(keyboardEvent) => {
            // ← Cmd/Ctrl + Enter = публиковать
            const isSubmitCombo =
              (keyboardEvent.metaKey || keyboardEvent.ctrlKey) &&
              keyboardEvent.key === "Enter";
            if (isSubmitCombo && replyDraftValue.trim()) {
              keyboardEvent.preventDefault();
              handlePublishReply(record.id);
            }
          }}
        />

        <div className={styles.replyRowActions}>
          <Button
            type="primary"
            onClick={() => handlePublishReply(record.id)}
            loading={publishingReplyReviewId === record.id}
            disabled={
              publishingReplyReviewId === record.id ||
              replyDraftValue.trim().length === 0
            }
          >
            Publier
          </Button>
          <Button
            onClick={() => {
              setReplyingReviewId(null);
              setReplyDraftValue("");
              setExpandedRowKeys([]);
            }}
          >
            Annuler
          </Button>
        </div>
      </div>
    );
  };

  async function handleApproveReview(targetReviewId: string) {
    try {
      setApprovingReviewId(targetReviewId);

      const response = await fetch(
        `/api/reviews?id=${encodeURIComponent(targetReviewId)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "Publié" }),
        }
      );

      if (response.status === 401) {
        message.error("Session invalide. Veuillez vous reconnecter.");
        return;
      }
      if (response.status === 404) {
        message.error("Avis introuvable (peut-être déjà supprimé).");
        // синхронизуем локально, если записи уже нет
        setReviewsData((previous) =>
          previous.filter((existing) => existing.id !== targetReviewId)
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // если сервер вернул обновлённый item — используем его updatedAt
      const payload = await response.json().catch(() => null as any);
      if (payload?.item) {
        const updated = payload.item as ReviewRow;
        setReviewsData((previous) =>
          previous.map((existing) =>
            existing.id === targetReviewId
              ? {
                  ...existing,
                  status: updated.status,
                  updatedAt: updated.updatedAt,
                }
              : existing
          )
        );
      } else {
        // fallback: обновим статус локально
        setReviewsData((previous) =>
          previous.map((existing) =>
            existing.id === targetReviewId
              ? {
                  ...existing,
                  status: "Publié",
                  updatedAt: new Date().toISOString(),
                }
              : existing
          )
        );
      }

      message.success("Avis accordé (publié).");
    } catch {
      message.error("Échec de l’accord de l’avis");
    } finally {
      setApprovingReviewId(null);
    }
  }

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
          message.error("Session invalide. Veuillez vous reconnecter.");
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Une erreur est survenue lors du chargement: ${response.status}`
          );
        }

        // Ожидаем структуру { items: ReviewRow[] } из API-заглушки
        const payload = (await response.json()) as { items: ReviewRow[] };
        setReviewsData(Array.isArray(payload.items) ? payload.items : []);
      } catch (caughtError) {
        const readableMessage =
          caughtError instanceof Error
            ? caughtError.message
            : "Erreur inconnue";
        setErrorMessage(readableMessage);
        message.error("Échec du chargement de la liste des avis");
      } finally {
        setIsTableLoading(false);
      }
    }

    loadReviews();
    return () => requestAbortController.abort(); // отмена запроса при уходе со страницы
  }, []);

  // 5) Сохраняем прежнее имя переменной tableData (ничего не переименовываем):
  const tableData: ReviewRow[] = reviewsData;

  function handleSearchByName(value: string) {
    message.info(`Recherche par nom: ${value || "—"}`);
  }

  function handleFilterByStatus(statusValue: string) {
    message.info(`Filtrer par statut: ${statusValue || "tous"}`);
  }

  function handleFilterByRating(ratingValue: number) {
    message.info(`Filtrer par note: ${ratingValue || "tous"}`);
  }

  function handleFilterByDateRange(_: unknown, dateStrings: [string, string]) {
    const [fromDate, toDate] = dateStrings || [];
    message.info(`Plage de dates: ${fromDate || "—"} → ${toDate || "—"}`);
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
        message.error("Session invalide. Veuillez vous reconnecter.");
        return;
      }
      if (response.status === 404) {
        message.error("Avis introuvable (peut-être déjà supprimé).");
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
      message.success("Avis supprimé");
    } catch {
      message.error("Échec de la suppression de l’avis");
    } finally {
      setDeletingReviewId(null); // снимаем спиннер
    }
  }

  function handleStartReply(targetReviewId: string) {
    setReplyDraftValue("");
    setReplyingReviewId((prev) =>
      prev === targetReviewId ? null : targetReviewId
    );
    setExpandedRowKeys((prev) =>
      prev[0] === targetReviewId ? [] : [targetReviewId]
    );
  }

  async function handlePublishReply(targetReviewId: string) {
    const trimmedMessage = replyDraftValue.trim();
    if (!trimmedMessage) {
      message.warning("Le message est vide.");
      return;
    }

    try {
      setPublishingReplyReviewId(targetReviewId);

      const response = await fetch(
        `/api/reviews?id=${encodeURIComponent(targetReviewId)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminReply: trimmedMessage }),
        }
      );

      if (response.status === 401) {
        message.error("Session invalide. Veuillez vous reconnecter.");
        return;
      }
      if (response.status === 404) {
        message.error("Avis introuvable (peut-être déjà supprimé).");
        setReviewsData((previous) =>
          previous.filter((existing) => existing.id !== targetReviewId)
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json().catch(() => null as any);
      if (payload?.item?.updatedAt) {
        const updated = payload.item as ReviewRow;
        setReviewsData((previous) =>
          previous.map((existing) =>
            existing.id === targetReviewId
              ? { ...existing, updatedAt: updated.updatedAt }
              : existing
          )
        );
      }

      message.success("Réponse publiée.");
      setReplyingReviewId(null);
      setReplyDraftValue("");
    } catch {
      message.error("Échec de la publication de la réponse.");
    } finally {
      setPublishingReplyReviewId(null);
    }
  }

  // 7) Разметка страницы без структурных изменений
  return (
    <div className={styles.pageRoot}>
      {/* Если у тебя уже подключён AdminNav — оставляй как есть */}
      <AdminNav />
      <div className={styles.headerRow}>
        <Title level={3} className={styles.titleReset}>
          Avis
        </Title>
      </div>

      <div className={styles.filters}>
        <Input.Search
          placeholder="Recherche par nom"
          allowClear
          onSearch={handleSearchByName}
          enterButton="Chercher"
        />

        <Select
          placeholder="Status"
          style={{ width: 180 }}
          onChange={handleFilterByStatus}
          options={[
            { value: "", label: "Tous" },
            { value: "Publié", label: "Publié" },
            { value: "Brouillon", label: "Brouillon" },
            { value: "Masqué", label: "Masqué" },
          ]}
        />

        <Select
          placeholder="Note"
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
          loading={isTableLoading}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpand: (expanded, record) => {
              if (expanded) {
                setReplyingReviewId(record.id);
                setReplyDraftValue("");
                setExpandedRowKeys([record.id]);
              } else {
                setReplyingReviewId(null);
                setReplyDraftValue("");
                setExpandedRowKeys([]);
              }
            },
          }}
        />
      </Card>

      {/* Опционально: выводим техническую ошибку под таблицей */}
      {errorMessage && (
        <Text type="danger">Informations techniques: {errorMessage}</Text>
      )}
    </div>
  );
}
