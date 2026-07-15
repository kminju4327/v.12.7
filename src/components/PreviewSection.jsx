// 미리보기 섹션 래퍼: 콘텐츠 카드만 렌더링
// 버튼은 모두 제거됨 (SectionEditor에서 AI 수정 요청 처리)

import { useState } from "react";

export default function PreviewSection({ idx, onEdit, children }) {
  return (
    <div style={{ position: "relative", marginBottom: 18 }}>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 2,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 18,
          }}
          aria-label="edit section"
        >
          ✏
        </button>
      )}
      {children}
    </div>
  );
}
