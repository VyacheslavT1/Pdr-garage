"use client";

import React, { useEffect, useState } from "react";
import { Typography, Button, Space, Card, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import AdminNav from "@/shared/ui/admin-nav/AdminNav";
import styles from "./AdminReviews.module.scss";

const { Title, Text } = Typography;

const getErrorName = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") return undefined;
  if (!("name" in error)) return undefined;
  const name = (error as { name?: unknown }).name;
  return typeof name === "string" ? name : undefined;
};

// Игнорируем отменённые запросы (AbortController)
const isAbortError = (error: unknown) =>
  (error instanceof DOMException && error.name === "AbortError") ||
  getErrorName(error) === "AbortError";

type ReviewRow = {
  id: string;
  clientName: string;
  comment?: string | null;
  rating?: number | null;
  status: "Brouillon" | "Publié" | "Masqué";
  date?: string | null;
  updatedAt: string;
};

export default function AdminReviewsPage() {
  const [reviewsData, setReviewsData] = useState<ReviewRow[]>([]);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth <= 992);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function handleRowClick(targetReviewId: string) {
    window.location.href = `/admin/reviews/${encodeURIComponent(
      targetReviewId
    )}`;
  }

  const tableColumns: ColumnsType<ReviewRow> = [
    {
      title: "Client",
      dataIndex: "clientName",
      key: "clientName",
      ellipsis: true,
      render: (cellValue: string) => <Text>{cellValue}</Text>,
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
      title: "Actions",
      key: "actions",
      width: isNarrow ? 160 : 220,
      render: (_: unknown, record: ReviewRow) => (
        <Space wrap>
          <Button
            size="small"
            type="primary"
            onClick={() => handleRowClick(record.id)}
          >
            Traiter
          </Button>
        </Space>
      ),
    },
  ];

  async function refetchReviewsNow() {
    const aborter = new AbortController();
    try {
      setIsTableLoading(true);
      setErrorMessage("");
      const response = await fetch("/api/reviews", {
        method: "GET",
        credentials: "include",
        signal: aborter.signal,
        headers: { Accept: "application/json" },
      });
      if (response.status === 401) { return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items: ReviewRow[] };
      setReviewsData(Array.isArray(payload.items) ? payload.items : []);
    } catch (caught) {
      if (isAbortError(caught)) return;
      const readable =
        caught instanceof Error ? caught.message : "Erreur inconnue";
      setErrorMessage(readable);
    } finally {
      setIsTableLoading(false);
    }
  }

  useEffect(() => {
    const aborter = new AbortController();
    (async () => {
      try {
        setIsTableLoading(true);
        setErrorMessage("");
        const response = await fetch("/api/reviews", {
          method: "GET",
          credentials: "include",
          signal: aborter.signal,
          headers: { Accept: "application/json" },
        });
        if (response.status === 401) { return; }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { items: ReviewRow[] };
        setReviewsData(Array.isArray(payload.items) ? payload.items : []);
      } catch (caught) {
        if (isAbortError(caught)) return;
        const readable =
          caught instanceof Error ? caught.message : "Erreur inconnue";
        setErrorMessage(readable);
      } finally {
        setIsTableLoading(false);
      }
    })();
    return () => aborter.abort();
  }, []);

  const tableData: ReviewRow[] = reviewsData;

  return (
    <div className={styles.pageContainer}>
      <AdminNav />
      <div className={styles.header}>
        <Title level={3} className={styles.title}>
          Avis des clients
        </Title>
        <div>
          <Button onClick={refetchReviewsNow}>Actualiser</Button>
        </div>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={tableColumns}
          dataSource={tableData}
          loading={isTableLoading}
          pagination={{ pageSize: 10 }}
        />

        {process.env.NODE_ENV === "development" && errorMessage && (
          <div className={styles.errorBlock}>
            <Text className={styles.errorMessage} type="danger">
              Informations techniques: {errorMessage}
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
}
