import { boolean, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { DischargeContent } from "@/lib/types";

export const diseaseTemplates = pgTable("disease_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  aliases: text("aliases").notNull().default(""),
  medication: text("medication").notNull(),
  education: text("education").notNull(),
  warningSigns: text("warning_signs").notNull(),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const discharges = pgTable("discharges", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  content: jsonb("content").$type<DischargeContent>().notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});
