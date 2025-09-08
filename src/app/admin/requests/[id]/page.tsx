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
  message,
  Spin,
  Popconfirm,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import AdminNav from "../../shared/AdminNav/AdminNav";
import styles from "./RequestDetails.module.css";

const { Title, Text } = Typography;

// Тип заявки — совпадает по полям с тем, что вы используете на общей странице
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

export default function AdminRequestDetailsPage() {
  const routeParams = useParams<{ id: string }>();
  const nextRouter = useRouter();

  const [requestData, setRequestData] = useState<RequestRow | null>(null);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

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

        // Предполагаем, что GET /api/requests?id=... вернёт одну запись.
        // На случай альтернативной реализации поддержим оба варианта: { item } или { items }.
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
          message.error("Session invalide. Veuillez vous reconnecter.");
          return;
        }
        if (response.status === 404) {
          setErrorMessage("Demande introuvable ou déjà supprimée.");
          return;
        }
        if (!response.ok) {
          throw new Error(`Erreur de chargement: ${response.status}`);
        }

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
        message.error("Impossible de charger les données de la demande");
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
      (fileItem) => !!fileItem?.dataUrl && typeof fileItem.dataUrl === "string"
    );

  // ⬇️ Экспорт ТОЛЬКО этой заявки в CSV
  function buildCsvContentFromSingleRequest(single: RequestRow): string {
    const headerColumns = [
      "id",
      "createdAt",
      "clientGender",
      "clientName",
      "phone",
      "email",
      "comment",
      "status",
    ];
    const escapeCsvCell = (value: unknown) => {
      const stringValue =
        value === null || value === undefined ? "" : String(value);
      return /[",\n\r]/.test(stringValue)
        ? `"${stringValue.replace(/"/g, '""')}"`
        : stringValue;
    };
    const dataLine = [
      escapeCsvCell(single.id),
      escapeCsvCell(single.createdAt),
      escapeCsvCell(single.gender),
      escapeCsvCell(single.clientName),
      escapeCsvCell(single.phone),
      escapeCsvCell(single.email),
      escapeCsvCell(single.comment ?? ""),
      escapeCsvCell(single.status),
    ].join(",");
    return [headerColumns.join(","), dataLine].join("\n");
  }

  function handleExportSingleRequestCsvClick() {
    if (!requestData) {
      message.warning("Les données de la demande ne sont pas encore chargées");
      return;
    }
    const utf8Bom = "\uFEFF";
    const csvContent = buildCsvContentFromSingleRequest(requestData);
    const csvBlob = new Blob([utf8Bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fileName = `request_${requestData.id}_${now.getFullYear()}${pad(
      now.getMonth() + 1
    )}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`;
    const blobUrl = URL.createObjectURL(csvBlob);
    const tempLinkElement = document.createElement("a");
    tempLinkElement.href = blobUrl;
    tempLinkElement.download = fileName;
    document.body.appendChild(tempLinkElement);
    tempLinkElement.click();
    document.body.removeChild(tempLinkElement);
    URL.revokeObjectURL(blobUrl);
  }

  // ⬇️ Переключение статуса конкретной заявки
  async function handleToggleProcessedOnDetails() {
    if (!requestData) return;
    const nextStatus: RequestRow["status"] =
      requestData.status === "Traité" ? "Non traité" : "Traité";
    try {
      const response = await fetch(
        `/api/requests?id=${encodeURIComponent(requestData.id)}`,
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
        return;
      }
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      setRequestData((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      message.success(
        nextStatus === "Traité"
          ? `Demande ${requestData.id} marquée comme traitée`
          : `Statut de la demande ${requestData.id} remis à « Non traité »`
      );
    } catch {
      message.error("Échec de la modification du statut de la demande");
    }
  }

  // ⬇️ Удаление заявки с переходом назад к списку
  async function handleDeleteRequestOnDetails() {
    if (!requestData) return;
    try {
      const response = await fetch(
        `/api/requests?id=${encodeURIComponent(requestData.id)}`,
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
        message.success("La demande a déjà été supprimée");
        window.location.href = "/admin/requests";
        return;
      }
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      message.success("Demande supprimée");
      window.location.href = "/admin/requests";
    } catch {
      message.error("Échec de la suppression de la demande");
    }
  }

  return (
    <div className={styles.pageRoot}>
      <AdminNav />

      <div className={styles.headerRow}>
        <Title level={3} className={styles.titleReset}>
          {requestData?.id ? `#${requestData.id}` : null}
        </Title>

        <div className={styles.actionsRight}>
          <Space>
            <Button onClick={() => nextRouter.push("/admin/requests")}>
              Vers la liste des demandes
            </Button>
          </Space>
        </div>
      </div>

      <Card className={styles.cardTopMargin}>
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
              column={{ xs: 1, sm: 1, md: 2, lg: 2 }}
              size="middle"
              className={styles.descriptionsRoot}
              items={[
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
              ]}
            />

            <div className={styles.actionsBarBelow}>
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
            </div>

            <div className={styles.photosSection}>
              <Title level={5} className={styles.photosTitle}>
                Photos
              </Title>

              {hasImages ? (
                <Image.PreviewGroup>
                  <div className={styles.photosGrid}>
                    {requestData
                      .attachments!.filter(
                        (fileItem) =>
                          !!fileItem?.dataUrl &&
                          typeof fileItem.dataUrl === "string"
                      )
                      .map((fileItem) => (
                        <Image
                          key={fileItem.id}
                          src={fileItem.dataUrl!}
                          alt={fileItem.name}
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
