import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resourceCategories, visibilityLevels, type Resource } from "@/modules/core/domain";
import { addDemoResource } from "@/modules/demo/demo-store";
import { getCurrentPrincipal } from "@/modules/identity/session";

const resourceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(600),
  category: z.enum(resourceCategories),
  visibility: z.enum(visibilityLevels),
  expirationDate: z.string().date().nullable(),
  fields: z.array(z.object({ label: z.string().trim().min(1).max(100), value: z.string().trim().min(1).max(500) })).min(1).max(20),
  document: z.object({ filename: z.string().max(120), mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]), sizeBytes: z.number().int().min(1).max(5 * 1024 * 1024) }).nullable(),
  source: z.enum(["AI_REVIEWED", "MANUAL"]),
});

function slug(value: string): string {
  return `${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55) || "resource"}-${randomUUID().slice(0, 6)}`;
}

export async function POST(request: Request) {
  const principal = await getCurrentPrincipal();
  const parsed = resourceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the resource details and try again." }, { status: 400 });
  const now = new Date().toISOString();
  const resource: Resource = {
    id: slug(parsed.data.title), householdId: principal.householdId, ownerMemberId: principal.memberId,
    name: parsed.data.title, category: parsed.data.category, description: parsed.data.description,
    visibility: parsed.data.visibility, fields: parsed.data.fields.map((field) => ({ ...field, mask: /policy|member id|vin|account/i.test(field.label) })),
    document: parsed.data.document ?? undefined, expiresAt: parsed.data.expirationDate ?? undefined, createdAt: now, updatedAt: now,
  };
  addDemoResource(resource, principal.memberId);
  return NextResponse.json({ resourceId: resource.id }, { status: 201 });
}
