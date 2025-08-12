"use client";

import { useTranslations } from "next-intl";
import CheckIcon from "@/app/shared/Icons/check.svg";

interface ScratchBuffingContentProps {
  serviceData: ServiceData;
}

interface ServiceData {
  fullDesc1?: string;
  fullDesc2?: string;
  fullDesc3?: string;
  fullDescLi11?: string;
  fullDescLi12?: string;
  fullDescLi13?: string;
  fullDescTitle1?: string;
  fullDescLi21?: string;
  fullDescLi21strong?: string;
  fullDescLi22?: string;
  fullDescLi22strong?: string;
  fullDescLi23?: string;
  fullDescLi23strong?: string;
  fullDescLi24?: string;
  fullDescLi24strong?: string;
  fullDescTitle2?: string;
  fullDesc4?: string;
  fullDesc4strong1?: string;
  fullDesc4strong2?: string;
  fullDesc5?: string;
  fullDesc5strong?: string;
  fullDesc6?: string;
  fullDesc6strong?: string;
  fullDesc7?: string;
  fullDesc7strong?: string;
}

export default function ScratchBuffingContent({
  serviceData,
}: ScratchBuffingContentProps) {
  const t = useTranslations("ServiceCard");

  return (
    <div>
      {serviceData.fullDesc1 && <p>{t(serviceData.fullDesc1)}</p>}
      {serviceData.fullDesc2 && <p>{t(serviceData.fullDesc2)}</p>}
      {serviceData.fullDesc3 && <p>{t(serviceData.fullDesc3)}</p>}

      {(serviceData.fullDescLi11 ||
        serviceData.fullDescLi12 ||
        serviceData.fullDescLi13) && (
        <ol>
          {serviceData.fullDescLi11 && (
            <li>
              <CheckIcon />
              {t(serviceData.fullDescLi11)}
            </li>
          )}
          {serviceData.fullDescLi12 && (
            <li>
              <CheckIcon />
              {t(serviceData.fullDescLi12)}
            </li>
          )}
          {serviceData.fullDescLi13 && (
            <li>
              <CheckIcon />
              {t(serviceData.fullDescLi13)}
            </li>
          )}
        </ol>
      )}

      {serviceData.fullDescTitle1 && <h2>{t(serviceData.fullDescTitle1)}</h2>}

      {(serviceData.fullDescLi21 ||
        serviceData.fullDescLi22 ||
        serviceData.fullDescLi23 ||
        serviceData.fullDescLi24) && (
        <ol>
          {serviceData.fullDescLi21 && (
            <li>
              <CheckIcon />
              <span>
                {serviceData.fullDescLi21strong && (
                  <strong>{t(serviceData.fullDescLi21strong)}</strong>
                )}
                {t(serviceData.fullDescLi21)}
              </span>
            </li>
          )}
          {serviceData.fullDescLi22 && (
            <li>
              <CheckIcon />
              <span>
                {serviceData.fullDescLi22strong && (
                  <strong>{t(serviceData.fullDescLi22strong)}</strong>
                )}
                {t(serviceData.fullDescLi22)}
              </span>
            </li>
          )}
          {serviceData.fullDescLi23 && (
            <li>
              <CheckIcon />
              <span>
                {serviceData.fullDescLi23strong && (
                  <strong>{t(serviceData.fullDescLi23strong)}</strong>
                )}
                {t(serviceData.fullDescLi23)}
              </span>
            </li>
          )}
          {serviceData.fullDescLi24 && (
            <li>
              <CheckIcon />
              <span>
                {serviceData.fullDescLi24strong && (
                  <strong>{t(serviceData.fullDescLi24strong)}</strong>
                )}
                {t(serviceData.fullDescLi24)}
              </span>
            </li>
          )}
        </ol>
      )}

      {serviceData.fullDescTitle2 && <h2>{t(serviceData.fullDescTitle2)}</h2>}

      {serviceData.fullDesc4 && (
        <p>
          {serviceData.fullDesc4strong1 && (
            <strong>{t(serviceData.fullDesc4strong1)}</strong>
          )}
          {t(serviceData.fullDesc4)}
          {serviceData.fullDesc4strong2 && (
            <strong>{t(serviceData.fullDesc4strong2)}</strong>
          )}
        </p>
      )}

      {serviceData.fullDesc5 && (
        <p>
          {serviceData.fullDesc5strong && (
            <strong>{t(serviceData.fullDesc5strong)}</strong>
          )}
          {t(serviceData.fullDesc5)}
        </p>
      )}

      {serviceData.fullDesc6 && (
        <p>
          {serviceData.fullDesc6strong && (
            <strong>{t(serviceData.fullDesc6strong)}</strong>
          )}
          {t(serviceData.fullDesc6)}
        </p>
      )}

      {serviceData.fullDesc7 && (
        <p>
          {t(serviceData.fullDesc7)}
          {serviceData.fullDesc7strong && (
            <strong>{t(serviceData.fullDesc7strong)}</strong>
          )}
        </p>
      )}
    </div>
  );
}
