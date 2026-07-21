import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAiGateway } from "@/modules/ai/gateway";
import { recordDemoAudit } from "@/modules/demo/demo-store";
import { getCurrentPrincipal } from "@/modules/identity/session";

const MAX_BYTES = 5 * 1024 * 1024;
const mimeExtensions: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

function sanitizedFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-120) || "insurance-document";
}

export async function POST(request: Request) {
  const principal = await getCurrentPrincipal();
  const correlationId = randomUUID();
  try {
    const form = await request.formData();
    const document = form.get("document");
    if (!(document instanceof File)) return NextResponse.json({ error: "Choose a document to continue.", correlationId }, { status: 400 });
    const cleanName = sanitizedFilename(document.name);
    const extension = cleanName.split(".").pop()?.toLowerCase() ?? "";
    if (!mimeExtensions[document.type]?.includes(extension)) return NextResponse.json({ error: "The file type and extension must be PDF, JPEG, PNG, or WebP.", correlationId }, { status: 415 });
    if (document.size < 1 || document.size > MAX_BYTES) return NextResponse.json({ error: "The document must be between 1 byte and 5 MB.", correlationId }, { status: 413 });
    recordDemoAudit({ householdId: principal.householdId, actorMemberId: principal.memberId, action: "AI_EXTRACTION_REQUESTED", outcome: "SUCCESS", summary: "Insurance extraction requested" });
    const gateway = createAiGateway();
    const result = await gateway.extractInsuranceDocument({ bytes: Buffer.from(await document.arrayBuffer()), mimeType: document.type, filename: cleanName, correlationId });
    return NextResponse.json({ extraction: result.data, filename: cleanName, mimeType: document.type, sizeBytes: document.size, provider: result.metadata.provider, correlationId });
  } catch {
    recordDemoAudit({ householdId: principal.householdId, actorMemberId: principal.memberId, action: "AI_EXTRACTION_FAILED", outcome: "FAILED", summary: "Insurance extraction failed safely" });
    return NextResponse.json({ error: "Extraction is temporarily unavailable. You can enter this information manually.", correlationId }, { status: 503 });
  }
}
