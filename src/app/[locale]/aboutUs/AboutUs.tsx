"use client";

import { useTranslations } from "next-intl";

interface AboutUsProps {
  contentData: ContentData;
}
interface ContentData {
  aboutP1?: string;
  aboutP2?: string;
  aboutP3?: string;
  aboutP4?: string;
  aboutP5?: string;
}

export function AboutUs({ contentData }: AboutUsProps) {
  const t = useTranslations("AboutUs");
  return (
    <div>
      {contentData.aboutP1 && <p>{t(contentData.aboutP1)}</p>}
      {contentData.aboutP2 && <p>{t(contentData.aboutP2)}</p>}
      {contentData.aboutP3 && <p>{t(contentData.aboutP3)}</p>}
      {contentData.aboutP4 && <p>{t(contentData.aboutP4)}</p>}
      {contentData.aboutP5 && <p>{t(contentData.aboutP5)}</p>}
    </div>
  );
}
