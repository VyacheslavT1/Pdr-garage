// app/page.tsx
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function Page() {
  // Префикс дефолтной локали (fr)
  redirect(`/${routing.defaultLocale}`);
}
