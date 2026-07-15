// Breadcrumb 네비게이션: 제품 입력 > AI 설계 > 템플릿 > 상세페이지

import { ChevronRight } from "lucide-react";

export default function Breadcrumb({ stage, onNavigate }) {
  const steps = [
    { label: "제품 입력", value: -1 },
    { label: "AI 설계", value: 0 },
    { label: "템플릿", value: 1 },
    { label: "상세페이지", value: 4 }
  ];

  // 현재 stage에 따른 활성 단계 결정
  let activeIndex = 0;
  if (stage < 0) activeIndex = 0;
  else if (stage === 0) activeIndex = 1;
  else if (stage <= 3) activeIndex = 2;
  else if (stage >= 4) activeIndex = 3;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "12px 16px",
        background: "#FDFBF7",
        borderBottom: "1px solid #E8D5BC",
        fontSize: 13,
        color: "#8B7F75",
      }}
    >
      {steps.map((step, idx) => (
        <div key={step.value} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => onNavigate?.(step.value)}
            style={{
              background: "none",
              border: "none",
              color: idx === activeIndex ? "#5F4B36" : "#B5A99A",
              fontSize: 13,
              fontWeight: idx === activeIndex ? 600 : 400,
              cursor: onNavigate ? "pointer" : "default",
              textDecoration: idx < activeIndex ? "line-through" : "none",
              opacity: idx <= activeIndex ? 1 : 0.6,
            }}
          >
            {step.label}
          </button>
          {idx < steps.length - 1 && (
            <ChevronRight
              size={14}
              color={idx < activeIndex ? "#D9CDBE" : "#B5A99A"}
            />
          )}
        </div>
      ))}
    </div>
  );
}
