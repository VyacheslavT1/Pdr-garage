import { ReactNode } from "react";
import Breadcrumb from "@/shared/ui/breadcrumb/Breadcrumb";

type AboutUsLayoutProps = { children: ReactNode };

export default function AboutUsLayout({ children }: AboutUsLayoutProps) {
  return (
    <>
      <Breadcrumb />
      <section>{children}</section>
    </>
  );
}
