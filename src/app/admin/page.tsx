"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, Typography, Button, Space, message } from "antd";
import styles from "./AdminHome.module.scss";
import AdminNav from "./shared/AdminNav/AdminNav"; // ⬅️ добавили импорт

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function AdminHomePage() {
  const routerInstance = useRouter();
  const [isLogoutInProgress, setIsLogoutInProgress] = useState<boolean>(false);

  async function handleLogoutClick() {
    try {
      setIsLogoutInProgress(true);
      const logoutResponse = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!logoutResponse.ok) {
        message.error("Не удалось выйти. Повторите попытку.");
        return;
      }
      message.success("Вы вышли из системы");
      routerInstance.push("/admin/login");
    } catch {
      message.error("Ошибка сети при выходе");
    } finally {
      setIsLogoutInProgress(false);
    }
  }

  return (
    <Layout className={styles.layoutRoot}>
      <Header
        className={styles.headerBar}
        aria-label="Панель навигации админки"
      >
        <Title level={4} className={styles.headerTitle}>
          Админ-панель
        </Title>
        <Space>
          <Button
            danger
            type="primary"
            onClick={handleLogoutClick}
            loading={isLogoutInProgress}
            aria-label="Выйти из админ-панели"
          >
            Выйти
          </Button>
        </Space>
      </Header>

      <Content className={styles.contentRoot}>
        <AdminNav /> {/* ⬅️ добавили верхнюю навигацию админки */}
        <div className={styles.contentContainer}>
          <Title level={3} style={{ margin: 0 }}>
            Добро пожаловать в админ-панель
          </Title>
          <Text type="secondary">
            Здесь появятся разделы: «Блоки сайта», «Портфолио», «Отзывы»,
            «Заявки», «Настройки».
          </Text>
          <Text>
            На следующем шаге добавим каркас навигации к остальным страницам по
            одному и начнём CRUD.
          </Text>
        </div>
      </Content>

      <Footer className={styles.footerBar}>
        PDR Garage — Admin © {new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}
