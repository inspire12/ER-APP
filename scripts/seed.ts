import { seedTemplates } from "../src/content/seed";
import { getDatabase } from "../src/db/client";
import { diseaseTemplates } from "../src/db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL이 필요합니다.");
}

const db = getDatabase();
if (!db) throw new Error("DB에 연결하지 못했습니다.");

await db.insert(diseaseTemplates).values(seedTemplates.map((template) => ({
  name: template.name,
  aliases: template.aliases,
  medication: template.medication,
  education: template.education,
  warningSigns: template.warningSigns,
  active: template.active,
}))).onConflictDoNothing({ target: diseaseTemplates.name });

console.log(`${seedTemplates.length}개의 기본 질환 콘텐츠를 등록했습니다.`);
