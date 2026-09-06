import { describe, expect, it } from "vitest";
import { dischargeSchema } from "../../src/lib/validation";

describe("discharge validation", () => {
  it("accepts a complete clinician-reviewed guide", () => {
    expect(dischargeSchema.safeParse({
      diagnosis: "급성 위장염 의심",
      findings: "복부는 부드럽고 반발통은 없습니다.",
      medication: "처방전의 용법대로 복용하세요.",
      education: "물을 조금씩 자주 드세요.",
      warningSigns: "심한 복통이 지속되면 다시 오세요.",
      templateId: 1,
    }).success).toBe(true);
  });

  it("rejects a guide missing safety content", () => {
    expect(dischargeSchema.safeParse({
      diagnosis: "급성 위장염",
      findings: "",
      medication: "",
      education: "",
      warningSigns: "",
    }).success).toBe(false);
  });
});
