import React from "react";

const DEFAULT_MAIN = "#C89A5A";
const DEFAULT_ACCENT = "#2F5A46";

export const DESIGN_TEMPLATES = [
  {
    id: "premium-white",
    label: "Premium White",
    category: "Premium",
    desc: "여백을 살린 깔끔하고 프리미엄한 화이트 스타일",
    tags: ["프리미엄", "신뢰", "화이트"],
  },
  {
    id: "soft-beige",
    label: "Soft Beige",
    category: "Natural",
    desc: "따뜻한 베이지 톤의 내추럴하고 부드러운 스타일",
    tags: ["베이지", "따뜻함", "원료"],
  },
  {
    id: "editorial",
    label: "Editorial",
    category: "Premium",
    desc: "잡지처럼 세련된 타이포와 여백이 돋보이는 스타일",
    tags: ["매거진", "세리프", "고급"],
  },
  {
    id: "dark-luxury",
    label: "Dark Luxury",
    category: "Premium",
    desc: "다크 톤과 골드 포인트로 고급감을 강조하는 스타일",
    tags: ["다크", "럭셔리", "골드"],
  },
  {
    id: "science-lab",
    label: "Science Lab",
    category: "Modern",
    desc: "블루 톤과 데이터 카드로 전문성을 보여주는 스타일",
    tags: ["수치", "인증", "전문성"],
  },
  {
    id: "natural-green",
    label: "Natural Green",
    category: "Natural",
    desc: "그린 톤과 식물 이미지를 활용한 자연친화적 스타일",
    tags: ["식물성", "자연", "그린"],
  },
  {
    id: "minimal",
    label: "Minimal",
    category: "Modern",
    desc: "미니멀 디자인과 강한 타이포그래피의 모던 스타일",
    tags: ["심플", "명확", "타이포"],
  },
  {
    id: "modern-clean",
    label: "Modern Clean",
    category: "Modern",
    desc: "깔끔한 구성과 세련된 배치의 현대적 스타일",
    tags: ["클린", "모던", "정리"],
  },
  {
    id: "bold-impact",
    label: "Bold Impact",
    category: "Bold",
    desc: "강렬한 컬러와 대담한 레이아웃의 임팩트 스타일",
    tags: ["강렬", "진하", "시선"],
  },
  {
    id: "warm-story",
    label: "Warm Story",
    category: "Natural",
    desc: "따뜻하고 감정적인 스토리텔링 중심의 스타일",
    tags: ["스토리", "감정", "따뜻함"],
  },
];

export default function TemplateGallery({ selectedTemplate, onSelectTemplate, onBack, onGenerate, themeColor = DEFAULT_MAIN, pointColors = [DEFAULT_ACCENT] }) {
  return (
    <div
      style={{
        height: "100%",
        background: "#FFFEFB",
        color: "#2B2925",
        padding: "28px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <div style={{ paddingBottom: 12, borderBottom: "1px solid #EEE7DD" }}>
        <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: "-0.04em", marginBottom: 6 }}>템플릿 목록</div>
        <div style={{ fontSize: 12.5, color: "#8B8175", lineHeight: 1.55 }}>
          원하는 디자인 스타일을 선택하세요.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DESIGN_TEMPLATES.map((template) => {
          const selected = selectedTemplate === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template.id)}
              style={{
                width: "100%",
                textAlign: "left",
                border: selected ? "1.5px solid #C58A3D" : "1px solid #E7E0D5",
                background: selected ? "#FFF7EC" : "#FFFFFF",
                borderRadius: 12,
                padding: "14px 14px",
                cursor: "pointer",
                boxShadow: selected ? "0 10px 22px rgba(168,117,53,0.10)" : "0 4px 12px rgba(47,38,28,0.04)",
                transition: "all .18s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
                <span style={{ fontSize: 10.5, fontWeight: 900, color: selected ? "#A87535" : "#8B7355" }}>{template.category}</span>
                {selected && <span style={{ color: "#4F6A46", fontWeight: 950, fontSize: 15 }}>✓</span>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#211D18", letterSpacing: "-0.025em", marginBottom: 5 }}>
                {template.label}
              </div>
              <div style={{ fontSize: 11.5, color: "#877C70", lineHeight: 1.45, marginBottom: 9 }}>
                {template.desc}
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {template.tags?.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 10,
                      padding: "3px 7px",
                      borderRadius: 6,
                      background: selected ? "#EBD8BE" : "#F1E9DE",
                      color: selected ? "#875E2C" : "#8B7355",
                      fontWeight: 700,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
