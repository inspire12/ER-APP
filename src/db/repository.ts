import { and, eq, gt, isNull } from "drizzle-orm";
import { seedTemplates } from "@/content/seed";
import { getDatabase } from "@/db/client";
import { diseaseTemplates, discharges } from "@/db/schema";
import type { DiseaseTemplate, DischargeContent } from "@/lib/types";
import { hashPatientToken } from "@/lib/token";

export async function listDiseaseTemplates(activeOnly = false): Promise<DiseaseTemplate[]> {
  const db = getDatabase();
  if (!db) return seedTemplates.filter((item) => !activeOnly || item.active);
  const rows = activeOnly
    ? await db.select().from(diseaseTemplates).where(eq(diseaseTemplates.active, true)).orderBy(diseaseTemplates.name)
    : await db.select().from(diseaseTemplates).orderBy(diseaseTemplates.name);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    aliases: row.aliases,
    medication: row.medication,
    education: row.education,
    warningSigns: row.warningSigns,
    active: row.active,
  }));
}

export async function saveDiseaseTemplate(template: DiseaseTemplate) {
  const db = getDatabase();
  if (!db) throw new Error("DATABASE_URL이 필요합니다.");
  const values = {
    name: template.name,
    aliases: template.aliases,
    medication: template.medication,
    education: template.education,
    warningSigns: template.warningSigns,
    active: template.active,
    updatedAt: new Date(),
  };
  if (template.id > 0) {
    await db.update(diseaseTemplates).set(values).where(eq(diseaseTemplates.id, template.id));
  } else {
    await db.insert(diseaseTemplates).values(values);
  }
}

export async function createDischarge(token: string, content: DischargeContent) {
  const db = getDatabase();
  if (!db) throw new Error("DATABASE_URL이 필요합니다.");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(discharges).values({ tokenHash: hashPatientToken(token), content, expiresAt });
}

export async function findDischarge(token: string) {
  const db = getDatabase();
  if (!db) return null;
  const [row] = await db
    .select({ content: discharges.content })
    .from(discharges)
    .where(
      and(
        eq(discharges.tokenHash, hashPatientToken(token)),
        isNull(discharges.revokedAt),
        gt(discharges.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row?.content ?? null;
}
