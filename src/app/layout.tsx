// app/layout.tsx
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
