import { ReactNode } from "react";
import Breadcrumb from "@/shared/ui/breadcrumb/Breadcrumb";

type ServicesLayoutProps = { children: ReactNode };

export default function ServicesLayout({ children }: ServicesLayoutProps) {
  return (
    <>
      <Breadcrumb />
      <section>{children}</section>
    </>
  );
}
