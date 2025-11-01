import { ReactNode } from "react";
import Breadcrumb from "@/shared/ui/breadcrumb/Breadcrumb";

type ContactsLayoutProps = { children: ReactNode };

export default function ContactsLayout({ children }: ContactsLayoutProps) {
  return (
    <>
      <Breadcrumb />
      <section>{children}</section>
    </>
  );
}
