// 컴플라이언스 결과 표시: 상단 배지(통과/리스크) + 리스크 상세 카드 목록.

import { ShieldAlert, ShieldCheck } from "lucide-react";

export default function ComplianceReport({ compliance }) {
  if (!compliance) return null;

  const passed = compliance.overall_status === "pass";
  const flags = compliance.flags || [];

  return (
    <>
      <div
        style={{
          marginBottom: 24,
          padding: "14px 18px",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: passed ? "#E9F1EC" : "#FBEAE7",
          color: passed ? "#2F6F45" : "#B5453A",
          fontSize: 13.5,
          fontWeight: 600,
        }}
      >
        {passed ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
        {passed ? "컴플라이언스 체크 통과" : `${flags.length}건의 표시광고 리스크가 발견됐어요`}
      </div>

      {flags.length > 0 && (
        <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 10 }}>
          {flags.map((f, i) => (
            <div
              key={i}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #F0C9C2",
                background: "#FFF9F8",
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, color: "#B5453A", marginBottom: 3 }}>
                [{f.risk_level?.toUpperCase()}] {f.violation_type}
              </div>
              <div style={{ color: "#5A4A47", marginBottom: 3 }}>"{f.flagged_text}"</div>
              <div style={{ color: "#8A6A63" }}>제안: {f.suggested_revision}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
