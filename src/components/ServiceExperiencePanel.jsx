import React, { useEffect, useMemo, useState } from "react";
import { loadProjects, PROJECT_SAVED_EVENT } from "../engines/v11/projectStorageEngine.js";

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

function readProjects() {
  return loadProjects();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sectionKey(index) {
  return index === "hero" ? "hero" : `section-${index}`;
}

function sectionDisplayName(section, index) {
  if (index === "hero") return "Hero";
  return section?.title || section?.type || `섹션 ${Number(index) + 1}`;
}

export default function ServiceExperiencePanel({
  showPreview = false,
  draft = null,
  onDraftChange,
  onRegenerate,
  onLoadProject,
  onEditSection,
  onAIImproveRequest,
  regeneratingIndex = null,
}) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState(() => readProjects());
  const [tab, setTab] = useState("projects");
  const [editing, setEditing] = useState(null);
  const [aiPreview, setAiPreview] = useState(null);
  const [selectedImproveOption, setSelectedImproveOption] = useState("");
  const [customImproveInstruction, setCustomImproveInstruction] = useState("");
  const [histories, setHistories] = useState({});
  const [notice, setNotice] = useState("");

  // ✅ 수정: localStorage 변화 감시 (프로젝트 저장 시 자동 반영)
  useEffect(() => {
    const handleStorageChange = () => {
      setProjects(readProjects());
    };

    // 1초마다 localStorage 확인 (저장 감지용)
    const interval = setInterval(handleStorageChange, 1000);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(PROJECT_SAVED_EVENT, handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(PROJECT_SAVED_EVENT, handleStorageChange);
    };
  }, []);


  const previewRows = useMemo(() => {
    if (!draft) return [];
    return [
      {
        key: "hero",
        index: "hero",
        label: "Hero",
        title: draft.hero_headline || "Hero 제목",
        body: draft.hero_subcopy || "",
      },
      ...(draft.sections || []).map((section, index) => ({
        key: sectionKey(index),
        index,
        label: sectionDisplayName(section, index),
        title: section.title || "",
        body: section.body || "",
        items: Array.isArray(section.items) ? section.items : [],
        type: section.type,
      })),
    ];
  }, [draft]);

  function refreshProjects() {
    setProjects(readProjects());
  }

  function remember(index) {
    if (!draft) return;
    const key = sectionKey(index);
    const snapshot =
      index === "hero"
        ? { hero_headline: draft.hero_headline || "", hero_subcopy: draft.hero_subcopy || "" }
        : clone(draft.sections?.[index] || {});
    setHistories((current) => ({
      ...current,
      [key]: [snapshot, ...(current[key] || [])].slice(0, 8),
    }));
  }

  function openEditor(row) {
    setEditing({
      ...row,
      title: row.title || "",
      body: row.body || "",
      itemsText: (row.items || []).join("\n"),
    });
    setFeedback("");
  }

  function saveEdit() {
    if (!editing || !draft || typeof onDraftChange !== "function") return;
    remember(editing.index);

    if (editing.index === "hero") {
      const updatedDraft = {
        ...draft,
        hero_headline: editing.title.trim(),
        hero_subcopy: editing.body.trim(),
      };
      onDraftChange(updatedDraft);
      if (typeof onEditSection === "function") {
        onEditSection("hero", {
          title: editing.title.trim(),
          body: editing.body.trim(),
          items: [],
        });
      }
    } else {
      const sections = [...(draft.sections || [])];
      const current = sections[editing.index] || {};
      const next = {
        ...current,
        title: editing.title.trim(),
        body: editing.body.trim(),
      };
      if (Array.isArray(current.items)) {
        next.items = editing.itemsText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      sections[editing.index] = next;
      const updatedDraft = { ...draft, sections };
      onDraftChange(updatedDraft);
      if (typeof onEditSection === "function") {
        onEditSection(editing.index, {
          title: next.title,
          body: next.body,
          items: next.items || [],
        });
      }
    }

    setEditing(null);
    setNotice("수정 내용이 상세페이지에 반영되었습니다.");
    setTimeout(() => setNotice(""), 2200);
  }

  async function regenerate(index, instruction = "") {
    if (typeof onRegenerate !== "function") return;
    remember(index);
    await onRegenerate(index, instruction.trim());
    setFeedback("");
    setNotice("해당 섹션을 다시 생성했습니다.");
    setTimeout(() => setNotice(""), 2200);
  }

  function restoreVersion(index, versionIndex) {
    if (!draft || typeof onDraftChange !== "function") return;
    const key = sectionKey(index);
    const version = histories[key]?.[versionIndex];
    if (!version) return;
    remember(index);

    if (index === "hero") {
      onDraftChange({ ...draft, ...clone(version) });
    } else {
      const sections = [...(draft.sections || [])];
      sections[index] = clone(version);
      onDraftChange({ ...draft, sections });
    }
    setNotice("이전 버전으로 복구했습니다.");
    setTimeout(() => setNotice(""), 2200);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 99,
          padding: "12px 18px",
          borderRadius: 999,
          border: "none",
          background: "#8A6A56",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        BRAND ENGINE Tools
      </button>
    );
  }

  const tabs = [
    ["projects", "프로젝트"],
    ["strategy", "Strategy"],
    ["review", "Review"],
  ];

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          width: 410,
          height: "80vh",
          maxHeight: "80vh",
          zIndex: 99,
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 20px 14px",
            flexShrink: 0,
            background: "#fff",
            borderBottom: "1px solid #f0ece7",
          }}
        >
          <div>
            <b style={{ fontSize: 18 }}>Service Experience</b>
            <div style={{ fontSize: 11, color: "#8B8175", marginTop: 3 }}>
              전략 확인 · 상세페이지 수정 · 검수
            </div>
          </div>
          <button
            aria-label="닫기"
            onClick={() => setOpen(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 7,
            padding: "12px 20px",
            flexShrink: 0,
            background: "#fff",
            borderBottom: "1px solid #f0ece7",
          }}
        >
          {tabs.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              style={{
                flex: 1,
                padding: "8px 6px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: tab === value ? "#8A6A56" : "#fff",
                color: tab === value ? "white" : "#333",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {notice && (
          <div style={{ padding: "9px 20px", background: "#F4EFE9", color: "#6E533F", fontSize: 12 }}>
            {notice}
          </div>
        )}

        <div style={{ overflowY: "auto", padding: "16px 20px 24px", flex: 1, minHeight: 0 }}>
          {tab === "projects" && (
            <>
              <button onClick={refreshProjects} style={{ width: "100%", padding: 10, borderRadius: 8, cursor: "pointer" }}>
                저장 프로젝트 새로고침
              </button>
              <div style={{ margin: "12px 0", fontSize: 13 }}>저장 프로젝트 {projects.length}개</div>
              {projects.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#777" }}>저장된 프로젝트가 없습니다.</div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.projectId}
                    onClick={() => typeof onLoadProject === "function" && onLoadProject(project.projectId)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: 12,
                      border: "1px solid #eee",
                      borderRadius: 10,
                      marginBottom: 8,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <b>{project.projectName}</b>
                    <div style={{ fontSize: 12, color: "#777", marginTop: 5 }}>
                      저장일: {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ marginTop: 7, color: "#8A6A56", fontSize: 11, fontWeight: 700 }}>클릭하여 불러오기 →</div>
                  </button>
                ))
              )}
            </>
          )}

          {tab === "strategy" && (
            <div style={{ lineHeight: 1.7, fontSize: 14 }}>
              <b>AI Commerce Strategy Report</b>
              {[
                ["01 제품 분석", "카테고리와 제품 특성을 기반으로 구매자가 확인해야 하는 기준을 분석합니다."],
                ["02 구매 기준", "원료·구성·품질·사용 정보를 중심으로 선택 기준을 정리합니다."],
                ["03 Story Flow", "관심 → 신뢰 → 차별점 → 선택 이유 → 행동의 흐름으로 설계합니다."],
                ["04 디자인 전략", "제품 성격에 맞는 정보 전달 방식과 이미지 방향을 연결합니다."],
              ].map(([title, body]) => (
                <div key={title} style={{ marginTop: 10, padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
                  <b>{title}</b>
                  <p style={{ marginBottom: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "review" && (
            <div style={{ lineHeight: 1.8, fontSize: 14 }}>
              <b>Human Review</b>
              <p>AI 생성 결과를 사람이 검토하는 단계입니다.</p>
              <ul>
                <li>표현 적합성</li>
                <li>카테고리 일치</li>
                <li>과장 표현 확인</li>
                <li>구매 정보 누락 체크</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div
          onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            background: "rgba(32,25,20,.38)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div style={{ width: "min(620px, 94vw)", maxHeight: "86vh", overflowY: "auto", background: "#fff", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "#8A6A56", fontWeight: 800 }}>{editing.label}</div>
                <b style={{ fontSize: 19 }}>섹션 직접 수정</b>
              </div>
              <button onClick={() => setEditing(null)} style={{ fontSize: 20, cursor: "pointer" }}>×</button>
            </div>

            <label style={{ display: "block", marginTop: 18, fontSize: 12, fontWeight: 800 }}>제목</label>
            <input
              value={editing.title}
              onChange={(event) => setEditing((current) => ({ ...current, title: event.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", padding: 11, marginTop: 6 }}
            />

            <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 800 }}>본문</label>
            <textarea
              value={editing.body}
              onChange={(event) => setEditing((current) => ({ ...current, body: event.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", padding: 11, marginTop: 6, minHeight: 150, resize: "vertical" }}
            />

            {editing.items !== undefined && editing.index !== "hero" && (
              <>
                <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 800 }}>목록 항목 (한 줄에 하나)</label>
                <textarea
                  value={editing.itemsText}
                  onChange={(event) => setEditing((current) => ({ ...current, itemsText: event.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", padding: 11, marginTop: 6, minHeight: 100, resize: "vertical" }}
                />
              </>
            )}

            <div style={{ marginTop: 18, padding: 12, background: "#faf7f2", borderRadius: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 8 }}>✨ AI 개선 요청</label>
              <select
                value={selectedImproveOption}
                onChange={(event) => {
                  setSelectedImproveOption(event.target.value);
                  if (event.target.value !== "custom") setCustomImproveInstruction("");
                }}
                style={{
                  width: "100%",
                  minHeight: 42,
                  padding: "9px 10px",
                  boxSizing: "border-box",
                  border: "1px solid #d8d1c7",
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <option value="">개선 방향을 선택하세요</option>
                {IMPROVEMENT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>

              {selectedImproveOption && (() => {
                const selected = IMPROVEMENT_OPTIONS.find((option) => option.id === selectedImproveOption);
                return selected ? (
                  <div style={{ marginTop: 9, padding: "10px 11px", border: "1px solid #ece3d8", borderRadius: 8, background: "#fffaf3", fontSize: 12, lineHeight: 1.55, color: "#5f5248" }}>
                    <b style={{ display: "block", marginBottom: 2, color: "#3c332d" }}>선택: {selected.label}</b>
                    {selected.description}
                  </div>
                ) : null;
              })()}

              {selectedImproveOption === "custom" && (
                <textarea
                  value={customImproveInstruction}
                  onChange={(event) => setCustomImproveInstruction(event.target.value)}
                  placeholder="원하는 개선 방향을 직접 작성해주세요."
                  style={{ width: "100%", minHeight: 76, marginTop: 9, boxSizing: "border-box", padding: 10, border: "1px solid #d8d1c7", borderRadius: 8, resize: "vertical" }}
                />
              )}

              <button
                type="button"
                disabled={
                  !onAIImproveRequest ||
                  !selectedImproveOption ||
                  (selectedImproveOption === "custom" && !customImproveInstruction.trim())
                }
                onClick={() => {
                  if (!onAIImproveRequest) return;
                  const selected = IMPROVEMENT_OPTIONS.find((option) => option.id === selectedImproveOption);
                  const instruction = selectedImproveOption === "custom"
                    ? customImproveInstruction.trim()
                    : selected?.instruction || "";
                  if (!instruction) return;
                  onAIImproveRequest({
                    section: editing,
                    data: editing,
                    instruction,
                  });
                }}
                style={{
                  marginTop: 9,
                  padding: "8px 12px",
                  background: selectedImproveOption && (selectedImproveOption !== "custom" || customImproveInstruction.trim()) ? "#8A6A56" : "#d8d2cc",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: selectedImproveOption && (selectedImproveOption !== "custom" || customImproveInstruction.trim()) ? "pointer" : "not-allowed",
                }}
              >
                ✨ AI 개선 적용
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <button onClick={() => setEditing(null)} style={{ padding: "9px 14px", cursor: "pointer" }}>취소</button>
              <button onClick={saveEdit} style={{ padding: "9px 14px", background: "#8A6A56", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                수정 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
