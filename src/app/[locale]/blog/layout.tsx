import { ReactNode, Suspense } from "react";
import Breadcrumb from "@/shared/ui/breadcrumb/Breadcrumb";

type BlogLayoutProps = { children: ReactNode };

export default function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <>
      <Suspense fallback={null}>
        <Breadcrumb />
      </Suspense>
      <section>{children}</section>
    </>
  );
}
