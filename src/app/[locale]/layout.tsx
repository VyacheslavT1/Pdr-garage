// app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/widgets/header/Header";
import Footer from "@/widgets/footer/Footer";
import ScrollToTopButton from "@/shared/ui/scroll-to-top/ScrollToTopButton";
import CookieConsentBanner from "@/widgets/cookie-consent/CookieConsentBanner";

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
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
      <main>{children}</main>
      <ScrollToTopButton />
      <Footer />
      <CookieConsentBanner />
    </NextIntlClientProvider>
  );
}
