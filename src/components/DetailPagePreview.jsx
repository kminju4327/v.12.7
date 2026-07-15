// 생성된 상세페이지 미리보기.
// hero + 각 섹션을 선택된 디자인 컨셉/테마 컬러로 렌더링하고,
// 각 블록에 부분 재생성 버튼(PreviewSection)을 붙인다.

import { useState, useEffect } from "react";
import PreviewSection from "./PreviewSection.jsx";
import SectionEditor from "./SectionEditor.jsx";
import { CONCEPT_STYLES, sectionLabel } from "../styles/theme.js";
import { normalizeSectionItems } from "../utils/sectionItem.js";

export default function DetailPagePreview({ draft, generatedPage, image, concept, themeColor, onRegen, regenIndex, onEditSection, onAIImproveRequest }) {
  const [editing, setEditing] = useState(null);
  const sourcePage = generatedPage || draft || {};
  const [sections, setSections] = useState(sourcePage?.sections || []);
  useEffect(()=>{ setSections((generatedPage || draft)?.sections || []); }, [generatedPage, draft]);
  const [editHistory, setEditHistory] = useState([]);
  const saveSection = (data) => {
    const previous = editing.section || {};
    const next = sections.map((s,i)=> i===editing.index ? {...s,...data} : s);
    setSections(next);
    const record = {
      section: editing.index,
      before: previous,
      after: data,
      version: editHistory.length + 1,
      timestamp: new Date().toISOString()
    };
    setEditHistory(prev => [...prev, record]);
    if (onEditSection) onEditSection(editing.index, next[editing.index], record);
    setEditing(null);
  };
  if (!draft) return null;

  const conceptStyle = CONCEPT_STYLES[concept];
  const currentDraft = {...draft, sections};

  return (
    <>
    {editing && <SectionEditor section={editing.section} onSave={saveSection} onClose={()=>setEditing(null)} onAIImproveRequest={onAIImproveRequest} />}
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* HERO */}
      <PreviewSection idx="hero" accent={themeColor}>
        <div
          style={{
            borderRadius: conceptStyle.radius,
            boxShadow: conceptStyle.shadow,
            border: conceptStyle.border,
            padding: 28,
            background: "#fff",
          }}
        >
          {image && (
            <img
              src={image}
              alt="product"
              style={{
                width: "100%",
                height: 200,
                objectFit: "cover",
                borderRadius: conceptStyle.radius,
                marginBottom: 18,
              }}
            />
          )}
          <div
            style={{
              fontFamily: conceptStyle.headFont,
              fontWeight: conceptStyle.headWeight,
              fontSize: 26,
              lineHeight: 1.3,
              color: "#1F2A24",
              marginBottom: 8,
            }}
          >
            {draft.hero_headline}
          </div>
          <div style={{ fontSize: 14.5, color: "#6B6A61" }}>{draft.hero_subcopy}</div>
        </div>
      </PreviewSection>

      {/* SECTIONS */}
      {sections?.map((s, i) => (
        <PreviewSection
          key={i}
          idx={i}
          accent={themeColor}
          onEdit={() => setEditing({ index: i, section: s })}
        >
          <div
            style={{
              borderRadius: conceptStyle.radius,
              boxShadow: conceptStyle.shadow,
              border: conceptStyle.border,
              padding: "20px 24px",
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: themeColor,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {sectionLabel(s.type)}
            </div>
            {s.title && (
              <div
                style={{
                  fontFamily: conceptStyle.headFont,
                  fontWeight: conceptStyle.headWeight,
                  fontSize: 17,
                  marginBottom: 6,
                  color: "#1F2A24",
                }}
              >
                {s.title}
              </div>
            )}
            {s.body && (
              <div style={{ fontSize: 14, color: "#4A4940", lineHeight: 1.6 }}>{s.body}</div>
            )}
            {Array.isArray(s.items) && normalizeSectionItems(s.items).length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: "#4A4940", lineHeight: 1.8 }}>
                {normalizeSectionItems(s.items).map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            )}
          </div>
        </PreviewSection>
      ))}
    </div>
    </>
  );
}
