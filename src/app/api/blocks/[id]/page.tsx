"use client"; // Клиентская страница: загрузка данных, форма, сохранение, тосты

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Typography,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  message,
  Spin,
} from "antd";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import AdminNav from "@/app/admin/shared/AdminNav/AdminNav";
import styles from "./AdminBlockEdit.module.scss";

const { Title } = Typography;
const { Dragger } = Upload;

// Тип данных формы — совпадает с созданием
type EditBlockFormValues = {
  slug: string;
  orderIndex: number;
  status: "Черновик" | "Опубликовано" | "Скрыто";
  titleRu: string;
  subtitleRu?: string;
  descriptionRu?: string;
  ctaText?: string;
  ctaLink?: string;
  coverFileList?: UploadFile[];
  galleryFileList?: UploadFile[];
};

export default function AdminBlockEditPage() {
  const routerInstance = useRouter();
  const routeParams = useParams<{ id: string }>(); // id из URL
  const currentBlockId = routeParams.id;

  const [formInstance] = Form.useForm<EditBlockFormValues>();

  // Локальные состояния страницы
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true); // загрузка данных блока
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // отправка формы
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]); // список файлов «обложка»
  const [galleryFileList, setGalleryFileList] = useState<UploadFile[]>([]); // список файлов «галерея»

  // Валидация изображений (как на создании)
  function validateBeforeUpload(incomingFile: File) {
    const isImageType = ["image/jpeg", "image/png", "image/webp"].includes(
      incomingFile.type
    );
    if (!isImageType) {
      message.error("Разрешены только изображения JPG/PNG/WebP");
      return Upload.LIST_IGNORE;
    }
    const isWithinSize = incomingFile.size <= 2 * 1024 * 1024;
    if (!isWithinSize) {
      message.error("Максимальный размер файла — 2 MB");
      return Upload.LIST_IGNORE;
    }
    return true;
  }

  const emulateImmediateOk: UploadProps["customRequest"] = ({ onSuccess }) => {
    window.setTimeout(
      () => onSuccess && onSuccess({ ok: true } as unknown as any),
      150
    );
  };
  function normalizeUploadValue(uploadEvent: any): UploadFile[] {
    if (Array.isArray(uploadEvent)) return uploadEvent as UploadFile[];
    return uploadEvent?.fileList ?? [];
  }

  // Загрузка данных блока при монтировании
  useEffect(() => {
    let isActive = true;
    async function loadBlock() {
      try {
        setIsPageLoading(true);
        const response = await fetch(
          `/api/blocks?id=${encodeURIComponent(currentBlockId)}`,
          {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }
        );

        if (response.status === 401) {
          message.error("Сессия недействительна. Войдите заново.");
          routerInstance.push("/admin/login");
          return;
        }
        if (response.status === 404) {
          message.error("Блок не найден");
          routerInstance.push("/admin/blocks");
          return;
        }
        if (!response.ok) {
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }

        const payload = (await response.json()) as {
          item: {
            id: string;
            titleRu: string;
            slug: string;
            status: "Черновик" | "Опубликовано" | "Скрыто";
            orderIndex: number;
            subtitleRu?: string;
            descriptionRu?: string;
            ctaText?: string;
            ctaLink?: string;
            cover?: string | null;
            gallery?: string[];
          };
        };

        if (!isActive) return;

        // Преобразуем существующие cover/gallery в UploadFile[] (демо: только имя)
        const nextCoverFileList: UploadFile[] = payload.item.cover
          ? [
              {
                uid: "cover-0",
                name: payload.item.cover,
                status: "done",
                url: "#",
                thumbUrl: "",
              },
            ]
          : [];
        const nextGalleryFileList: UploadFile[] = (
          payload.item.gallery ?? []
        ).map((fileName, indexNumber) => ({
          uid: `gal-${indexNumber}`,
          name: fileName,
          status: "done",
          url: "#",
          thumbUrl: "",
        }));

        setCoverFileList(nextCoverFileList);
        setGalleryFileList(nextGalleryFileList);

        // Устанавливаем начальные значения формы
        formInstance.setFieldsValue({
          slug: payload.item.slug,
          orderIndex: payload.item.orderIndex,
          status: payload.item.status,
          titleRu: payload.item.titleRu,
          subtitleRu: payload.item.subtitleRu ?? "",
          descriptionRu: payload.item.descriptionRu ?? "",
          ctaText: payload.item.ctaText ?? "",
          ctaLink: payload.item.ctaLink ?? "",
          coverFileList: nextCoverFileList,
          galleryFileList: nextGalleryFileList,
        });
      } catch {
        message.error("Не удалось загрузить данные блока");
      } finally {
        if (isActive) setIsPageLoading(false);
      }
    }
    loadBlock();
    return () => {
      isActive = false;
    };
  }, [currentBlockId, formInstance, routerInstance]);

  // Сабмит: PUT /api/blocks?id=<id>
  async function handleSubmit(
    formValues: EditBlockFormValues,
    targetStatus: EditBlockFormValues["status"]
  ) {
    try {
      setIsSubmitting(true);

      const payload = {
        slug: formValues.slug.trim(),
        orderIndex: Number(formValues.orderIndex ?? 0),
        status: targetStatus,
        titleRu: formValues.titleRu.trim(),
        subtitleRu: (formValues.subtitleRu ?? "").trim(),
        descriptionRu: (formValues.descriptionRu ?? "").trim(),
        ctaText: (formValues.ctaText ?? "").trim(),
        ctaLink: (formValues.ctaLink ?? "").trim(),
        cover: coverFileList[0]?.name ?? null,
        gallery: galleryFileList.map((file) => file.name),
      };

      const response = await fetch(
        `/api/blocks?id=${encodeURIComponent(currentBlockId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 401) {
        message.error("Сессия недействительна. Войдите заново.");
        return;
      }
      if (response.status === 404) {
        message.error("Блок не найден");
        routerInstance.push("/admin/blocks");
        return;
      }
      if (response.status === 400) {
        const validationBody = await response.json().catch(() => null);
        const firstError =
          (validationBody?.details &&
            Object.values(validationBody.details)[0]) ||
          "Проверьте корректность полей";
        message.error(String(firstError));
        return;
      }
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      message.success(
        targetStatus === "Опубликовано"
          ? "Изменения сохранены и опубликованы"
          : "Изменения сохранены (черновик)"
      );

      routerInstance.push("/admin/blocks");
    } catch {
      message.error("Не удалось сохранить изменения");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPageLoading) {
    return (
      <div className={styles.pageRoot}>
        <AdminNav />
        <Spin />
      </div>
    );
  }

  return (
    <div className={styles.pageRoot}>
      <AdminNav />

      <div className={styles.headerRow}>
        <Title level={3} className={styles.titleReset}>
          Редактировать блок
        </Title>
      </div>

      <Card className={styles.formCard}>
        <Form<EditBlockFormValues>
          layout="vertical"
          className={styles.formGrid}
          form={formInstance}
          onFinish={(formValues) => handleSubmit(formValues, "Черновик")}
          requiredMark={false}
          validateTrigger={["onBlur", "onSubmit"]}
        >
          {/* Служебные поля */}
          <div className={styles.serviceRow}>
            <Form.Item
              label="Ключ блока"
              name="slug"
              tooltip="Уникальный служебный идентификатор блока (например, 'about' или 'services')"
              rules={[
                { required: true, message: "Укажите ключ блока" },
                { min: 2, message: "Минимум 2 символа" },
                {
                  pattern: /^[a-z0-9-]+$/,
                  message: "Только строчные латинские буквы, цифры и дефис",
                },
              ]}
            >
              <Input placeholder="about" />
            </Form.Item>

            <Form.Item
              label="Порядок"
              name="orderIndex"
              tooltip="Число для ручной сортировки секций на сайте"
              rules={[
                {
                  type: "number",
                  min: 0,
                  message: "Значение не может быть отрицательным",
                },
              ]}
            >
              <InputNumber style={{ width: "100%" }} placeholder="0" />
            </Form.Item>

            <Form.Item
              label="Статус"
              name="status"
              tooltip="Публикационный статус записи"
              rules={[{ required: true, message: "Выберите статус" }]}
            >
              <Select
                options={[
                  { value: "Черновик", label: "Черновик" },
                  { value: "Опубликовано", label: "Опубликовано" },
                  { value: "Скрыто", label: "Скрыто" },
                ]}
              />
            </Form.Item>
          </div>

          {/* Контент RU */}
          <Form.Item
            label="Заголовок (RU)"
            name="titleRu"
            rules={[
              { required: true, message: "Укажите заголовок (RU)" },
              { max: 120, message: "Максимум 120 символов" },
            ]}
          >
            <Input placeholder="Например: О нас" />
          </Form.Item>

          <Form.Item
            label="Подзаголовок (RU)"
            name="subtitleRu"
            rules={[{ max: 200, message: "Максимум 200 символов" }]}
          >
            <Input placeholder="Краткое пояснение" />
          </Form.Item>

          <Form.Item
            label="Описание (RU)"
            name="descriptionRu"
            rules={[{ max: 2000, message: "Слишком длинное описание" }]}
          >
            <Input.TextArea placeholder="Текст описания" rows={5} />
          </Form.Item>

          {/* Медиа */}
          <div className={styles.uploadRow}>
            <Form.Item
              label="Обложка (1 изображение)"
              name="coverFileList"
              valuePropName="fileList"
              getValueFromEvent={normalizeUploadValue}
              tooltip="JPG/PNG/WebP, до 2 MB, минимально 1200×800"
            >
              <Dragger
                multiple={false}
                maxCount={1}
                beforeUpload={validateBeforeUpload}
                customRequest={emulateImmediateOk}
                fileList={coverFileList}
                onChange={(info) => setCoverFileList(info.fileList)}
                accept=".jpg,.jpeg,.png,.webp"
              >
                <p className="ant-upload-drag-icon">📤</p>
                <p className="ant-upload-text">
                  Перетащите файл или нажмите для выбора
                </p>
                <p className="ant-upload-hint">Одно изображение</p>
              </Dragger>
            </Form.Item>

            <Form.Item
              label="Галерея (несколько изображений)"
              name="galleryFileList"
              valuePropName="fileList"
              getValueFromEvent={normalizeUploadValue}
              tooltip="JPG/PNG/WebP, до 2 MB каждое; порядок можно менять перетаскиванием"
            >
              <Dragger
                multiple
                beforeUpload={validateBeforeUpload}
                customRequest={emulateImmediateOk}
                fileList={galleryFileList}
                onChange={(info) => setGalleryFileList(info.fileList)}
                accept=".jpg,.jpeg,.png,.webp"
              >
                <p className="ant-upload-drag-icon">🖼️</p>
                <p className="ant-upload-text">
                  Перетащите файлы или нажмите для выбора
                </p>
                <p className="ant-upload-hint">Можно выбрать несколько</p>
              </Dragger>
            </Form.Item>
          </div>

          {/* CTA */}
          <Form.Item
            label="Текст кнопки (CTA)"
            name="ctaText"
            rules={[{ max: 40, message: "Максимум 40 символов" }]}
          >
            <Input placeholder="Например: Связаться" />
          </Form.Item>

          <Form.Item
            label="Ссылка кнопки (CTA)"
            name="ctaLink"
            tooltip="Допустимы http/https, mailto:, tel:, и внутренние якоря (#...)"
            rules={[
              {
                validator: async (_, value?: string) => {
                  if (!value) return;
                  const trimmed = value.trim();
                  const isAnchor = trimmed.startsWith("#");
                  const isTel = trimmed.startsWith("tel:");
                  const isMailto = trimmed.startsWith("mailto:");
                  const isHttp = /^https?:\/\//i.test(trimmed);
                  if (!(isAnchor || isTel || isMailto || isHttp)) {
                    throw new Error("Неверный формат ссылки");
                  }
                },
              },
            ]}
          >
            <Input placeholder="https://example.com или #contact или tel:+336..." />
          </Form.Item>

          {/* Кнопки действий */}
          <div className={styles.buttonsRow}>
            <Button onClick={() => routerInstance.push("/admin/blocks")}>
              Отмена
            </Button>
            <Button type="default" htmlType="submit" loading={isSubmitting}>
              Сохранить как черновик
            </Button>
            <Button
              type="primary"
              loading={isSubmitting}
              onClick={async () => {
                try {
                  const validValues = await formInstance.validateFields();
                  await handleSubmit(validValues, "Опубликовано");
                } catch {
                  /* ошибки валидации подсветятся формой */
                }
              }}
            >
              Сохранить и опубликовать
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
