import { ReactNode } from "react";
import Breadcrumb from "@/app/shared/ui/Breadcrumb/Breadcrumb";

type AboutUsLayoutProps = { children: ReactNode };

export default function AboutUsLayout({ children }: AboutUsLayoutProps) {
  return (
    <>
      <Breadcrumb />
      <section>{children}</section>
    </>
  );
}
