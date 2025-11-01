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
  Space,
  Popconfirm,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import AdminNav from "@/shared/ui/admin-nav/AdminNav";
import Link from "next/link";
import styles from "./AdminRequests.module.scss";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type RequestRow = {
  id: string;
  createdAt: string;
  clientName: string;
  phone: string;
  email: string;
  comment?: string | null;
  status: "Non traité" | "Traité";
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    dataUrl?: string | null;
  }>;
  gender?: "male" | "female";
};

// Игнорируем отменённые запросы (AbortController), частый кейс в dev/StrictMode
const isAbortError = (e: unknown) =>
  (e instanceof DOMException && e.name === "AbortError") ||
  (e as any)?.name === "AbortError";

export default function AdminRequestsPage() {
  const [requestsData, setRequestsData] = useState<RequestRow[]>([]);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(
    null
  );
  const [isNarrow, setIsNarrow] = useState(false);

  function handleRowClick(targetRequestId: string) {
    window.location.href = `/admin/requests/${encodeURIComponent(
      targetRequestId
    )}`;
  }

  const tableColumns: ColumnsType<RequestRow> = [
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
        <div className={styles.clientCell}>
          {record.gender && (
            <span>{record.gender === "male" ? "M." : "Mme"}</span>
          )}
          <Link
            href={`/admin/requests/${encodeURIComponent(record.id)}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRowClick(record.id);
            }}
            className={styles.requestDetailsLink}
          >
            {record.clientName}
          </Link>
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
    {
      title: "Actions",
      key: "actions",
      width: isNarrow ? 130 : 220,
      className: styles.actionsCol,
      render: (_: unknown, record: RequestRow) => (
        <Space className={styles.actionsStack}>
          <Button
            size="small"
            type="primary"
            onClick={() => handleRowClick(record.id)}
          >
            Traiter
          </Button>
          <Popconfirm
            title="Supprimer la demande ?"
            okText="Supprimer"
            cancelText="Annuler"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteRequest(record.id)}
          >
            <Button
              size="small"
              danger
              loading={deletingRequestId === record.id}
            >
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
        return;
      }
      if (!response.ok)
        throw new Error(`Erreur de chargement: ${response.status}`);
      const payload = (await response.json()) as { items: RequestRow[] };
      setRequestsData(Array.isArray(payload.items) ? payload.items : []);
    } catch (caughtError) {
      if (isAbortError(caughtError)) return;
      const readableMessage =
        caughtError instanceof Error ? caughtError.message : "Erreur inconnue";
      setErrorMessage(readableMessage);
    } finally {
      setIsTableLoading(false);
    }
  }

  useEffect(() => {
    const requestAbortController = new AbortController();
    async function loadRequests() {
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
          return;
        }
        if (!response.ok)
          throw new Error(`Erreur de chargement: ${response.status}`);
        const payload = (await response.json()) as { items: RequestRow[] };
        setRequestsData(Array.isArray(payload.items) ? payload.items : []);
      } catch (caughtError) {
        if (isAbortError(caughtError)) return;
        const readableMessage =
          caughtError instanceof Error
            ? caughtError.message
            : "Erreur inconnue";
        setErrorMessage(readableMessage);
      } finally {
        setIsTableLoading(false);
      }
    }
    loadRequests();
    return () => requestAbortController.abort();
  }, []);

  const tableData: RequestRow[] = requestsData;

  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth <= 992);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function handleSearchByNameOrPhone(value: string) {
    const hasQuery = typeof value === "string" && value.trim().length > 0;
    const baseUrl = "/api/requests";
    const requestUrl = hasQuery
      ? `${baseUrl}?search=${encodeURIComponent(value.trim())}`
      : baseUrl;

    setIsTableLoading(true);
    setErrorMessage("");

    fetch(requestUrl, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (response.status === 401) {
          return { items: [] };
        }
        if (!response.ok)
          throw new Error(`Erreur de chargement: ${response.status}`);
        return (await response.json()) as { items: RequestRow[] };
      })
      .then((payload) => {
        setRequestsData(Array.isArray(payload.items) ? payload.items : []);
        // search finished
      })
      .catch((caught) => {
        if (isAbortError(caught)) return;
        const readable =
          caught instanceof Error ? caught.message : "Erreur inconnue";
        setErrorMessage(readable);
        // message.error("Échec de la recherche");
      })
      .finally(() => setIsTableLoading(false));
  }

  function handleFilterByStatus(statusValue: string) {
    const isAllStatusesSelected = !statusValue;
    const baseUrl = "/api/requests";
    const requestUrl = isAllStatusesSelected
      ? baseUrl
      : `${baseUrl}?status=${encodeURIComponent(statusValue)}`;

    setIsTableLoading(true);
    setErrorMessage("");

    fetch(requestUrl, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (response.status === 401) {
          return { items: [] };
        }
        if (!response.ok)
          throw new Error(`Erreur de chargement: ${response.status}`);
        return (await response.json()) as { items: RequestRow[] };
      })
      .then((payload) =>
        setRequestsData(Array.isArray(payload.items) ? payload.items : [])
      )
      .catch((caught) => {
        if (isAbortError(caught)) return;
        const readable =
          caught instanceof Error ? caught.message : "Erreur inconnue";
        setErrorMessage(readable);
        // message.error("Échec du filtrage");
      })
      .finally(() => setIsTableLoading(false));
  }

  function handleFilterByDateRange(range: [Dayjs, Dayjs] | null) {
    const baseUrl = "/api/requests";
    const requestUrl = range
      ? `${baseUrl}?from=${range[0].format("YYYY-MM-DD")}&to=${range[1].format(
          "YYYY-MM-DD"
        )}`
      : baseUrl;

    setIsTableLoading(true);
    setErrorMessage("");

    fetch(requestUrl, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (response.status === 401) {
          return { items: [] };
        }
        if (!response.ok)
          throw new Error(`Erreur de chargement: ${response.status}`);
        return (await response.json()) as { items: RequestRow[] };
      })
      .then((payload) =>
        setRequestsData(Array.isArray(payload.items) ? payload.items : [])
      )
      .catch((caught) => {
        if (isAbortError(caught)) return;
        const readable =
          caught instanceof Error ? caught.message : "Erreur inconnue";
        setErrorMessage(readable);
      })
      .finally(() => setIsTableLoading(false));
  }

  async function handleDeleteRequest(targetRequestId: string) {
    try {
      setDeletingRequestId(targetRequestId);
      const response = await fetch(
        `/api/requests?id=${encodeURIComponent(targetRequestId)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (response.status === 401) {
        return;
      }
      if (response.status === 404) {
        return;
      }
      if (!response.ok)
        throw new Error(`Échec de suppression: ${response.status}`);
      setRequestsData((prev) =>
        prev.filter((row) => row.id !== targetRequestId)
      );
      // deleted
    } catch (caught) {
      if (isAbortError(caught)) return;
      const readable =
        caught instanceof Error ? caught.message : "Erreur inconnue";
      // message.error(`Impossible de supprimer: ${readable}`);
    } finally {
      setDeletingRequestId(null);
    }
  }

  return (
    <div className={styles.pageContainer}>
      <AdminNav />
      <div className={styles.header}>
        <Title level={3} className={styles.title}>
          Demandes des clients
        </Title>
        <Button onClick={refetchRequestsNow}>Actualiser</Button>
      </div>

      <Card>
        <div className={styles.filters}>
          <Input.Search
            placeholder="Rechercher par nom ou téléphone"
            allowClear
            enterButton
            onSearch={handleSearchByNameOrPhone}
            className={styles.inputSearch}
          />
          <Select
            placeholder="Filtrer par statut"
            onChange={(value) => handleFilterByStatus(value as string)}
            options={[
              { label: "Tous", value: "" },
              { label: "Non traité", value: "Non traité" },
              { label: "Traité", value: "Traité" },
            ]}
            allowClear
          />
          <RangePicker
            onChange={(range) =>
              handleFilterByDateRange(range as [Dayjs, Dayjs] | null)
            }
          />
        </div>

        <Table
          rowKey="id"
          columns={tableColumns}
          dataSource={tableData}
          loading={isTableLoading}
          pagination={{ pageSize: 10 }}
        />

        {process.env.NODE_ENV === "development" && errorMessage && (
          <Text className={styles.errorMessage} type="danger">
            Informations techniques: {errorMessage}
          </Text>
        )}
      </Card>
    </div>
  );
}
