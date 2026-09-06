import { NextResponse } from "next/server";
import { listDiseaseTemplates, saveDiseaseTemplate } from "@/db/repository";
import { templateSchema } from "@/lib/validation";

export async function GET() {
  return NextResponse.json(await listDiseaseTemplates());
}

export async function POST(request: Request) {
  const parsed = templateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "입력 내용을 확인해 주세요." }, { status: 400 });
  try {
    await saveDiseaseTemplate({ ...parsed.data, id: parsed.data.id ?? 0 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "저장하지 못했습니다." }, { status: 503 });
  }
}
