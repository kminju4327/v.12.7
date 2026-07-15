// LLM 응답 텍스트에서 JSON을 안전하게 추출/파싱하는 유틸.
//
// LLM은 종종 (1) 코드블록(```json ... ```)으로 감싸거나
// (2) 응답이 max_tokens에 걸려 중간에 잘리는 경우가 있다.
// 아래 로직은 두 상황을 모두 방어한다.

// 응답 텍스트에서 JSON 객체를 파싱한다. 잘린 경우 복구를 시도한다.
export function parseLLMJson(text) {
  // 1) 정상 케이스: 첫 { 부터 마지막 } 까지를 그대로 파싱 시도
  const match = text.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : text;
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // 2) 잘린 케이스: 완결된 부분까지만 살려서 복구 시도
    return salvageTruncatedJson(text);
  }
}

// 응답이 중간에 잘린 경우, 열린 괄호/배열을 닫아 최대한 복구한다.
// 마지막 불완전 객체는 버리고, 완결된 항목까지만 살린다.
export function salvageTruncatedJson(text) {
  let salvage = text.slice(text.indexOf("{"));

  // 잘린 마지막 불완전 객체 제거: 마지막으로 완결된 '}' 뒤를 잘라냄
  const lastClose = salvage.lastIndexOf("}");
  if (lastClose > 0) salvage = salvage.slice(0, lastClose + 1);

  const opens = (salvage.match(/\{/g) || []).length;
  const closes = (salvage.match(/\}/g) || []).length;
  const openArr = (salvage.match(/\[/g) || []).length;
  const closeArr = (salvage.match(/\]/g) || []).length;

  // 마지막에 남은 쉼표 제거
  salvage = salvage.replace(/,\s*$/, "");

  // 열린 배열/객체 수만큼 닫아준다
  salvage += "]".repeat(Math.max(0, openArr - closeArr));
  salvage += "}".repeat(Math.max(0, opens - closes));

  try {
    return JSON.parse(salvage);
  } catch (e2) {
    throw new Error(
      "응답이 너무 길어 잘렸어요. 다시 시도해주세요. (원본 일부: " + text.slice(0, 200) + ")"
    );
  }
}
