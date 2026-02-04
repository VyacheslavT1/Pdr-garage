import { ReactNode, Suspense } from "react";
import Breadcrumb from "@/shared/ui/breadcrumb/Breadcrumb";

type AboutUsLayoutProps = { children: ReactNode };

export default function AboutUsLayout({ children }: AboutUsLayoutProps) {
  return (
    <>
      <Suspense fallback={null}>
        <Breadcrumb />
      </Suspense>
      <section>{children}</section>
    </>
  );
}
