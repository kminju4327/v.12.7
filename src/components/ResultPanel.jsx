// 우측 결과 패널: 빈 상태 안내 / 결과 툴바 / 컴플라이언스 리포트 / 상세페이지 미리보기.

import { Sparkles } from "lucide-react";
import ResultToolbar from "./ResultToolbar.jsx";
import ComplianceReport from "./ComplianceReport.jsx";
import DetailPagePreview from "./DetailPagePreview.jsx";

export default function ResultPanel({
  draft,
  compliance,
  stage,
  image,
  concept,
  themeColor,
  regenIndex,
  copied,
  htmlCopied,
  onCopy,
  onCopyHtml,
  onDownloadHtml,
  onNewProduct,
  onEditProduct,
  onRegenerate,
  onRegen,
  onEditSection,
  onAIImproveRequest,
}) {
  return (
    <div style={{ padding: "36px 48px", overflowY: "auto" }}>
      {draft && (
        <ResultToolbar
          copied={copied}
          htmlCopied={htmlCopied}
          themeColor={themeColor}
          onCopy={onCopy}
          onCopyHtml={onCopyHtml}
          onDownloadHtml={onDownloadHtml}
          onNewProduct={onNewProduct}
          onEditProduct={onEditProduct}
          onRegenerate={onRegenerate}
        />
      )}

      {!draft && stage < 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "80%",
            color: "#8A897F",
            textAlign: "center",
          }}
        >
          <Sparkles size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
          <div style={{ fontSize: 14 }}>왼쪽에 제품 정보를 입력하고 생성 버튼을 눌러주세요.</div>
        </div>
      )}

      <ComplianceReport compliance={compliance} />

      <DetailPagePreview
        draft={draft}
        image={image}
        concept={concept}
        themeColor={themeColor}
        onRegen={onRegen}
        regenIndex={regenIndex}
        onEditSection={onEditSection}
        onAIImproveRequest={onAIImproveRequest}
      />
    </div>
  );
}
