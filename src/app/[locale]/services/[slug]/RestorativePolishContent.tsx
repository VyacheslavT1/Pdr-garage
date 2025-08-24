"use client";

import { useTranslations } from "next-intl";
import CheckIcon from "@/app/shared/Icons/check.svg";
import ArrowDownIcon from "@/app/shared/Icons/arrow-down.svg";

interface RestorativePolishProps {
  contentData: ContentData;
}

interface ContentData {
  fullDesc?: string;
  fullDescLi1?: string;
  fullDescLi2?: string;
  fullDescLi3?: string;
  fullDescLi4?: string;
  fullDescLi5?: string;
  fullDescLi6?: string;
}

export default function RestorativePolish({
  contentData,
}: RestorativePolishProps) {
  const t = useTranslations("CommonTemplateData");

  return (
    <div>
      {contentData.fullDesc && <p>{t(contentData.fullDesc)}</p>}
      <ol>
        {contentData.fullDescLi1 && (
          <li>
            <ArrowDownIcon />
            <span>{t(contentData.fullDescLi1)}</span>
          </li>
        )}
        {contentData.fullDescLi2 && (
          <li>
            <ArrowDownIcon />
            <span>{t(contentData.fullDescLi2)}</span>
          </li>
        )}
        {contentData.fullDescLi3 && (
          <li>
            <ArrowDownIcon />
            <span>{t(contentData.fullDescLi3)}</span>
          </li>
        )}
        {contentData.fullDescLi4 && (
          <li>
            <ArrowDownIcon />
            <span>{t(contentData.fullDescLi4)}</span>
          </li>
        )}
        {contentData.fullDescLi5 && (
          <li>
            <ArrowDownIcon />
            <span>{t(contentData.fullDescLi5)}</span>
          </li>
        )}
        {contentData.fullDescLi6 && (
          <li>
            <CheckIcon />
            <span>{t(contentData.fullDescLi6)}</span>
          </li>
        )}
      </ol>
    </div>
  );
}
