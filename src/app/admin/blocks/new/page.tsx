"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "antd";

import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import AdminNav from "../../shared/AdminNav/AdminNav";
import styles from "./AdminBlockNew.module.scss";

const { Title, Text } = Typography;
const { Dragger } = Upload;

// Тип данных формы
type CreateBlockFormValues = {
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

export default function AdminBlockNewPage() {
  const routerInstance = useRouter();

  // ⬇️ ДОБАВЛЕНО: экземпляр формы AntD — нужен для кнопки «Опубликовать»
  const [formInstance] = Form.useForm<CreateBlockFormValues>();

  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);
  const [galleryFileList, setGalleryFileList] = useState<UploadFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const emulateImmediateOk: UploadProps["customRequest"] = ({
    file,
    onSuccess,
  }) => {
    window.setTimeout(() => {
      onSuccess && onSuccess({ ok: true } as unknown as any);
    }, 150);
  };

  function normalizeUploadValue(uploadEvent: any): UploadFile[] {
    if (Array.isArray(uploadEvent)) return uploadEvent as UploadFile[];
    return uploadEvent?.fileList ?? [];
  }

  async function handleSubmit(
    formValues: CreateBlockFormValues,
    targetStatus: CreateBlockFormValues["status"]
  ) {
    try {
      setIsSubmitting(true);

      // 1) Собираем полезную нагрузку (ровно те поля, что ждёт API)
      const payload = {
        slug: formValues.slug.trim(),
        orderIndex: Number(formValues.orderIndex ?? 0),
        status: targetStatus,
        titleRu: formValues.titleRu.trim(),
        subtitleRu: (formValues.subtitleRu ?? "").trim(),
        descriptionRu: (formValues.descriptionRu ?? "").trim(),
        ctaText: (formValues.ctaText ?? "").trim(),
        ctaLink: (formValues.ctaLink ?? "").trim(),
        // Пока без реальной загрузки файлов: передаём имена (как договорились)
        cover: coverFileList[0]?.name ?? null,
        gallery: galleryFileList.map((file) => file.name),
      };

      // 2) Отправляем POST /api/blocks (credentials: 'include' — для cookie)
      const response = await fetch("/api/blocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      // 3) Обработка типовых статусов (401, 400, 409)
      if (response.status === 401) {
        message.error("Сессия недействительна. Войдите заново.");
        return;
      }

      if (response.status === 409) {
        const conflictBody = await response.json().catch(() => null);
        const fieldMessage =
          conflictBody?.details?.slug ?? "Ключ блока уже существует";
        message.error(fieldMessage);
        return;
      }

      if (response.status === 400) {
        const validationBody = await response.json().catch(() => null);
        // Можно подсветить первую ошибку; детализированное сопоставление — позже
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

      // 4) Успех (201): показываем тост в зависимости от статуса и уходим на список
      message.success(
        targetStatus === "Опубликовано"
          ? "Блок сохранён и опубликован"
          : "Черновик блока сохранён"
      );

      routerInstance.push("/admin/blocks");
    } catch (caught) {
      message.error("Не удалось сохранить блок");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.pageRoot}>
      <AdminNav />

      <div className={styles.headerRow}>
        <Title level={3} className={styles.titleReset}>
          Новый блок
        </Title>
      </div>

      <Card className={styles.formCard}>
        <Form<CreateBlockFormValues>
          layout="vertical"
          className={styles.formGrid}
          // ⬇️ ДОБАВЛЕНО: привязываем форму к formInstance
          form={formInstance}
          initialValues={{ status: "Черновик", orderIndex: 0 }}
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

            {/* Сохранить черновик — стандартный submit, сработает onFinish */}
            <Button type="default" htmlType="submit" loading={isSubmitting}>
              Сохранить черновик
            </Button>

            {/* Опубликовать — валидируем форму и отправляем с целевым статусом */}
            <Button
              type="primary"
              loading={isSubmitting}
              onClick={async () => {
                try {
                  // ⬇️ ВАЖНО: не меняем onFinish, а отдельно валидируем и получаем значения
                  const validValues = await formInstance.validateFields();
                  await handleSubmit(validValues, "Опубликовано");
                } catch {
                  // validateFields сам подсветит ошибки — здесь можно ничего не делать
                }
              }}
            >
              Опубликовать
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
