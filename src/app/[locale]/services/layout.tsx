import { ReactNode, Suspense } from "react";
import Breadcrumb from "@/shared/ui/breadcrumb/Breadcrumb";

type ServicesLayoutProps = { children: ReactNode };

export default function ServicesLayout({ children }: ServicesLayoutProps) {
  return (
    <>
      <Suspense fallback={null}>
        <Breadcrumb />
      </Suspense>
      <section>{children}</section>
    </>
  );
}
