"use client";

import { useTranslations } from "next-intl";

interface Data {
  fullDesc?: string;
  fullDescLi1?: string;
  fullDescLi2?: string;
  fullDescLi3?: string;
  fullDescLi4?: string;
  fullDescLi5?: string;
}

interface AboutUsProps {
  data: Data;
}
export function AboutUs({ data }: AboutUsProps) {
  const t = useTranslations("AboutUs");
  return (
    <section>
      <div>
        <h1></h1>
      </div>
    </section>
  );
}
