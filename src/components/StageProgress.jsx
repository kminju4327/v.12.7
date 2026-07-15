// 파이프라인 진행 상태 표시.
// 2단계 라벨(생성 → 컴플라이언스)에 대해, 현재 stage 값에 따라
// 완료(체크)/진행중(스피너)/대기(빈 원) 아이콘을 보여준다.
//
// stage 매핑: 0~1 = 생성, 2~3 = 컴플라이언스, 4 = 완료

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { STAGE_LABELS } from "../styles/theme.js";

export default function StageProgress({ stage, themeColor }) {
  if (stage < 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
      {STAGE_LABELS.map((label, i) => {
        const stepDone = stage >= 4 || stage > (i === 0 ? 1 : 3);
        const stepActive = i === 0 ? stage <= 1 : stage >= 2 && stage < 4;
        return (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12.5,
              opacity: stepDone || stepActive ? 1 : 0.4,
            }}
          >
            {stepDone ? (
              <CheckCircle2 size={14} color={themeColor} />
            ) : stepActive ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <Circle size={14} />
            )}
            {label}
          </div>
        );
      })}
    </div>
  );
}
