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

export const askQuestionSchema = z.object({
  question: z.string().trim().min(1).max(500),
}).strict();

export const assistantAnswerSchema = z.object({
  answerable: z.boolean(),
  answer: z.string().min(1).max(2000),
  citations: z.array(z.object({
    sourceId: z.string().min(1).max(20),
    resourcePublicId: z.string().min(1).max(160),
    reason: z.string().max(240).nullable(),
  }).strict()).max(5),
  confidence: z.enum(["high", "medium", "low"]),
}).strict().superRefine((value, context) => {
  if (!value.answerable && value.citations.length > 0) {
    context.addIssue({ code: "custom", path: ["citations"], message: "Unanswerable results cannot include citations." });
  }
  if (value.answerable && value.citations.length === 0) {
    context.addIssue({ code: "custom", path: ["citations"], message: "Answerable results require at least one citation." });
  }
});

export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;
