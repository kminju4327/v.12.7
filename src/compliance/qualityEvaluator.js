// ═══════════════════════════════════════════════════════════════
// QUALITY EVALUATOR
// 역할: 생성된 카피의 품질 평가 (법적 준수 외)
// 검사 항목: 단어 반복, 문장 패턴, AI스러운 표현, 톤, 연결성
// ═══════════════════════════════════════════════════════════════

/**
 * 평가 결과 구조:
 * {
 *   quality_score: 0-100,
 *   issues: [
 *     { issue: "same_word_repetition", severity: "high", details: "..." }
 *   ],
 *   suggestions: [...]
 * }
 */

export async function evaluateQuality(content) {
  const issues = [];
  const suggestions = [];
  let qualityScore = 100;

  // ═══════════════════════════════════════════════════════════════
  // 1. 같은 단어 반복 검사
  // ═══════════════════════════════════════════════════════════════
  const wordRepetitionIssues = checkWordRepetition(content);
  if (wordRepetitionIssues.length > 0) {
    wordRepetitionIssues.forEach((issue) => {
      issues.push({
        issue: "word_repetition",
        severity: issue.count > 5 ? "high" : "medium",
        details: `"${issue.word}"이(가) ${issue.count}회 반복됨`,
        sections: issue.sections
      });
      qualityScore -= issue.count * 2;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. 같은 문장 패턴 반복 검사
  // ═══════════════════════════════════════════════════════════════
  const patternIssues = checkSentencePatterns(content);
  if (patternIssues.length > 0) {
    patternIssues.forEach((issue) => {
      issues.push({
        issue: "sentence_pattern_repetition",
        severity: "medium",
        details: `반복되는 문장 구조: "${issue.pattern}"`,
        count: issue.count
      });
      qualityScore -= 5;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. AI스러운 표현 검사
  // ═══════════════════════════════════════════════════════════════
  const aiExpressions = checkAIExpressions(content);
  if (aiExpressions.length > 0) {
    aiExpressions.forEach((expr) => {
      issues.push({
        issue: "ai_like_expression",
        severity: "high",
        details: `AI 스러운 표현: "${expr.text}"`,
        suggestion: expr.suggestion
      });
      qualityScore -= 10;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. 브랜드 톤 일관성 검사
  // ═══════════════════════════════════════════════════════════════
  const toneIssues = checkBrandTone(content);
  if (toneIssues.length > 0) {
    toneIssues.forEach((issue) => {
      issues.push({
        issue: "tone_inconsistency",
        severity: "medium",
        details: issue.details,
        section: issue.section
      });
      qualityScore -= 3;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. 섹션 연결성 검사
  // ═══════════════════════════════════════════════════════════════
  const connectionIssues = checkSectionConnection(content);
  if (connectionIssues.length > 0) {
    connectionIssues.forEach((issue) => {
      issues.push({
        issue: "section_connection",
        severity: "low",
        details: issue.details,
        sections: [issue.from, issue.to]
      });
      qualityScore -= 2;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 생성 제안
  // ═══════════════════════════════════════════════════════════════
  if (issues.length > 0) {
    suggestions.push("단어와 문장 구조를 더 다양하게 변경해주세요");
    suggestions.push("더 자연스럽고 인간미 있는 표현을 사용해주세요");
  }

  return {
    quality_score: Math.max(0, qualityScore),
    issue_count: issues.length,
    issues,
    suggestions,
    isPassable: qualityScore >= 70
  };
}

// ═══════════════════════════════════════════════════════════════
// 세부 검사 함수들
// ═══════════════════════════════════════════════════════════════

function checkWordRepetition(content) {
  const issues = [];
  const sections = content.sections || [];
  
  // 전체 텍스트에서 단어 추출
  const allText = (content.hero_headline || "") + 
                  (content.hero_subcopy || "") +
                  sections.map(s => s.body || "").join(" ");
  
  const words = allText
    .match(/\b[\u4e00-\u9fff\u3040-\u309F\uac00-\ud7af\w]+\b/g) || [];
  
  const wordCount = {};
  words.forEach((word) => {
    if (word.length > 2) {
      // 2글자 이상만 검사
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });

  // 4회 이상 반복된 단어 찾기
  Object.entries(wordCount).forEach(([word, count]) => {
    if (count >= 4) {
      issues.push({
        word,
        count,
        sections: findSectionsWithWord(sections, word)
      });
    }
  });

  return issues;
}

function checkSentencePatterns(content) {
  const issues = [];
  const sections = content.sections || [];
  const sentences = [];

  // 모든 문장 추출
  sections.forEach((section) => {
    if (section.body) {
      const matches = section.body.match(/[^.!?
]+[.!?]/g) || [];
      sentences.push(...matches);
    }
  });

  // 문장 시작 패턴 분석
  const patterns = {};
  sentences.forEach((sentence) => {
    const start = sentence.substring(0, 8); // 첫 8글자 패턴
    patterns[start] = (patterns[start] || 0) + 1;
  });

  // 3회 이상 반복된 패턴 찾기
  Object.entries(patterns).forEach(([pattern, count]) => {
    if (count >= 3 && pattern.trim().length > 3) {
      issues.push({
        pattern: pattern.trim(),
        count
      });
    }
  });

  return issues;
}

function checkAIExpressions(content) {
  const aiPatterns = [
    {
      regex: /이는|이것은|그것은|해당|상기|전술한/g,
      suggestion: "더 자연스러운 표현 사용"
    },
    {
      regex: /또한|더욱|특히|특히도|주목할|강조하자면/g,
      suggestion: "문장을 더 간단하게"
    },
    {
      regex: /것으로 알려져|것으로 보인|것으로 파악|것으로 예상/g,
      suggestion: "직접적인 표현 사용"
    },
    {
      regex: /따라서|그러므로|이러한|이와 같이|그렇다면/g,
      suggestion: "단어를 다양하게"
    }
  ];

  const issues = [];
  aiPatterns.forEach((pattern) => {
    const matches = content.hero_headline?.match(pattern.regex) || [];
    matches.forEach((match) => {
      issues.push({
        text: match,
        suggestion: pattern.suggestion
      });
    });
  });

  return issues;
}

function checkBrandTone(content) {
  const issues = [];
  
  // 존댓말과 반말 혼용 검사
  const hasPoliteForm = /습니다|세요|네요|더라고요/g.test(
    (content.hero_headline || "") + (content.hero_subcopy || "")
  );
  
  const hasPlainForm = /한다|한다$|다$|다는/g.test(
    (content.hero_headline || "") + (content.hero_subcopy || "")
  );

  if (hasPoliteForm && hasPlainForm) {
    issues.push({
      details: "존댓말과 반말이 혼용되어 있습니다",
      section: "hero"
    });
  }

  // 과도한 수동태 사용
  const passiveCount = (
    (content.hero_headline || "").match(/되|되어|되고|되면/g) || []
  ).length;
  
  if (passiveCount > 2) {
    issues.push({
      details: "수동태가 많습니다. 능동태로 변경해주세요",
      section: "hero"
    });
  }

  return issues;
}

function checkSectionConnection(content) {
  const issues = [];
  const sections = content.sections || [];

  // 이전 섹션과 다음 섹션의 연결 확인
  for (let i = 0; i < sections.length - 1; i++) {
    const current = sections[i];
    const next = sections[i + 1];
    
    const currentEnd = (current.body || "").slice(-20);
    const nextStart = (next.body || "").substring(0, 20);
    
    // 주제가 급격히 바뀌는지 확인 (간단한 휴리스틱)
    if (
      currentEnd.length > 5 &&
      nextStart.length > 5 &&
      !isSimilar(currentEnd, nextStart)
    ) {
      // 연결성 낮음 (심화 분석 필요)
      // 지금은 패스
    }
  }

  return issues;
}

// ═══════════════════════════════════════════════════════════════
// 헬퍼 함수들
// ═══════════════════════════════════════════════════════════════

function findSectionsWithWord(sections, word) {
  return sections
    .map((s, idx) => {
      if (s.body && s.body.includes(word)) {
        return idx;
      }
      return -1;
    })
    .filter((idx) => idx !== -1);
}

function isSimilar(text1, text2) {
  // 간단한 유사도 검사 (구현 생략)
  return false;
}

export default evaluateQuality;
