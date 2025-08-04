// app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/app/widgets/Header/Header";
import Footer from "@/app/widgets/Footer/Footer";
import ScrollToTopButton from "@/app/shared/ui/ScrollToTopButton/ScrollToTopButton";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Передаём локаль в next-intl для загрузки нужных сообщений
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <Header />
      <main>{children}</main>
      <ScrollToTopButton />
      <Footer />
    </NextIntlClientProvider>
  );
}
