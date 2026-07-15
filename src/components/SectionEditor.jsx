import { useMemo, useState } from "react";

const IMPROVEMENT_OPTIONS = [
  {
    id: "conversion",
    label: "🎯 구매 전환형",
    instruction: `제품 정보와 기존 상세페이지 내용만 기반으로 작성하세요.

[다음 구조로 개선하세요]
1. 문제 제기: 고객이 겪는 선택의 고민점
2. 선택 기준: 제품 선택 시 중요한 판단 기준
3. 제품 특징: 이 제품이 그 기준을 어떻게 충족하는가
4. 구매 이유: 왜 이 제품을 선택해야 하는가

[절대 금지]
- 실제 없는 고객 후기 생성
- "많은 고객이 선택", "판매 1위" 등 판매 데이터 언급
- 효능 보장 표현
- 과장된 표현
- 확인되지 않은 수치, 효능, 인증`,
    description: "구매 이유와 제품 선택 기준을 명확하게 강조합니다.",
  },
  {
    id: "premium",
    label: "💎 프리미엄형",
    instruction: `제품 정보와 기존 상세페이지 내용만 기반으로 작성하세요.

[개선 방향]
- 브랜드 톤과 문장 완성도 향상
- 세련되고 정제된 표현으로 다듬기
- 품질과 철학 강조
- 고급스러운 문체 적용

[절대 금지]
- "프리미엄"이라는 단어 반복 금지
- 실제 없는 고급 원료 추가
- 없는 인증 추가 (예: GMP, HACCP)
- 원산지 임의 추가
- 사실 없는 장인정신, 전통 표현
- 확인되지 않은 수치, 효능`,
    description: "고급스럽고 정제된 브랜드 톤으로 다듬습니다.",
  },
  {
    id: "professional",
    label: "🔬 전문 정보형",
    instruction: `제품 정보와 기존 상세페이지 내용만 기반으로 작성하세요.

[제품 정보에 실제로 제공된 항목만 활용]
가능하면 아래 정보를 활용합니다.
- 원료 정보 (원료명, 출처)
- 함량 정보 (성분, 함유량)
- 배합 구성 (왜 이 원료들을 함께 사용하는가)
- 제조 기준 (제조 방식, 공정)
- 품질 관리 기준 (검사 항목, 안전 관리)

중요:
제품 정보에 없는 항목은
추측하거나 새로 생성하지 않습니다.
정보가 제공되지 않았다면
그 항목은 생략합니다.

[최우선 규칙]
제품 정보와 기존 상세페이지 내용만 사용합니다.
제품 정보에 없는
- 원료
- 함량
- 제조 기준
- 품질 관리
- 인증
- 논문
- 임상
- 특허
- 수치
- 효능
은 절대 새로 생성하지 않습니다.
정보가 없다면 해당 내용은 작성하지 않습니다.

[절대 금지]
- 임상 연구 결과 생성 (실험했다는 표현 금지)
- 논문 인용 생성
- GMP, HACCP 등 인증 생성 (없으면 추가 금지)
- 특허 생성
- 의학적 효능 표현 (예: 혈당 개선, 체중 감소)
- 확인되지 않은 수치
- 제품 정보에 없는 내용 추가금지`,
    description: "원료·함량·제조·품질 중심으로 전문성을 높입니다.",
  },
  {
    id: "concise",
    label: "✂️ 간결 명확형",
    instruction: `제품 정보와 기존 상세페이지 내용만 기반으로 작성하세요.

[개선 목표]
- 문장 길이를 50% 이상 축소
- 핵심 메시지만 남기기
- 불필요한 수식어와 반복 제거
- 모바일에서 빠르게 읽을 수 있도록 정리
- 제목과 본문이 한눈에 이해되도록

[절대 금지]
- 새로운 정보 추가
- 새로운 장점 생성
- 내용 방향 변경
- 의미 왜곡`,
    description: "문장을 줄이고 핵심만 빠르게 전달합니다.",
  },
  {
    id: "target",
    label: "👥 타깃 맞춤형",
    instruction: `제품 정보와 기존 상세페이지 내용만 기반으로 작성하세요.
설정된 타깃 고객 정보를 반드시 활용하세요.

[개선 방향]
- 타깃 고객의 상황 반영
- 타깃이 사용하는 언어와 표현 적용
- 타깃이 공감할 수 있는 표현 사용
- 타깃의 고민점과 관심사 중심으로 재구성

[절대 금지]
- 타깃 정보가 없으면 임의로 고민 생성 금지
- 없는 고민과 효능 추가금지
- 타깃 정보를 무시하고 내용 변경
- 확인되지 않은 통계나 효능`,
    description: "타깃 고객의 관점에 맞게 표현을 조정합니다.",
  },
  {
    id: "custom",
    label: "✍️ 직접 입력",
    instruction: "",
    description: "원하는 개선 방향을 직접 작성합니다.",
  },
];

export default function SectionEditor({ section, onSave, onClose, onAIImproveRequest, aiResult }) {
  const [data, setData] = useState(section || {});
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const selectedOption = useMemo(
    () => IMPROVEMENT_OPTIONS.find((option) => option.id === selectedOptionId) || null,
    [selectedOptionId]
  );

  const update = (key, value) => setData({ ...data, [key]: value });

  const instruction = selectedOptionId === "custom"
    ? customInstruction.trim()
    : selectedOption?.instruction || "";

  const canRequestImprove = Boolean(onAIImproveRequest && instruction && !aiLoading);

  return (
    <div style={{ padding: 20 }}>
      <h3>Section Editor</h3>
      <label>제목</label>
      <input
        value={data.title || ""}
        onChange={(event) => update("title", event.target.value)}
        style={{ width: "100%" }}
      />

      <label>본문</label>
      <textarea
        value={data.body || ""}
        onChange={(event) => update("body", event.target.value)}
        style={{ width: "100%", minHeight: 100 }}
      />

      <label>핵심 포인트</label>
      <textarea
        value={(data.items || []).join("\n")}
        onChange={(event) => update("items", event.target.value.split("\n").filter(Boolean))}
        style={{ width: "100%" }}
      />

      <div style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 10 }}>✨ AI 개선 요청</h4>
        <label
          htmlFor="ai-improvement-option"
          style={{ display: "block", marginBottom: 7, fontSize: 13, fontWeight: 700 }}
        >
          어떤 방향으로 개선할까요?
        </label>
        <select
          id="ai-improvement-option"
          value={selectedOptionId}
          onChange={(event) => {
            setSelectedOptionId(event.target.value);
            if (event.target.value !== "custom") setCustomInstruction("");
          }}
          style={{
            width: "100%",
            minHeight: 42,
            padding: "9px 10px",
            border: "1px solid #d8d1c7",
            borderRadius: 8,
            background: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <option value="">개선 방향을 선택하세요</option>
          {IMPROVEMENT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        {selectedOption && (
          <div
            style={{
              marginTop: 10,
              padding: "11px 12px",
              borderRadius: 9,
              background: "#faf7f0",
              border: "1px solid #ece3d8",
              fontSize: 13,
              lineHeight: 1.55,
              color: "#5f5248",
            }}
          >
            <strong style={{ display: "block", marginBottom: 3, color: "#3c332d" }}>
              선택: {selectedOption.label}
            </strong>
            {selectedOption.description}
          </div>
        )}

        {selectedOptionId === "custom" && (
          <textarea
            value={customInstruction}
            onChange={(event) => setCustomInstruction(event.target.value)}
            placeholder="예: 핵심 내용은 유지하면서 조금 더 따뜻한 말투로 수정해주세요."
            style={{
              width: "100%",
              minHeight: 80,
              marginTop: 10,
              padding: 10,
              boxSizing: "border-box",
              border: "1px solid #d8d1c7",
              borderRadius: 8,
              resize: "vertical",
            }}
          />
        )}

        <button
          type="button"
          disabled={!canRequestImprove}
          onClick={async () => {
            if (!canRequestImprove) return;
            setAiLoading(true);
            try {
              await onAIImproveRequest({ section, data, instruction });
            } finally {
              setAiLoading(false);
            }
          }}
          style={{
            marginTop: 10,
            padding: "9px 14px",
            border: "none",
            borderRadius: 8,
            background: canRequestImprove ? "#8A6A56" : "#d8d2cc",
            color: "#fff",
            fontWeight: 700,
            cursor: canRequestImprove ? "pointer" : "not-allowed",
          }}
        >
          {aiLoading ? "AI 개선 중..." : "AI 개선 요청"}
        </button>
      </div>

      {aiResult && (
        <div style={{ marginTop: 20, padding: 12, border: "1px solid #ddd", borderRadius: 10, background: "#faf7f0" }}>
          <h4>✨ AI 개선 결과</h4>
          <p><b>제목</b></p>
          <p>{aiResult.title}</p>
          <p><b>본문</b></p>
          <p>{aiResult.body}</p>
          <button type="button" onClick={() => onSave({ ...data, title: aiResult.title, body: aiResult.body })}>
            적용
          </button>
        </div>
      )}

      <button type="button" onClick={() => onSave(data)}>저장</button>
      <button type="button" onClick={onClose}>취소</button>
    </div>
  );
}
