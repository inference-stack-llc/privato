import { z } from "zod";
import { visibilityLevels } from "@/modules/core/domain";

export const extractionFieldSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(100),
  value: z.string().max(500),
  confidence: z.number().min(0).max(1),
});

export const insuranceExtractionSchema = z.object({
  documentType: z.enum(["HEALTH_INSURANCE", "AUTO_INSURANCE", "UNKNOWN"]),
  title: z.string().min(1).max(120),
  fields: z.array(extractionFieldSchema).max(20),
  effectiveDate: z.string().max(30).nullable(),
  expirationDate: z.string().max(30).nullable(),
  recommendedVisibility: z.enum(visibilityLevels),
  recommendationReason: z.string().min(1).max(240),
  overallConfidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string().max(180)).max(8),
});

export type InsuranceExtraction = z.infer<typeof insuranceExtractionSchema>;

export const assistantAnswerSchema = z.object({
  answer: z.string().min(1).max(1500),
  citationIds: z.array(z.string()).max(8),
});

export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;
