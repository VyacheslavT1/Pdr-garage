import { ReactNode, Suspense } from "react";
import Breadcrumb from "@/shared/ui/breadcrumb/Breadcrumb";

type ContactsLayoutProps = { children: ReactNode };

export default function ContactsLayout({ children }: ContactsLayoutProps) {
  return (
    <>
      <Suspense fallback={null}>
        <Breadcrumb />
      </Suspense>
      <section>{children}</section>
    </>
  );
}
