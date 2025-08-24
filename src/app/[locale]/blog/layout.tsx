import { ReactNode } from "react";
import Breadcrumb from "@/app/shared/ui/Breadcrumb/Breadcrumb";

type BlogLayoutProps = { children: ReactNode };

export default function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <>
      <Breadcrumb />
      <section>{children}</section>
    </>
  );
}
