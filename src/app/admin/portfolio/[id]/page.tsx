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
  DatePicker,
  Button,
  message,
  Spin,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import AdminNav from "../../shared/AdminNav/AdminNav";

const { Title } = Typography;
const { Option } = Select;

// 1) Тип значений формы. АнтД DatePicker работает с Dayjs, поэтому здесь Dayjs | null.
type EditPortfolioFormValues = {
  titleRu: string; // Название кейса (RU)
  category: string; // Категория
  publishedAt?: Dayjs | null; // Дата публикации (может быть null)
  status: "Черновик" | "Опубликовано" | "Скрыто"; // Текущий статус
  orderIndex: number; // Порядок сортировки
};

export default function AdminPortfolioEditPage() {
  // 2) Идентификатор кейса из URL — имена переменных оставляем прежними
  const routeParams = useParams<{ id: string }>();
  const currentPortfolioId = routeParams.id;

  // 3) Роутер и экземпляр формы
  const routerInstance = useRouter();
  const [formInstance] = Form.useForm<EditPortfolioFormValues>();

  // 4) Состояния страницы
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true); // индикатор загрузки данных
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // индикатор сохранения

  // 5) Загрузка данных кейса при монтировании
  useEffect(() => {
    let isComponentActive = true;

    async function loadPortfolioItem() {
      try {
        setIsPageLoading(true);

        const response = await fetch(
          `/api/portfolio?id=${encodeURIComponent(currentPortfolioId)}`,
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
          message.error("Кейс не найден");
          routerInstance.push("/admin/portfolio");
          return;
        }
        if (!response.ok) {
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }

        // Ожидаем структуру { item: { ... } }
        const payload = (await response.json()) as {
          item: {
            id: string;
            titleRu: string;
            category: string;
            publishedAt?: string | null;
            status: "Черновик" | "Опубликовано" | "Скрыто";
            orderIndex: number;
            updatedAt: string;
          };
        };

        if (!isComponentActive) return;

        // Преобразуем ISO-дату в Dayjs для DatePicker
        const nextPublishedAt: Dayjs | null = payload.item.publishedAt
          ? dayjs(payload.item.publishedAt)
          : null;

        // Заполняем форму начальными значениями
        formInstance.setFieldsValue({
          titleRu: payload.item.titleRu,
          category: payload.item.category,
          publishedAt: nextPublishedAt,
          status: payload.item.status,
          orderIndex: payload.item.orderIndex,
        });
      } catch {
        message.error("Не удалось загрузить кейс");
      } finally {
        if (isComponentActive) setIsPageLoading(false);
      }
    }

    loadPortfolioItem();
    return () => {
      isComponentActive = false;
    };
  }, [currentPortfolioId, formInstance, routerInstance]);

  // 6) Сабмит формы: отправка PUT /api/portfolio?id=<id>.
  //    Аргумент targetStatus позволяет сохранить как черновик или опубликовать.
  async function handleSubmit(
    formValues: EditPortfolioFormValues,
    targetStatus: EditPortfolioFormValues["status"]
  ) {
    try {
      setIsSubmitting(true);

      // Собираем полезную нагрузку для API.
      const payload = {
        titleRu: formValues.titleRu.trim(),
        category: formValues.category.trim(),
        publishedAt: formValues.publishedAt
          ? formValues.publishedAt.toDate().toISOString()
          : null,
        status: targetStatus,
        orderIndex: Number(formValues.orderIndex ?? 0),
      };

      const response = await fetch(
        `/api/portfolio?id=${encodeURIComponent(currentPortfolioId)}`,
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
        message.error("Кейс не найден");
        routerInstance.push("/admin/portfolio");
        return;
      }
      if (response.status === 400) {
        // Серверная валидация: показываем первую ошибку из details
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
          ? "Изменения сохранены и кейс опубликован"
          : "Изменения сохранены (черновик)"
      );
      routerInstance.push("/admin/portfolio");
    } catch {
      message.error("Не удалось сохранить изменения");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 7) Плейсхолдер загрузки
  if (isPageLoading) {
    return (
      <div style={{ display: "grid", gap: "1rem", padding: "1.5rem" }}>
        <AdminNav />
        <Spin />
      </div>
    );
  }

  // 8) Разметка формы редактирования кейса
  return (
    <div style={{ display: "grid", gap: "1rem", padding: "1.5rem" }}>
      <AdminNav />

      <Title level={3} style={{ margin: 0 }}>
        Редактировать кейс
      </Title>

      <Card>
        <Form<EditPortfolioFormValues>
          layout="vertical"
          form={formInstance}
          // Сохранить как черновик — стандартный submit
          onFinish={(formValues) => handleSubmit(formValues, "Черновик")}
          requiredMark={false}
          validateTrigger={["onBlur", "onSubmit"]}
        >
          {/* Название кейса */}
          <Form.Item
            label="Название (RU)"
            name="titleRu"
            rules={[
              { required: true, message: "Укажите название" },
              { max: 120, message: "Слишком длинное название" },
            ]}
          >
            <Input placeholder="Например: Удаление вмятины на двери" />
          </Form.Item>

          {/* Категория */}
          <Form.Item
            label="Категория"
            name="category"
            rules={[
              { required: true, message: "Выберите или укажите категорию" },
              { max: 100, message: "Слишком длинная категория" },
            ]}
          >
            {/* Можно выбрать из списка или ввести своё значение (mode="tags") */}
            <Select
              mode="tags"
              tokenSeparators={[","]}
              placeholder="Выберите или введите категорию"
            >
              <Option value="Вмятины без покраски">Вмятины без покраски</Option>
              <Option value="Полировка">Полировка</Option>
              <Option value="Стекло">Стекло</Option>
            </Select>
          </Form.Item>

          {/* Дата публикации — необязательная */}
          <Form.Item label="Дата публикации" name="publishedAt">
            <DatePicker style={{ width: "100%" }} placeholder="Выберите дату" />
          </Form.Item>

          {/* Статус публикации (актуальное значение). 
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

          {/* Порядок сортировки */}
          <Form.Item
            label="Порядок"
            name="orderIndex"
            tooltip="Число для ручной сортировки кейсов на сайте"
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

          {/* Кнопки действий */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <Button onClick={() => routerInstance.push("/admin/portfolio")}>
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
