"use client";

import React, { useEffect, useState } from "react";
import {
  Typography,
  Card,
  Descriptions,
  Tag,
  Rate,
  Space,
  Button,
  Input,
  Popconfirm,
  Spin,
} from "antd";
import type { DescriptionsProps } from "antd";
import { useParams, useRouter } from "next/navigation";
import styles from "../../../../../requests/feature/manage/ui/RequestDetails/RequestDetails.module.scss";

const { Title, Text } = Typography;

type ReviewRow = {
  id: string;
  clientName: string;
  comment?: string | null;
  rating?: number | null;
  status: "Brouillon" | "Publié" | "Masqué";
  date?: string | null;
  updatedAt: string;
  adminReply?: string | null;
  adminReplyDate?: string | null;
  adminReplyAuthor?: string | null;
};

type DescriptionItem = NonNullable<DescriptionsProps["items"]>[number];

export default function AdminReviewDetailsPage() {
  const routeParams = useParams<{ id: string }>();
  const router = useRouter();

  const [reviewData, setReviewData] = useState<ReviewRow | null>(null);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replying, setReplying] = useState<boolean>(false);
  const [replyDraft, setReplyDraft] = useState<string>("");
  const [publishingReplyId, setPublishingReplyId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const aborter = new AbortController();
    async function loadSingleReview() {
      try {
        setIsPageLoading(true);
        setErrorMessage("");
        const id = routeParams?.id;
        if (!id) {
          setErrorMessage("L’identifiant de l’avis est absent dans l’URL.");
          return;
        }
        const response = await fetch(
          `/api/reviews?id=${encodeURIComponent(String(id))}`,
          {
            method: "GET",
            credentials: "include",
            signal: aborter.signal,
            headers: { Accept: "application/json" },
          }
        );
        if (response.status === 401) {
          return;
        }
        if (response.status === 404) {
          setErrorMessage("Avis introuvable ou déjà supprimé.");
          return;
        }
        if (!response.ok)
          throw new Error(`Erreur de chargement: ${response.status}`);
        const payload = await response.json();
        const one: ReviewRow | null =
          (payload?.item as ReviewRow) ??
          (Array.isArray(payload?.items) && payload.items.length > 0
            ? (payload.items[0] as ReviewRow)
            : null);
        if (!one) {
          setErrorMessage("L’avis est absent dans la réponse du serveur.");
          return;
        }
        setReviewData(one);
      } catch (e) {
        const readable = e instanceof Error ? e.message : "Erreur inconnue";
        setErrorMessage(readable);
        setActionError(readable);
      } finally {
        setIsPageLoading(false);
      }
    }
    loadSingleReview();
    return () => aborter.abort();
  }, [routeParams?.id]);

  async function handleApprove() {
    if (!reviewData) return;
    try {
      setApprovingId(reviewData.id);
      const response = await fetch(
        `/api/reviews?id=${encodeURIComponent(reviewData.id)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status: "Publié" }),
        }
      );
      if (response.status === 401) {
        setActionError("Session invalide");
        return;
      }
      if (response.status === 404) {
        setErrorMessage("Avis introuvable.");
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { item } = (await response.json()) as { item: ReviewRow };
      setReviewData(item);
      setActionError(""); // status updated
    } catch (e) {
      const readable = e instanceof Error ? e.message : "Erreur inconnue";
      setActionError(readable);
    } finally {
      setApprovingId(null);
    }
  }

  async function handlePublishReply() {
    if (!reviewData) return;
    try {
      setPublishingReplyId(reviewData.id);
      const response = await fetch(
        `/api/reviews?id=${encodeURIComponent(reviewData.id)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ adminReply: replyDraft || "" }),
        }
      );
      if (response.status === 401) {
        setActionError("Session invalide");
        return;
      }
      if (response.status === 404) {
        setActionError("Avis introuvable");
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { item } = (await response.json()) as { item: ReviewRow };
      setReviewData(item);
      setReplying(false);
      setReplyDraft("");
      setActionError(""); // reply published
    } catch (e) {
      const readable = e instanceof Error ? e.message : "Erreur inconnue";
      setActionError(readable);
    } finally {
      setPublishingReplyId(null);
    }
  }

  async function handleDelete() {
    if (!reviewData) return;
    try {
      setDeletingId(reviewData.id);
      const response = await fetch(
        `/api/reviews?id=${encodeURIComponent(reviewData.id)}`,
        { method: "DELETE", credentials: "include" }
      );
      if (response.status === 401) {
        setActionError("Session invalide");
        return;
      }
      if (response.status === 404) {
        setActionError("Avis introuvable");
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setActionError(""); // deleted
      router.push("/admin/reviews");
    } catch (e) {
      const readable = e instanceof Error ? e.message : "Erreur inconnue";
      setActionError(readable);
    } finally {
      setDeletingId(null);
    }
  }

  const statusTag = (s?: ReviewRow["status"]) => {
    if (!s) return <Text type="secondary">—</Text>;
    const color =
      s === "Publié" ? "green" : s === "Brouillon" ? "default" : "orange";
    return <Tag color={color}>{s}</Tag>;
  };

  const buildDescriptionItems = (review: ReviewRow): DescriptionItem[] => {
    const items: Array<DescriptionItem | null> = [
      {
        key: "clientName",
        label: "Client",
        children: <Text>{review.clientName}</Text>,
      },
      {
        key: "comment",
        label: "Avis",
        children: review.comment ? (
          <Text>{review.comment}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
      },
      {
        key: "rating",
        label: "Note",
        children:
          typeof review.rating === "number" ? (
            <Rate disabled value={review.rating} />
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        key: "updatedAt",
        label: "Date",
        children: <Text>{new Date(review.updatedAt).toLocaleString()}</Text>,
      },
      {
        key: "status",
        label: "Statut",
        children: statusTag(review.status),
      },
      review.adminReply
        ? {
            key: "adminReply",
            label: "Réponse admin",
            children: <Text>{review.adminReply}</Text>,
          }
        : null,
    ];
    return items.filter((item): item is DescriptionItem => item !== null);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>
          Détail de l’avis
        </Title>
        <Button onClick={() => router.push("/admin/reviews")}>Retour</Button>
      </div>

      <Card className={styles.card}>
        {isPageLoading ? (
          <div className={styles.loadingWrap}>
            <Spin size="large" />
          </div>
        ) : errorMessage ? (
          <Text type="danger">Informations techniques: {errorMessage}</Text>
        ) : reviewData ? (
          <>
            <Descriptions
              bordered
              column={1}
              size="middle"
              className={styles.descriptionsRoot}
              items={buildDescriptionItems(reviewData)}
            />

            <div className={styles.actions}>
              <Space wrap>
                <Popconfirm
                  title="Publier l'avis ?"
                  okText="Publier"
                  cancelText="Annuler"
                  onConfirm={handleApprove}
                  disabled={reviewData.status === "Publié"}
                >
                  <Button
                    type="primary"
                    disabled={reviewData.status === "Publié"}
                    loading={approvingId === reviewData.id}
                  >
                    Accorder
                  </Button>
                </Popconfirm>

                <Button
                  onClick={() => setReplying((v) => !v)}
                  disabled={publishingReplyId === reviewData.id}
                >
                  Répondre
                </Button>

                <Popconfirm
                  title="Supprimer l'avis?"
                  okText="Supprimer"
                  cancelText="Annuler"
                  okButtonProps={{ danger: true }}
                  onConfirm={handleDelete}
                >
                  <Button danger loading={deletingId === reviewData.id}>
                    Supprimer
                  </Button>
                </Popconfirm>
              </Space>
              {actionError && (
                <div className={styles.errorRow} role="alert">
                  <Text type="danger">{actionError}</Text>
                </div>
              )}
            </div>

            {replying && (
              <div className={styles.replyBox}>
                <Input.TextArea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="Votre réponse…"
                  maxLength={4000}
                  autoSize={{ minRows: 3, maxRows: 8 }}
                  onKeyDown={(e) => {
                    const isSubmit =
                      (e.metaKey || e.ctrlKey) && e.key === "Enter";
                    if (isSubmit && replyDraft.trim()) {
                      e.preventDefault();
                      handlePublishReply();
                    }
                  }}
                />
                <div className={styles.replyActions}>
                  <Button
                    type="primary"
                    onClick={handlePublishReply}
                    disabled={!replyDraft.trim()}
                    loading={publishingReplyId === reviewData.id}
                  >
                    Publier
                  </Button>
                  <Button
                    onClick={() => {
                      setReplying(false);
                      setReplyDraft("");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Text type="secondary">Aucune donnée d’avis</Text>
        )}
      </Card>
    </div>
  );
}
