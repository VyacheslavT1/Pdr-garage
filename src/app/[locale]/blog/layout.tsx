import { ReactNode } from "react";
import Breadcrumb from "@/shared/ui/breadcrumb/Breadcrumb";

type BlogLayoutProps = { children: ReactNode };

export default function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <>
      <Breadcrumb />
      <section>{children}</section>
    </>
  );
}
