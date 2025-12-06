"use client";

import React, { useEffect, useState } from "react";
import {
  Typography,
  Card,
  Descriptions,
  Tag,
  Image,
  Space,
  Button,
  Spin,
  Popconfirm,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import styles from "./RequestDetails.module.scss";
import type { RequestAttachment } from "@/modules/requests/model/types";

const { Title, Text } = Typography;

type RequestRow = {
  id: string;
  createdAt: string;
  clientName: string;
  phone: string;
  email: string;
  comment?: string | null;
  status: "Non traité" | "Traité";
  attachments?: RequestAttachment[];
  gender?: "male" | "female";
};

export default function AdminRequestDetailsPage() {
  const routeParams = useParams<{ id: string }>();
  const nextRouter = useRouter();

  const [requestData, setRequestData] = useState<RequestRow | null>(null);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");

  useEffect(() => {
    const requestAbortController = new AbortController();
    async function loadSingleRequest() {
      try {
        setIsPageLoading(true);
        setErrorMessage("");
        const requestId = routeParams?.id;
        if (!requestId) {
          setErrorMessage(
            "L’identifiant de la demande n’est pas présent dans l’URL."
          );
          return;
        }
        const response = await fetch(
          `/api/requests?id=${encodeURIComponent(String(requestId))}`,
          {
            method: "GET",
            credentials: "include",
            signal: requestAbortController.signal,
            headers: { Accept: "application/json" },
          }
        );
        if (response.status === 401) {
          return;
        }
        if (response.status === 404) {
          setErrorMessage("Demande introuvable ou déjà supprimée.");
          return;
        }
        if (!response.ok)
          throw new Error(`Erreur de chargement: ${response.status}`);
        const payload = await response.json();
        const singleRequest: RequestRow | null =
          (payload?.item as RequestRow) ??
          (Array.isArray(payload?.items) && payload.items.length > 0
            ? (payload.items[0] as RequestRow)
            : null);
        if (!singleRequest) {
          setErrorMessage("La demande est absente dans la réponse du serveur.");
          return;
        }
        setRequestData(singleRequest);
      } catch (caughtError) {
        const readableMessage =
          caughtError instanceof Error
            ? caughtError.message
            : "Erreur inconnue";
        setErrorMessage(readableMessage);
        setActionError(readableMessage);
      } finally {
        setIsPageLoading(false);
      }
    }
    loadSingleRequest();
    return () => requestAbortController.abort();
  }, [routeParams?.id]);

  const hasImages =
    Array.isArray(requestData?.attachments) &&
    requestData!.attachments!.some(
      (f) =>
        typeof f?.publicUrl === "string" ||
        (!!f?.dataUrl && typeof f.dataUrl === "string")
    );

  function buildCsvContentFromSingleRequest(single: RequestRow): string {
    const headerColumns = [
      "id",
      "createdAt",
      "clientName",
      "phone",
      "email",
      "comment",
      "status",
      "gender",
    ] as const;
    const rec = single as unknown as Record<string, unknown>;
    const values = headerColumns.map((k) => {
      const v = rec[k];
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    });
    return `${headerColumns.join(",")}\n${values.join(",")}`;
  }

  function handleExportSingleRequestCsvClick() {
    if (!requestData) return;
    const csvContent = buildCsvContentFromSingleRequest(requestData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `request_${requestData.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleToggleProcessedOnDetails() {
    if (!requestData) return;
    try {
      const response = await fetch(
        `/api/requests?id=${encodeURIComponent(requestData.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: requestData.status === "Traité" ? "Non traité" : "Traité",
          }),
        }
      );
      if (response.status === 401) {
        setActionError("Session invalide");
        return;
      }
      if (response.status === 404) {
        setActionError("Demande introuvable");
        return;
      }
      if (!response.ok)
        throw new Error(`Échec de mise à jour: ${response.status}`);
      const { item } = (await response.json()) as { item: RequestRow };
      setRequestData(item);
      setActionError(""); // status changed
    } catch (caught) {
      const readable =
        caught instanceof Error ? caught.message : "Erreur inconnue";
      setActionError(readable);
    }
  }

  async function handleDeleteRequestOnDetails() {
    if (!requestData) return;
    try {
      const response = await fetch(
        `/api/requests?id=${encodeURIComponent(requestData.id)}`,
        { method: "DELETE", credentials: "include" }
      );
      if (response.status === 401) {
        setActionError("Session invalide");
        return;
      }
      if (response.status === 404) {
        setActionError("Demande introuvable");
        return;
      }
      if (!response.ok)
        throw new Error(`Échec de suppression: ${response.status}`);
      setActionError(""); // deleted
      window.location.href = "/admin/requests";
    } catch (caught) {
      const readable =
        caught instanceof Error ? caught.message : "Erreur inconnue";
      setActionError(readable);
    }
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>
          Détail de la demande
        </Title>

        <Button onClick={() => nextRouter.push("/admin/requests")}>
          Retour
        </Button>
      </div>

      <Card className={styles.card}>
        {isPageLoading ? (
          <div className={styles.loadingWrap}>
            <Spin size="large" />
          </div>
        ) : errorMessage ? (
          <Text type="danger">Informations techniques: {errorMessage}</Text>
        ) : requestData ? (
          <>
            <Descriptions
              bordered
              column={1}
              size="middle"
              className={styles.descriptionsRoot}
              items={[
                {
                  key: "clientName",
                  label: "Client",
                  children: (
                    <Space size={8}>
                      {requestData.gender && (
                        <span>
                          {requestData.gender === "male" ? "M." : "Mme"}
                        </span>
                      )}
                      <span>{requestData.clientName}</span>
                    </Space>
                  ),
                },
                {
                  key: "phone",
                  label: "Téléphone",
                  children: requestData.phone ? (
                    <a href={`tel:${requestData.phone}`}>{requestData.phone}</a>
                  ) : (
                    <Text type="secondary">—</Text>
                  ),
                },
                {
                  key: "email",
                  label: "Adresse électronique",
                  children: requestData.email ? (
                    <a href={`mailto:${requestData.email}`}>
                      {requestData.email}
                    </a>
                  ) : (
                    <Text type="secondary">—</Text>
                  ),
                },
                {
                  key: "comment",
                  label: "Commentaire",
                  children: requestData.comment ? (
                    <Text>{requestData.comment}</Text>
                  ) : (
                    <Text type="secondary">—</Text>
                  ),
                },
                {
                  key: "createdAt",
                  label: "Date de création",
                  children: (
                    <Text>
                      {new Date(requestData.createdAt).toLocaleString()}
                    </Text>
                  ),
                },
                {
                  key: "status",
                  label: "Statut",
                  children: (
                    <Tag
                      color={
                        requestData.status === "Traité" ? "green" : "default"
                      }
                    >
                      {requestData.status}
                    </Tag>
                  ),
                },
              ]}
            />

            <div className={styles.actions}>
              <Space wrap>
                <Button onClick={handleExportSingleRequestCsvClick}>
                  Exporter CSV
                </Button>
                <Button type="primary" onClick={handleToggleProcessedOnDetails}>
                  {requestData?.status === "Traité"
                    ? "Rétablir en « Non traité »"
                    : "Marquer comme traitée"}
                </Button>
                <Popconfirm
                  title="Supprimer la demande ?"
                  description={
                    requestData?.id
                      ? `Cette action est irréversible. ID: ${requestData.id}`
                      : "Cette action est irréversible"
                  }
                  okText="Supprimer"
                  cancelText="Annuler"
                  okButtonProps={{ danger: true }}
                  onConfirm={handleDeleteRequestOnDetails}
                >
                  <Button danger>Supprimer</Button>
                </Popconfirm>
              </Space>
              {actionError && (
                <div className={styles.errorRow} role="alert">
                  <Text type="danger">{actionError}</Text>
                </div>
              )}
            </div>

            <div className={styles.photosSection}>
              <Title level={5} className={styles.photosTitle}>
                Photos
              </Title>
              {hasImages ? (
                <Image.PreviewGroup>
                  <div className={styles.photosGrid}>
                    {requestData.attachments!
                      .map((f) => ({
                        ...f,
                        url: f.publicUrl ?? f.dataUrl ?? null,
                      }))
                      .filter((f) => !!f.url)
                      .map((f) => (
                        <Image
                          key={f.id}
                          src={f.url!}
                          alt={f.name}
                          className={styles.photoItem}
                          placeholder
                        />
                      ))}
                  </div>
                </Image.PreviewGroup>
              ) : (
                <Text type="secondary">Aucune photo</Text>
              )}
            </div>
          </>
        ) : (
          <Text type="secondary">Aucune donnée de la demande</Text>
        )}
      </Card>
    </div>
  );
}
