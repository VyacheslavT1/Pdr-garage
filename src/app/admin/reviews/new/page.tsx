"use client"; // Клиентская страница: интерактивная форма + POST-запрос

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Card,
  Form,
  Input,
  DatePicker,
  Button,
  message,
  Rate,
  Select,
} from "antd";
import type { Dayjs } from "dayjs";
import AdminNav from "../../shared/AdminNav/AdminNav";
import styles from "./AdminReviewNew.module.scss";

const { Title } = Typography;

// 1) Тип значений формы создания отзыва (имена соответствуют API POST /api/reviews)
type CreateReviewFormValues = {
  clientName: string; // Имя автора (обязательно)
  rating?: number | null; // Рейтинг 1–5 или null
  status: "Черновик" | "Опубликовано" | "Скрыто"; // Статус публикации
  date?: Dayjs | null; // Дата отзыва (можно не указывать)
};

export default function AdminReviewNewPage() {
  const routerInstance = useRouter();

  // 2) Экземпляр формы + индикатор отправки
  const [formInstance] = Form.useForm<CreateReviewFormValues>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 3) Сабмит формы: отправляем POST /api/reviews.
  //    targetStatus позволяет одной и той же формой сохранять черновик или публиковать.
  async function handleSubmit(
    formValues: CreateReviewFormValues,
    targetStatus: CreateReviewFormValues["status"]
  ) {
    try {
      setIsSubmitting(true);

      // 3.1) Готовим полезную нагрузку для API
      const payload = {
        clientName: formValues.clientName.trim(),
        rating:
          formValues.rating === null || typeof formValues.rating === "number"
            ? formValues.rating
            : undefined,
        status: targetStatus,
        date: formValues.date ? formValues.date.toDate().toISOString() : null,
      };

      // 3.2) Отправляем запрос
      const response = await fetch("/api/reviews", {
        method: "POST",
        credentials: "include", // отправляем httpOnly-cookie
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      // 3.3) Обработка типовых ответов
      if (response.status === 401) {
        message.error("Сессия недействительна. Войдите заново.");
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

      // 3.4) Успех — тост и переход к списку
      message.success(
        targetStatus === "Опубликовано"
          ? "Отзыв создан и опубликован"
          : "Черновик отзыва сохранён"
      );
      routerInstance.push("/admin/reviews");
    } catch {
      message.error("Не удалось сохранить отзыв");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.pageRoot}>
      <AdminNav />

      {/* Шапка страницы */}
      <div className={styles.headerRow}>
        <Title level={3} className={styles.titleReset}>
          Новый отзыв
        </Title>
      </div>

      <Card className={styles.formCard}>
        <Form<CreateReviewFormValues>
          layout="vertical"
          className={styles.formGrid}
          form={formInstance}
          initialValues={{ status: "Черновик" }}
          // Обычный submit — «Сохранить как черновик»
          onFinish={(formValues) => handleSubmit(formValues, "Черновик")}
          requiredMark={false}
          validateTrigger={["onBlur", "onSubmit"]}
        >
          {/* Имя автора */}
          <Form.Item
            label="Имя"
            name="clientName"
            rules={[
              { required: true, message: "Укажите имя" },
              { max: 120, message: "Имя слишком длинное" },
            ]}
          >
            <Input placeholder="Имя автора" />
          </Form.Item>

          {/* Рейтинг (можно очистить до «без рейтинга») */}
          <Form.Item label="Рейтинг" name="rating">
            <Rate allowClear />
          </Form.Item>

          {/* Статус публикации */}
          <Form.Item
            label="Статус"
            name="status"
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

          {/* Дата отзыва (опционально) */}
          <Form.Item label="Дата" name="date">
            <DatePicker style={{ width: "100%" }} placeholder="Выберите дату" />
          </Form.Item>

          {/* Кнопки действий */}
          <div className={styles.buttonsRow}>
            <Button onClick={() => routerInstance.push("/admin/reviews")}>
              Отмена
            </Button>

            {/* Сохранить как черновик — обычный submit */}
            <Button type="default" htmlType="submit" loading={isSubmitting}>
              Сохранить как черновик
            </Button>

            {/* Сохранить и опубликовать — валидируем форму и отправляем со статусом 'Опубликовано' */}
            <Button
              type="primary"
              loading={isSubmitting}
              onClick={async () => {
                try {
                  const validValues = await formInstance.validateFields();
                  await handleSubmit(validValues, "Опубликовано");
                } catch {
                  // Ошибки валидации подсветит форма
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
