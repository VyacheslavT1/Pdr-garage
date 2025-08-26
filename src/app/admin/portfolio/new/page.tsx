"use client"; // Клиентская страница: интерактивная форма, валидация, POST-запрос

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // нужен для перехода обратно к списку после сохранения
import {
  Typography,
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  message,
} from "antd";
import type { Dayjs } from "dayjs";
import AdminNav from "../../shared/AdminNav/AdminNav"; // верхняя навигация админки
import styles from "./AdminPortfolioNew.module.scss";

const { Title } = Typography;
const { Option } = Select;

// 1) Тип значений формы создания кейса.
//    Важно: имена полей совпадают с теми, что ждёт наш API POST /api/portfolio.
type CreatePortfolioFormValues = {
  titleRu: string; // Название кейса (RU) — обязательно
  category: string; // Категория — обязательно
  publishedAt?: Dayjs | null; // Дата публикации — можно оставить пустой
  status: "Черновик" | "Опубликовано" | "Скрыто"; // Публикационный статус — обязателен
  orderIndex: number; // Порядок сортировки — число ≥ 0
};

export default function AdminPortfolioNewPage() {
  const routerInstance = useRouter();

  // 2) Экземпляр формы + индикатор отправки (кнопкам нужен понятный фидбек)
  const [formInstance] = Form.useForm<CreatePortfolioFormValues>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 3) Единый обработчик сабмита.
  //    Аргумент targetStatus позволяет одной формой сохранять черновик или публиковать.
  async function handleSubmit(
    formValues: CreatePortfolioFormValues,
    targetStatus: CreatePortfolioFormValues["status"]
  ) {
    try {
      setIsSubmitting(true);

      // 3.1) Готовим полезную нагрузку для API.
      //      Дату из Dayjs переводим в ISO-строку, пустую дату передаём как null.
      const payload = {
        titleRu: formValues.titleRu.trim(),
        category: formValues.category.trim(),
        publishedAt: formValues.publishedAt
          ? formValues.publishedAt.toDate().toISOString()
          : null,
        status: targetStatus,
        orderIndex: Number(formValues.orderIndex ?? 0),
      };

      // 3.2) Отправляем запрос на наш эндпоинт создания
      const response = await fetch("/api/portfolio", {
        method: "POST",
        credentials: "include", // отправляем httpOnly-cookie сессии
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      // 3.3) Обработка типовых кодов ответа (как на других страницах)
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

      // 3.4) Успех: показываем тост и уходим на список
      message.success(
        targetStatus === "Опубликовано"
          ? "Кейс создан и опубликован"
          : "Черновик кейса сохранён"
      );
      routerInstance.push("/admin/portfolio");
    } catch {
      message.error("Не удалось сохранить кейс");
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
          Новый кейс
        </Title>
      </div>

      <Card className={styles.formCard}>
        <Form<CreatePortfolioFormValues>
          layout="vertical"
          className={styles.formGrid}
          form={formInstance}
          // Значения по умолчанию:
          initialValues={{
            status: "Черновик",
            orderIndex: 0,
          }}
          // Обычный submit формы — «Сохранить как черновик»
          onFinish={(formValues) => handleSubmit(formValues, "Черновик")}
          requiredMark={false}
          validateTrigger={["onBlur", "onSubmit"]}
        >
          {/* Название кейса (RU) — обязательное поле */}
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

          {/* Категория — обязательное поле.
             mode="tags" позволяет выбирать из списка или ввести своё значение */}
          <Form.Item
            label="Категория"
            name="category"
            rules={[
              { required: true, message: "Выберите или укажите категорию" },
              { max: 100, message: "Слишком длинная категория" },
            ]}
          >
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

          {/* Дата публикации — опциональна (можно оставить пустой) */}
          <Form.Item label="Дата публикации" name="publishedAt">
            <DatePicker style={{ width: "100%" }} placeholder="Выберите дату" />
          </Form.Item>

          {/* Статус публикации — обязательное поле */}
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

          {/* Порядок сортировки — число ≥ 0 */}
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
          <div className={styles.buttonsRow}>
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
                  const validValues = await formInstance.validateFields(); // валидация всех правил
                  await handleSubmit(validValues, "Опубликовано");
                } catch {
                  // Ошибки валидации подсветит сама форма — тут ничего не делаем
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
