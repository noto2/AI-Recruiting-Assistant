import { GoogleGenAI, Type } from "@google/genai";
import { InitialCandidate } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- PROMPT FOR INDIVIDUAL ANALYSIS ---
const INDIVIDUAL_ANALYSIS_PROMPT = `
# 페르소나 (Persona)
너는 대한민국 IT 기업의 채용 전문가이자 AI 인재 검증 어시스턴트 'HR-GPT'다. 너의 임무는 채용 담당자가 지원자의 서류(이력서, 포트폴리오)와 채용 공고(JD)를 비교 분석하여, 면접에서 무엇을 확인해야 하는지 명확하게 파악할 수 있도록 돕는 것이다. 너의 분석은 데이터에 기반해야 하며, 객관적이고 실행 가능한(actionable) 정보를 제공해야 한다.

# 핵심 기능 및 작동 방식
사용자가 (1)이력서, (2)포트폴리오, (3)채용 공고(JD)를 제공하면, 너는 아래의 채점 기준과 출력 형식에 따라 '인재 분석 리포트'를 생성한다.

# 적합도 채점 기준 (Scoring Rubric)
지원자의 적합도를 평가할 때는 **반드시 아래의 루브릭을 엄격하게 단계별로 따라서 점수를 계산하고, 최종 점수를 100점 만점으로 산출해야 한다.**

1.  **핵심 기술 역량 (가중치: 40%):** JD의 '자격요건'에 명시된 필수 기술 스택과 지원자 서류의 기술 스택을 비교.
    *   완벽히 일치 (40점)
    *   대부분 일치 (30점)
    *   일부 일치 (15점)
    *   불일치 (0점)

2.  **직무/도메인 경험 (가중치: 30%):** JD에서 요구하는 직무(예: 백엔드 개발) 및 도메인 경험(예: e-커머스, 핀테크)의 연관성 평가.
    *   매우 높음 (30점)
    *   높음 (20점)
    *   보통 (10점)
    *   낮음 (0점)

3.  **경력 수준 부합도 (가중치: 15%):** JD에서 요구하는 경력(예: 3년 이상)과 지원자의 경력 수준 부합도 평가.
    *   부합 (15점)
    *   1~2년 미만 차이 (10점)
    *   2년 이상 차이 (0점)

4.  **문화/소프트스킬 키워드 (가중치: 15%):** JD의 '우대사항'이나 기업 문화 관련 키워드(예: '주도적인', '협업', '성장')와 지원자 서류 내용의 연관성 평가.
    *   높음 (15점)
    *   보통 (8점)
    *   낮음 (0점)

**계산 방법:** 각 항목의 점수를 합산하여 최종 적합도 점수를 산출한다.

# 출력 형식 (Output Format)
**[절대 규칙] 아래의 형식을 반드시, 엄격하게 준수해야 한다.** 각 섹션은 명확하게 구분되어야 한다.

---
[핵심 요약]
SCORE: [계산된 최종 점수]
RATING: [점수에 따른 평가: 매우 적합 (90점 이상), 적합 (70-89점), 검토 필요 (50-69점), 부적합 (50점 미만)]
GREEN_FLAGS: [긍정적 신호 1]\n[긍정적 신호 2]
RED_FLAGS: [확인 필요 사항 1]\n[확인 필요 사항 2]
CORE_COMPETENCIES: [핵심 역량 1]\n[핵심 역량 2]\n[핵심 역량 3]
[핵심 요약 끝]

---
[상세 분석]
[채점 기준의 각 항목을 근거로, 왜 그런 점수가 나왔는지 500자 내외로 구체적으로 서술한다.]
[상세 분석 끝]

---
[면접 질문 리스트]
# 기술 역량
- [기술 관련 질문 1]
- [기술 관련 질문 2]
# 경험 기반
- [경험/행동 기반 질문 1]
- [경험/행동 기반 질문 2]
# 문화 적합성
- [문화 적합성 관련 질문 1]
- [문화 적합성 관련 질문 2]
[면접 질문 리스트 끝]

---
[검증 체크리스트]
- [이력서의 특정 성과/수치에 대한 검증 포인트]
- [프로젝트 경험의 역할/기여도에 대한 검증 포인트]
- [기술 스택의 실제 숙련도에 대한 검증 포인트]
[검증 체크리스트 끝]
---
`;

// --- HELPER FUNCTION ---
export const fileToGenerativePart = (file: File) => {
  return new Promise<{ inlineData: { mimeType: string; data: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      if (base64Data) {
        resolve({
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        });
      } else {
        reject(new Error("Failed to read file as base64."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// --- API FOR INDIVIDUAL ANALYSIS ---
export const generateReport = async (resumeFile: File, portfolioFile: File | null, jdText: string | null, jdFile: File | null): Promise<string> => {
  const userParts: any[] = [];

  userParts.push({ text: `아래 첨부된 이력서, 포트폴리오(선택), JD를 바탕으로 인재 분석 리포트를 생성해주세요.`});
  
  userParts.push({ text: "이력서:" });
  userParts.push(await fileToGenerativePart(resumeFile));

  if (portfolioFile) {
    userParts.push({ text: "포트폴리오:" });
    userParts.push(await fileToGenerativePart(portfolioFile));
  }
  
  if (jdFile) {
    userParts.push({ text: "채용 공고 (JD):" });
    userParts.push(await fileToGenerativePart(jdFile));
  } else if (jdText) {
     userParts.push({ text: `채용 공고 (JD):\n${jdText}` });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: INDIVIDUAL_ANALYSIS_PROMPT,
    },
    contents: { parts: userParts },
  });
  
  return response.text;
};

// --- API FOR BULK ANALYSIS - STEP 1 ---
const initialBulkReportSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            candidateId: { type: Type.INTEGER },
            fileName: { type: Type.STRING },
            score: { type: Type.INTEGER },
            summary: { type: Type.STRING, description: 'JD와 이력서 내용을 비교한 1-2줄 핵심 요약' },
            greenFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["candidateId", "fileName", "score", "summary", "greenFlags", "redFlags"]
    }
};

export const generateInitialBulkReport = async (resumeFiles: File[], jdText: string | null, jdFile: File | null): Promise<InitialCandidate[]> => {
    const userParts: any[] = [];
    let promptText = `
# 지시사항
당신은 AI 채용 전문가 'HR-GPT'입니다. 아래 제공된 하나의 채용 공고(JD)와 여러 명의 지원자 이력서를 비교 분석해야 합니다.

## 과업
1.  각 지원자 이력서를 JD와 비교하여 INDIVIDUAL_ANALYSIS_PROMPT의 채점 기준에 따라 100점 만점으로 점수를 계산합니다.
2.  모든 지원자를 평가한 후, 점수가 가장 높은 순서대로 **상위 5명**의 후보자만 선별합니다.
3.  선별된 5명에 대해 요청된 JSON 스키마 형식에 맞춰 결과를 반환합니다. 결과는 반드시 점수 내림차순으로 정렬되어야 합니다.

## 입력 데이터
`;

    if (jdFile) {
        promptText += `\n### 채용 공고 (JD) 파일\n[JD 파일이 여기에 첨부됩니다.]\n`;
        userParts.push(await fileToGenerativePart(jdFile));
    } else if (jdText) {
        promptText += `\n### 채용 공고 (JD) 텍스트\n\`\`\`\n${jdText}\n\`\`\`\n`;
    }

    promptText += "\n### 지원자 이력서 목록\n";
    for (let i = 0; i < resumeFiles.length; i++) {
        const file = resumeFiles[i];
        promptText += `- 지원자 ${i+1}: ${file.name}\n`;
        userParts.push(await fileToGenerativePart(file));
    }
    
    userParts.unshift({ text: promptText });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: userParts },
        config: {
            responseMimeType: "application/json",
            responseSchema: initialBulkReportSchema,
        },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;
};


// --- API FOR BULK ANALYSIS - STEP 2 ---
const finalBulkReportSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            candidateId: { type: Type.INTEGER },
            fileName: { type: Type.STRING },
            finalScore: { type: Type.INTEGER },
            finalSummary: { type: Type.STRING, description: '포트폴리오까지 반영한 최종 1-2줄 요약' },
            interviewQuestions: {
                type: Type.OBJECT,
                properties: {
                    technical: { type: Type.ARRAY, items: { type: Type.STRING } },
                    behavioral: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cultural: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["technical", "behavioral", "cultural"]
            },
            verificationChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["candidateId", "fileName", "finalScore", "finalSummary", "interviewQuestions", "verificationChecklist"]
    }
};

export const generateFinalBulkReport = async (
    initialReport: InitialCandidate[],
    portfolioFiles: { candidateId: number; file: File }[],
    jdText: string | null,
    jdFile: File | null
) => {
    const userParts: any[] = [];
    let promptText = `
# 지시사항
당신은 AI 채용 전문가 'HR-GPT'입니다. 1단계 분석 결과와 추가로 제출된 포트폴리오를 바탕으로 최종 후보자를 선별해야 합니다.

## 과업
1.  아래 제공된 '1단계 분석 결과'와 '추가 제출 서류(포트폴리오)'를 JD와 함께 종합적으로 재평가합니다. 포트폴리오에 드러난 프로젝트의 완성도, 실제 결과물 등을 점수에 적극 반영하여 최종 점수를 산출합니다.
2.  모든 후보자를 재평가한 후, 최종 점수가 가장 높은 순서대로 **상위 3명**의 후보자만 선별합니다.
3.  선별된 3명 각각에 대해, 면접에서 활용할 '면접 질문 리스트'와 '검증 체크리스트'를 생성합니다.
4.  최종 3명에 대한 모든 정보를 요청된 JSON 스키마 형식에 맞춰 반환합니다. 결과는 반드시 최종 점수 내림차순으로 정렬되어야 합니다.

## 입력 데이터
### 1단계 분석 결과
\`\`\`json
${JSON.stringify(initialReport, null, 2)}
\`\`\`
`;
    
    if (jdFile) {
        promptText += `\n### 채용 공고 (JD) 파일\n[JD 파일이 여기에 첨부됩니다.]\n`;
        userParts.push(await fileToGenerativePart(jdFile));
    } else if (jdText) {
        promptText += `\n### 채용 공고 (JD) 텍스트\n\`\`\`\n${jdText}\n\`\`\`\n`;
    }

    promptText += "\n### 추가 제출 서류 (포트폴리오)\n";
    if (portfolioFiles.length > 0) {
        for (const { candidateId, file } of portfolioFiles) {
            const candidateInfo = initialReport.find(c => c.candidateId === candidateId);
            promptText += `- 후보자 ID ${candidateId} (${candidateInfo?.fileName})의 포트폴리오\n`;
            userParts.push(await fileToGenerativePart(file));
        }
    } else {
        promptText += "추가로 제출된 포트폴리오가 없습니다.\n";
    }

    userParts.unshift({ text: promptText });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: userParts },
        config: {
            responseMimeType: "application/json",
            responseSchema: finalBulkReportSchema,
        },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;
};
