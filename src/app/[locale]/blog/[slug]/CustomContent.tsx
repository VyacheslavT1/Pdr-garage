import { useTranslations } from "next-intl";

interface PDRMythProps {
  contentData: ContentData;
}

interface ContentData {
  fullDesc?: string;
  fullDesc1?: string;
  fullDesc2?: string;
  fullDesc3?: string;
  fullDesc4?: string;
  fullDesc5?: string;
  fullDesc6?: string;

  fullDescTitle1?: string;
  fullDescTitle2?: string;
  fullDescTitle3?: string;
  fullDescTitle4?: string;
  fullDescTitle5?: string;
}

export default function PDRMyths({ contentData }: PDRMythProps) {
  const t = useTranslations("CommonTemplateData");

  return (
    <>
      {contentData.fullDesc && <p>{t(contentData.fullDesc)}</p>}

      {contentData.fullDescTitle1 && <h3>{t(contentData.fullDescTitle1)}</h3>}
      {contentData.fullDesc1 && <p>{t(contentData.fullDesc1)}</p>}

      {contentData.fullDescTitle2 && <h3>{t(contentData.fullDescTitle2)}</h3>}
      {contentData.fullDesc2 && <p>{t(contentData.fullDesc2)}</p>}

      {contentData.fullDescTitle3 && <h3>{t(contentData.fullDescTitle3)}</h3>}
      {contentData.fullDesc3 && <p>{t(contentData.fullDesc3)}</p>}

      {contentData.fullDescTitle4 && <h3>{t(contentData.fullDescTitle4)}</h3>}
      {contentData.fullDesc4 && <p>{t(contentData.fullDesc4)}</p>}

      {contentData.fullDescTitle5 && <h3>{t(contentData.fullDescTitle5)}</h3>}
      {contentData.fullDesc5 && <p>{t(contentData.fullDesc5)}</p>}

      {contentData.fullDesc6 && <p>{t(contentData.fullDesc6)}</p>}
    </>
  );
}
