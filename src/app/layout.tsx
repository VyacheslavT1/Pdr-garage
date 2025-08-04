// app/layout.tsx
import "./globals.css";
import { montserrat } from "./shared/ui/fonts";

export const metadata = {
  title: "PDR Garage",
  description: "Automotive services showcase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${montserrat.className}`}>{children}</body>
    </html>
  );
}
