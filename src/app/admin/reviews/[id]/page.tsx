"use client"; // Клиентская страница: загрузка данных, форма, сохранение, тосты

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Spin,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import AdminNav from "../../shared/AdminNav/AdminNav";
import styles from "./AdminReviewEdit.module.scss";

const { Title } = Typography;

// 1) Тип значений формы редактирования отзыва.
//    Используем Dayjs для поля даты, т.к. AntD DatePicker работает с dayjs-объектами.
type EditReviewFormValues = {
  clientName: string; // Имя автора отзыва
  rating?: number | null; // Рейтинг 1–5 или null
  status: "Черновик" | "Опубликовано" | "Скрыто"; // Текущий статус (в форме)
  date?: Dayjs | null; // Дата отзыва (Dayjs или null)
};

export default function AdminReviewEditPage() {
  // 2) Идентификатор из адресной строки /admin/reviews/[id]
  const routeParams = useParams<{ id: string }>();
  const currentReviewId = routeParams.id;

  // 3) Навигация и экземпляр формы
  const routerInstance = useRouter();
  const [formInstance] = Form.useForm<EditReviewFormValues>();

  // 4) Состояния страницы: загрузка данных и отправка формы
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 5) Загрузка данных отзыва при монтировании страницы
  useEffect(() => {
    let isComponentActive = true; // флаг, чтобы не сетать состояние после размонтирования

    async function loadReviewDetails() {
      try {
        setIsPageLoading(true);

        const response = await fetch(
          `/api/reviews?id=${encodeURIComponent(currentReviewId)}`,
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
          message.error("Отзыв не найден");
          routerInstance.push("/admin/reviews");
          return;
        }
        if (!response.ok) {
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }

        // Ожидаем структуру { item: { ... } } из API
        const payload = (await response.json()) as {
          item: {
            id: string;
            clientName: string;
            rating?: number | null;
            status: "Черновик" | "Опубликовано" | "Скрыто";
            date?: string | null;
            updatedAt: string;
          };
        };

        if (!isComponentActive) return;

        // 5.1) Преобразуем ISO-дату в Dayjs для DatePicker (или null, если не указана)
        const nextDateValue: Dayjs | null = payload.item.date
          ? dayjs(payload.item.date)
          : null;

        // 5.2) Устанавливаем начальные значения формы
        formInstance.setFieldsValue({
          clientName: payload.item.clientName,
          rating: payload.item.rating ?? null,
          status: payload.item.status,
          date: nextDateValue,
        });
      } catch {
        message.error("Не удалось загрузить данные отзыва");
      } finally {
        if (isComponentActive) setIsPageLoading(false);
      }
    }

    loadReviewDetails();
    return () => {
      isComponentActive = false;
    };
  }, [currentReviewId, formInstance, routerInstance]);

  // 6) Сабмит формы: отправляет PUT /api/reviews?id=<id>.
  //    Аргумент targetStatus позволяет одной кнопкой сохранить как черновик,
  //    другой — сохранить и опубликовать.
  async function handleSubmit(
    formValues: EditReviewFormValues,
    targetStatus: EditReviewFormValues["status"]
  ) {
    try {
      setIsSubmitting(true);

      // 6.1) Готовим полезную нагрузку для API.
      //      Дату конвертируем из Dayjs -> ISO-строку (или null).
      const payload = {
        clientName: formValues.clientName.trim(),
        rating:
          formValues.rating === null || typeof formValues.rating === "number"
            ? formValues.rating
            : undefined, // оставляем без изменения, если undefined
        status: targetStatus,
        date: formValues.date ? formValues.date.toDate().toISOString() : null,
      };

      // 6.2) Отправляем PUT
      const response = await fetch(
        `/api/reviews?id=${encodeURIComponent(currentReviewId)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 401) {
        message.error("Сессия недействительна. Войдите заново.");
        return;
      }
      if (response.status === 404) {
        message.error("Отзыв не найден");
        routerInstance.push("/admin/reviews");
        return;
      }
      if (response.status === 400) {
        // Валидация на сервере: показываем первую ошибку из details
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

      // 6.3) Успех: показываем тост и уходим на список
      message.success(
        targetStatus === "Опубликовано"
          ? "Изменения сохранены и опубликованы"
          : "Изменения сохранены (черновик)"
      );
      routerInstance.push("/admin/reviews");
    } catch {
      message.error("Не удалось сохранить изменения");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 7) Пока данные грузятся — показываем простой индикатор
  if (isPageLoading) {
    return (
      <div className={styles.pageRoot}>
        <AdminNav />
        <Spin />
      </div>
    );
  }

  // 8) Разметка формы (минимальные поля для редактирования отзыва)
  return (
    <div className={styles.pageRoot}>
      <AdminNav />

      <div className={styles.headerRow}>
        <Title level={3} className={styles.titleReset}>
          Редактировать отзыв
        </Title>
      </div>

      <Card className={styles.card}>
        <Form<EditReviewFormValues>
          layout="vertical"
          form={formInstance}
          // Сохраняем как черновик по умолчанию через стандартный submit:
          onFinish={(formValues) => handleSubmit(formValues, "Черновик")}
          requiredMark={false}
          validateTrigger={["onBlur", "onSubmit"]}
        >
          {/* Имя автора отзыва */}
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

          {/* Рейтинг: 1–5 звёзд или можно очистить до «без рейтинга» */}
          <Form.Item label="Рейтинг" name="rating">
            <Rate allowClear />
          </Form.Item>

          {/* Статус публикации (актуальный). 
              Кнопка «Сохранить и опубликовать» всё равно задаст статус 'Опубликовано'. */}
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

          {/* Дата отзыва: можно оставить пустой (null) */}
          <Form.Item label="Дата" name="date">
            <DatePicker style={{ width: "100%" }} placeholder="Выберите дату" />
          </Form.Item>

          {/* Кнопки действий */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <Button onClick={() => routerInstance.push("/admin/reviews")}>
              Отмена
            </Button>

            {/* Сохранить как черновик — обычный submit формы */}
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
                  // Ошибки валидации подсветит сама форма
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
