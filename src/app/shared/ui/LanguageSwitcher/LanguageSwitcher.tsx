// app/shared/ui/LanguageSwitcher/LanguageSwitcher.tsx
"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Dropdown from "@/app/shared/ui/Dropdown/Dropdown";

const locales = ["fr", "en", "ru"];

export function LanguageSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentLocale = useLocale();

  // Собираем текущий путь вместе с query-параметрами
  const query = searchParams.toString();
  const href = `${pathname}${query ? `?${query}` : ""}`;

  return (
    <div className="relative group inline-block">
      <span>{currentLocale.toLocaleUpperCase()}</span>
      <Dropdown
        className="hidden group-hover:block absolute top-full  "
        options={locales.map((l) => ({ value: l, label: l.toUpperCase() }))}
        value={currentLocale}
        onSelect={(newLocale) => router.push(href, { locale: newLocale })}
        // Триггер: показываем текущую локаль
        renderValue={(opt) => <span>{opt?.label}</span>}
        // Пункты меню: подсвечиваем активную локаль
        renderOption={(opt, isActive) => (
          <span className={`${isActive ? "font-semibold " : ""}`}>
            {opt.label}
          </span>
        )}
      />
    </div>
  );
}
