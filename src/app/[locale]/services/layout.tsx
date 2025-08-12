import { ReactNode } from "react";
import Breadcrumb from "@/app/shared/ui/Breadcrumb/Breadcrumb";

type ServicesLayoutProps = { children: ReactNode };

export default function ServicesLayout({ children }: ServicesLayoutProps) {
  return (
    <>
      <Breadcrumb />
      <section>{children}</section>
    </>
  );
}
