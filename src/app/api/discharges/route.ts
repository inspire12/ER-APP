import { NextResponse } from "next/server";
import { createDischarge } from "@/db/repository";
import { createPatientToken } from "@/lib/token";
import { dischargeSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = dischargeSchema.safeParse(body.content);
  if (!body.confirmed || !parsed.success) return NextResponse.json({ error: "의료진 확인과 필수 내용을 확인해 주세요." }, { status: 400 });
  if (body.demo) return NextResponse.json({ url: "/p/demo" });
  try {
    const token = createPatientToken();
    await createDischarge(token, parsed.data);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    return NextResponse.json({ url: `${baseUrl}/p/${token}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "발급하지 못했습니다." }, { status: 503 });
  }
}
