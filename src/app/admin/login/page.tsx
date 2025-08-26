"use client"; // Страница клиентская: интерактивная форма + редирект через useRouter

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Роутер для перехода на /admin после логина
import { Form, Input, Button, Checkbox, Typography, Card, message } from "antd"; // Компоненты AntD
import styles from "./AdminLogin.module.css";

const { Title, Text } = Typography;

// Тип значений формы. Названия полей совпадают с name в <Form.Item>
type LoginFormValues = {
  email: string; // Email администратора
  password: string; // Пароль администратора
  rememberMe?: boolean; // Флаг «Оставаться в системе»
};

export default function AdminLoginPage() {
  const routerInstance = useRouter(); // Редирект по успеху
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Состояние отправки

  // Обработчик успешной валидации формы AntD (onFinish)
  async function handleSubmit(formValues: LoginFormValues) {
    try {
      setIsSubmitting(true); // Блокируем кнопку на время запроса

      // POST /api/auth/login — сервер устанавливает httpOnly-cookie с токенами
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formValues.email,
          password: formValues.password,
          rememberMe: Boolean(formValues.rememberMe),
        }),
        credentials: "include", // браузер отправит/получит куки
      });

      if (!response.ok) {
        // Сообщение общее — не раскрываем, что именно неверно
        message.error("Неверные учётные данные");
        return;
      }

      message.success("Вход выполнен");
      routerInstance.push("/admin"); // Переходим в защищённый раздел
    } catch {
      message.error("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Разметка с классами из SCSS-модуля. Вся inline-стилизация перенесена в .scss
  return (
    <div className={styles.loginRoot}>
      <Card className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <Title level={3} className={styles.loginTitle}>
            Админ-панель
          </Title>
          <Text className={styles.loginSubtitle}>
            Войдите, чтобы продолжить
          </Text>
        </div>

        <Form<LoginFormValues>
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          validateTrigger={["onBlur", "onSubmit"]} // валидация по blur и перед submit
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Укажите email" },
              { type: "email", message: "Некорректный формат email" },
            ]}
          >
            <Input placeholder="you@example.com" autoComplete="email" />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              { required: true, message: "Введите пароль" },
              { min: 8, message: "Минимум 8 символов" },
            ]}
          >
            <Input.Password
              placeholder="Пароль"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item
            name="rememberMe"
            valuePropName="checked"
            style={{ marginBottom: 0 }}
          >
            {/* Этот единственный style оставляем: он не конфликтует и минимален.
               Если хочешь — тоже вынесем в SCSS на следующем шаге. */}
            <Checkbox>Оставаться в системе</Checkbox>
          </Form.Item>

          <Form.Item className={styles.submitRow}>
            <Button
              type="primary"
              htmlType="submit" // Нажатие Enter тоже отправит форму
              block // Кнопка растянутой ширины
              loading={isSubmitting}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
