"use client";

import "@ant-design/v5-patch-for-react-19";
import React from "react";
import { ConfigProvider, App as AntdApp } from "antd";
import styles from "./AdminLayout.module.scss";
import frFR from "antd/locale/fr_FR";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider locale={frFR}>
      <div className={styles.adminRoot}>
        <AntdApp>{children}</AntdApp>
      </div>
    </ConfigProvider>
  );
}
