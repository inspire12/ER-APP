import { z } from "zod";

export const analysisSchema = z.object({
  diagnosis: z.string().max(200),
  templateName: z.string().max(200),
  findings: z.string().max(4000),
  medicationNote: z.string().max(2000),
});

export const dischargeSchema = z.object({
  diagnosis: z.string().min(1).max(200),
  findings: z.string().max(4000),
  medication: z.string().min(1).max(4000),
  education: z.string().min(1).max(8000),
  warningSigns: z.string().min(1).max(8000),
  templateId: z.number().int().positive().optional(),
});

export const templateSchema = z.object({
  id: z.number().int().nonnegative().optional(),
  name: z.string().min(1).max(200),
  aliases: z.string().max(1000),
  medication: z.string().min(1).max(8000),
  education: z.string().min(1).max(12000),
  warningSigns: z.string().min(1).max(12000),
  active: z.boolean(),
});
