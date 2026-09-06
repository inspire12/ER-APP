import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { listDiseaseTemplates } from "@/db/repository";
import { analysisSchema } from "@/lib/validation";

const demoAnalysis = {
  diagnosis: "급성 위장염 의심",
  templateName: "급성 장염",
  findings: "활력징후는 안정적이고 의식은 명료합니다. 복부는 부드럽고 반발통이나 우하복부 국소 압통은 없습니다. 혈액검사에서는 경미한 염증수치 상승 외 특이소견이 확인되지 않았습니다.",
  medicationNote: "위장관 증상 조절약이 처방되었습니다.",
};

export async function POST(request: Request) {
  const { clinicalText, demo } = await request.json();
  if (typeof clinicalText !== "string" || !clinicalText.trim()) return NextResponse.json({ error: "진료 내용을 입력해 주세요." }, { status: 400 });
  if (demo) return NextResponse.json(demoAnalysis);
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY가 필요합니다." }, { status: 503 });

  const templates = await listDiseaseTemplates(true);
  const allowedNames = new Set(templates.map((item) => item.name));
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: `당신은 응급실 의료진의 입력을 정리하는 보조 도구입니다. 입력에 없는 진단, 검사, 처방, 안내를 만들지 마세요. 템플릿 목록에서 가장 가까운 하나를 추천하고 확실하지 않으면 templateName을 빈 문자열로 반환하세요.\n템플릿: ${JSON.stringify(templates.map(({ name, aliases }) => ({ name, aliases })))}\n의료진 입력: ${clinicalText}\nJSON만 반환: {"diagnosis":"","templateName":"","findings":"","medicationNote":""}`,
    config: { responseMimeType: "application/json" },
  });
  const parsed = analysisSchema.safeParse(JSON.parse(response.text || "{}"));
  if (!parsed.success) return NextResponse.json({ error: "AI 결과를 검증하지 못했습니다." }, { status: 502 });
  if (parsed.data.templateName && !allowedNames.has(parsed.data.templateName)) parsed.data.templateName = "";
  return NextResponse.json(parsed.data);
}
