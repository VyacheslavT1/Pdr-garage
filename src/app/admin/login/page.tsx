"use client"; // Страница клиентская: интерактивная форма + редирект через useRouter

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Роутер для перехода на /admin после логина
import { Form, Input, Button, Checkbox, Typography, Card } from "antd"; // Компоненты AntD
import styles from "./AdminLogin.module.scss";

const { Title, Text } = Typography;

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export default function AdminLoginPage() {
  const routerInstance = useRouter(); // Редирект по успеху
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

  // Обработчик успешной валидации формы AntD (onFinish)
  async function handleSubmit(formValues: LoginFormValues) {
    try {
      setIsSubmitting(true);
      setFormError("");

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
        setFormError("Identifiants incorrects");
        return;
      }
      routerInstance.push("/admin"); // Переходим в защищённый раздел
    } catch {
      setFormError("Erreur réseau. Réessayez");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Разметка с классами из SCSS-модуля. Вся inline-стилизация перенесена в .scss
  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <Title level={3} className={styles.loginTitle}>
            Panneau d’administration
          </Title>
          <Text className={styles.loginSubtitle}>
            Connectez-vous pour continuer
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
              { required: true, message: "Indiquez votre email" },
              { type: "email", message: "Format d’email incorrect" },
            ]}
          >
            <Input placeholder="vous@example.com" autoComplete="email" />
          </Form.Item>

          <Form.Item
            label="Mot de passe"
            name="password"
            rules={[
              { required: true, message: "Saisissez votre mot de passe" },
              { min: 8, message: "8 caractères minimum" },
            ]}
          >
            <Input.Password
              placeholder="Mot de passe"
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
            <Checkbox>Rester connecté</Checkbox>
          </Form.Item>

          <Form.Item className={styles.submitRow}>
            <Button
              type="primary"
              htmlType="submit" // Нажатие Enter тоже отправит форму
              block // Кнопка растянутой ширины
              loading={isSubmitting}
            >
              Se connecter
            </Button>
          </Form.Item>
        </Form>

        {formError && (
          <div className={styles.formError} role="alert">
            {formError}
          </div>
        )}
      </Card>
    </div>
  );
}
