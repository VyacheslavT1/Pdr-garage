import { ReactNode } from "react";
import Breadcrumb from "@/app/shared/ui/Breadcrumb/Breadcrumb";

type ContactsLayoutProps = { children: ReactNode };

export default function ContactsLayout({ children }: ContactsLayoutProps) {
  return (
    <>
      <Breadcrumb />
      <section>{children}</section>
    </>
  );
}
