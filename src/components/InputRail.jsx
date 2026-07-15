// 좌측 입력 레일: 제품 정보 입력 폼 + 테마/컨셉 선택 + 생성 버튼 + 진행 표시.

import { Image as ImageIcon, X, Sparkles, Loader2 } from "lucide-react";
import Field from "./Field.jsx";
import StageProgress from "./StageProgress.jsx";
import { PRESET_COLORS, CONCEPTS, inputStyle } from "../styles/theme.js";
import { CATEGORY_TREE } from "../utils/categoryTree.js";

export default function InputRail({
  product,
  update,
  updateProductCategory,
  image,
  setImage,
  handleImage,
  fileInputRef,
  themeColor,
  setThemeColor,
  concept,
  setConcept,
  isGenerating,
  canGenerate,
  stage,
  error,
  onGenerate,
}) {
  return (
    <div
      style={{
        background: "#1F2A24",
        color: "#F4F3EE",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.5,
            opacity: 0.6,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          AI Detail Page
        </div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>제품 정보 입력</div>
      </div>

      <Field label="제품명 *">
        <input
          style={inputStyle}
          disabled={isGenerating}
          value={product.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="예: 식물성 베르베린 88"
        />
      </Field>

      <Field label="카테고리 *">
        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          {/* 1차 카테고리 (주 분류) */}
          <select
            value={product.mainCategory}
            onChange={(e) => {
              const main = e.target.value;
              const subs = CATEGORY_TREE[main];
              const sub = product.subCategory && subs.includes(product.subCategory) 
                ? product.subCategory 
                : subs[0];
              updateProductCategory(main, sub);
            }}
            disabled={isGenerating}
            style={{
              ...inputStyle,
              flex: 1,
              padding: "9px 10px",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {Object.keys(CATEGORY_TREE).map((main) => (
              <option key={main} value={main}>
                {main}
              </option>
            ))}
          </select>

          {/* 2차 카테고리 (세부 분류) */}
          <select
            value={product.subCategory}
            onChange={(e) => updateProductCategory(product.mainCategory, e.target.value)}
            disabled={isGenerating}
            style={{
              ...inputStyle,
              flex: 1,
              padding: "9px 10px",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {CATEGORY_TREE[product.mainCategory]?.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </Field>

      <Field label="타깃 고객 (선택)">
        <textarea
          style={{ ...inputStyle, height: 56, resize: "vertical" }}
          disabled={isGenerating}
          value={product.target}
          onChange={(e) => update("target", e.target.value)}
          placeholder="예) 30대 여성, 부모님 선물용, 프리미엄 식품을 찾는 고객"
        />
      </Field>

      <Field label="핵심 장점 (선택)">
        <textarea
          style={{ ...inputStyle, height: 56, resize: "vertical" }}
          disabled={isGenerating}
          value={product.benefits}
          onChange={(e) => update("benefits", e.target.value)}
          placeholder="예: 베르베린 복합물 88.1%, 해썹 인증, 1일 2정"
        />
      </Field>

      <Field label="인증정보 (선택)">
        <input
          style={inputStyle}
          disabled={isGenerating}
          value={product.certs}
          onChange={(e) => update("certs", e.target.value)}
          placeholder="예: HACCP, 특허번호"
        />
      </Field>

      <Field label="핵심 원료명 (선택 — 수치 표현 정확도를 위해 추천)">
        <input
          style={inputStyle}
          disabled={isGenerating}
          value={product.ingredientName}
          onChange={(e) => update("ingredientName", e.target.value)}
          placeholder="예: 베르베린 복합물"
        />
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="원료 순도 (%, 선택)">
            <input
              style={inputStyle}
              disabled={isGenerating}
              value={product.purity}
              onChange={(e) => update("purity", e.target.value)}
              placeholder="예: 88.1"
            />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="1일 섭취량 기준 실제 함량 (mg, 선택)">
            <input
              style={inputStyle}
              disabled={isGenerating}
              value={product.actualAmount}
              onChange={(e) => update("actualAmount", e.target.value)}
              placeholder="예: 500"
            />
          </Field>
        </div>
      </div>

      {product.actualAmount && (
        <Field label="위 mg 수치는 무엇 기준인가요?">
          <div style={{ display: "flex", gap: 8 }}>
            {["원료 총중량", "핵심 활성성분"].map((b) => (
              <button
                key={b}
                onClick={() => update("amountBasis", b)}
                disabled={isGenerating}
                style={{
                  flex: 1,
                  padding: "7px 8px",
                  borderRadius: 8,
                  border:
                    product.amountBasis === b
                      ? `1.5px solid ${themeColor}`
                      : "1.5px solid rgba(244,243,238,0.2)",
                  background:
                    product.amountBasis === b
                      ? "rgba(244,243,238,0.1)"
                      : "rgba(244,243,238,0.06)",
                  color: "#F4F3EE",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {b}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.5, marginTop: 4 }}>
            예: 오메가3에서 "정제어유 1000mg"은 원료 총중량, "EPA+DHA 1000mg"은 핵심 활성성분이에요.
          </div>
        </Field>
      )}
      <div style={{ fontSize: 11, opacity: 0.5, marginTop: -10 }}>
        두 값 중 하나라도 채우면, 상세페이지에 "순도 vs 실제 함량" 혼동 없이 정확하게 표기돼요.
      </div>

      {(product.amountBasis === "핵심 활성성분" || product.category === "건강기능식품") && (
        <div>
          <div style={{ fontSize: 11.5, opacity: 0.6, marginBottom: 6 }}>
            EPA / DHA 개별 함량 (mg, 선택 — 오메가3 제품인 경우)
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              disabled={isGenerating}
              value={product.epa}
              onChange={(e) => update("epa", e.target.value)}
              placeholder="EPA mg (예: 480)"
            />
            <input
              style={{ ...inputStyle, flex: 1 }}
              disabled={isGenerating}
              value={product.dha}
              onChange={(e) => update("dha", e.target.value)}
              placeholder="DHA mg (예: 360)"
            />
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.5, marginTop: 4 }}>
            입력하면 상세페이지에 실제 수치로 표기돼요. 없으면 "성분표 참조"로만 안내해요.
          </div>
        </div>
      )}

      <Field label="제품 사진 (선택)">
        {image ? (
          <div style={{ position: "relative" }}>
            <img
              src={image}
              alt="product"
              style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
            />
            <button
              onClick={() => setImage(null)}
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                background: "rgba(0,0,0,0.6)",
                border: "none",
                borderRadius: 6,
                padding: 4,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...inputStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
              color: "rgba(244,243,238,0.6)",
            }}
          >
            <ImageIcon size={15} /> 사진 업로드
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImage}
          style={{ display: "none" }}
        />
      </Field>

      <Field label="테마 컬러">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setThemeColor(c)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: c,
                border: themeColor === c ? "2px solid #F4F3EE" : "2px solid transparent",
                outline: themeColor === c ? `2px solid ${c}` : "none",
                cursor: "pointer",
              }}
            />
          ))}
          <input
            type="color"
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            style={{ width: 28, height: 28, border: "none", background: "none", cursor: "pointer" }}
          />
        </div>
      </Field>

      <Field label="디자인 컨셉">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {CONCEPTS.map((c) => (
            <button
              key={c.id}
              onClick={() => setConcept(c.id)}
              style={{
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 8,
                border:
                  concept === c.id
                    ? `1.5px solid ${themeColor}`
                    : "1.5px solid rgba(244,243,238,0.15)",
                background: concept === c.id ? "rgba(244,243,238,0.06)" : "transparent",
                color: "#F4F3EE",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</div>
              <div style={{ fontSize: 11, opacity: 0.55 }}>{c.desc}</div>
            </button>
          ))}
        </div>
      </Field>

      <button
        onClick={onGenerate}
        disabled={!canGenerate}
        style={{
          marginTop: 8,
          padding: "12px 16px",
          borderRadius: 10,
          border: "none",
          background: canGenerate ? themeColor : "rgba(244,243,238,0.15)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          cursor: canGenerate ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {isGenerating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
        {isGenerating ? "생성 중..." : "상세페이지 생성"}
      </button>

      <StageProgress stage={stage} themeColor={themeColor} />

      {error && <div style={{ fontSize: 12, color: "#E8998D" }}>{error}</div>}
    </div>
  );
}
