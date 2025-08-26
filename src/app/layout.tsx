// app/layout.tsx
import "./globals.css";
import { montserrat } from "./shared/ui/fonts";
import { AntdRegistry } from "@ant-design/nextjs-registry";

export const metadata = {
  title: "PDR Studio",
  description: "Automotive services showcase",
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
