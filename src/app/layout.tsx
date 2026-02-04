// app/layout.tsx
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { montserrat } from "@/shared/ui/fonts";
import type { Viewport } from "next";

export const metadata = {
  title: "PDR Studio",
  description: "Automotive services showcase",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${montserrat.className}`}>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
