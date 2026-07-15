// 앱 전역에서 공유하는 스타일 토큰 모음.
// 색상 팔레트, 디자인 컨셉, 재사용 입력 스타일을 한 곳에서 관리한다.

// 테마 컬러 프리셋 (좌측 입력 레일에서 선택)
export const PRESET_COLORS = ["#2F6F62", "#C99A2E", "#3B5BA5", "#8B4A62", "#4A6741"];

// 디자인 컨셉 선택지
export const CONCEPTS = [
  { id: "minimal", label: "미니멀", desc: "여백 중심, 정보 위주" },
  { id: "warm", label: "따뜻함", desc: "둥근 카드, 부드러운 톤" },
  { id: "premium", label: "프리미엄", desc: "진한 대비, 세리프 헤드라인" },
];

// 컨셉별 카드 스타일 (미리보기 렌더링에 사용)
export const CONCEPT_STYLES = {
  minimal: {
    radius: "4px",
    shadow: "none",
    border: "1px solid #E3E1DA",
    headFont: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
    headWeight: 700,
  },
  warm: {
    radius: "18px",
    shadow: "0 4px 16px rgba(0,0,0,0.06)",
    border: "none",
    headFont: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
    headWeight: 700,
  },
  premium: {
    radius: "2px",
    shadow: "0 2px 0 rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.08)",
    headFont: '"Noto Serif KR", serif',
    headWeight: 800,
  },
};

// 좌측 입력 레일에서 재사용하는 인풋 스타일
export const inputStyle = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 8,
  border: "1px solid rgba(244,243,238,0.2)",
  background: "rgba(244,243,238,0.06)",
  color: "#F4F3EE",
  fontSize: 13.5,
  outline: "none",
  boxSizing: "border-box",
};

// 파이프라인 진행 단계 라벨 (2단계: 생성 → 컴플라이언스)
export const STAGE_LABELS = ["상세페이지 생성", "컴플라이언스 체크"];

// 상세페이지 섹션 타입 → 한글 라벨 매핑
export function sectionLabel(type) {
  return (
    {
      problem: "고민",
      solution: "핵심 특징",
      objection_handling: "정확한 안내",
      benefit_list: "요약",
      how_to_use: "섭취 방법",
      trust_badges: "인증",
    }[type] || type
  );
}
