// 결과 상단 툴바: 텍스트 복사 / HTML 다운로드 / 액션 버튼 (새 제품 / 제품 수정 / 다시 생성)

import { Copy, Check, RefreshCw, Code, Download, Plus, Edit2 } from "lucide-react";

const baseBtn = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 12px",
  borderRadius: 8,
  border: "1px solid #DEDCD3",
  background: "#fff",
  color: "#4A4940",
  fontSize: 12.5,
  cursor: "pointer",
};

const actionBtnStyle = {
  ...baseBtn,
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  gap: 4,
  padding: "8px 14px"
};

export default function ResultToolbar({
  copied,
  htmlCopied,
  themeColor,
  onCopy,
  onCopyHtml,
  onDownloadHtml,
  onNewProduct,
  onEditProduct,
  onRegenerate,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 18,
        flexWrap: "wrap",
      }}
    >
      {/* 왼쪽: 복사/다운로드 버튼 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={onCopy} style={baseBtn}>
          {copied ? <Check size={13} color="#2F6F45" /> : <Copy size={13} />}
          {copied ? "복사됨" : "텍스트 복사"}
        </button>
        <button onClick={onCopyHtml} style={baseBtn}>
          {htmlCopied ? <Check size={13} color="#2F6F45" /> : <Code size={13} />}
          {htmlCopied ? "복사됨" : "HTML 복사"}
        </button>
        <button
          onClick={onDownloadHtml}
          style={{
            ...baseBtn,
            border: "none",
            background: themeColor,
            color: "#fff",
            fontWeight: 600,
          }}
        >
          <Download size={13} /> HTML 다운로드
        </button>
      </div>

      {/* 오른쪽: 액션 버튼 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button 
          onClick={onNewProduct}
          style={{
            ...actionBtnStyle,
            border: "1px solid #E8D5BC",
            color: "#5F4B36"
          }}
          title="새로운 제품으로 시작합니다"
        >
          <Plus size={13} /> 🆕 새 제품
        </button>
        <button 
          onClick={onEditProduct}
          style={{
            ...actionBtnStyle,
            border: "1px solid #E8D5BC",
            color: "#5F4B36"
          }}
          title="제품 정보를 수정합니다"
        >
          <Edit2 size={13} /> ✏️ 제품 수정
        </button>
        <button 
          onClick={onRegenerate}
          style={{
            ...actionBtnStyle,
            border: "none",
            background: themeColor,
            color: "#fff"
          }}
          title="현재 설정으로 다시 생성합니다"
        >
          <RefreshCw size={13} /> 🔄 다시 생성
        </button>
      </div>
    </div>
  );
}
