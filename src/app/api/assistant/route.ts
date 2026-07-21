import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAskAiGateway } from "@/modules/ai/gateway";
import { askQuestionSchema } from "@/modules/ai/schemas";
import { DemoResourceEncryptionAdapter } from "@/modules/assistant/evidence";
import { DemoAiRunRepository, DemoAuditEventAdapter } from "@/modules/assistant/observability";
import { AuthorizedStructuredLexicalRetriever } from "@/modules/assistant/retrieval";
import { AskPrivatoService } from "@/modules/assistant/service";
import { ASK_VALIDATION_MESSAGE } from "@/modules/assistant/types";
import { getDemoSnapshot } from "@/modules/demo/demo-store";
import { getCurrentPrincipal } from "@/modules/identity/session";
import { DemoAuthorizedResourceRepository } from "@/modules/resources/authorized-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Vary: "Cookie",
};

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
}

function isSameOriginJson(request: Request): boolean {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return false;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin";
}

export async function POST(request: Request) {
  if (!isSameOriginJson(request)) return privateJson({ error: "This request is not available." }, 403);

  const principal = await getCurrentPrincipal();
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 4_096) {
    return privateJson({ error: ASK_VALIDATION_MESSAGE }, 400);
  }
  const rawBody = await request.text();
  if (rawBody.length > 4_096) return privateJson({ error: ASK_VALIDATION_MESSAGE }, 400);
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }
  const parsed = askQuestionSchema.safeParse(body);
  if (!parsed.success) return privateJson({ error: ASK_VALIDATION_MESSAGE }, 400);

  const correlationId = randomUUID();
  const repository = new DemoAuthorizedResourceRepository(getDemoSnapshot);
  const gateway = createAskAiGateway();
  const service = new AskPrivatoService({
    repository,
    retriever: new AuthorizedStructuredLexicalRetriever(repository),
    encryption: new DemoResourceEncryptionAdapter(),
    gateway,
    aiRuns: new DemoAiRunRepository(),
    audit: new DemoAuditEventAdapter(),
    configuredModel: gateway ? (process.env.OPENAI_MODEL ?? "gpt-4.1-mini") : undefined,
  });

  const result = await service.execute({
    principal,
    question: parsed.data.question,
    correlationId,
  });
  return privateJson(result, result.status === "unavailable" ? 503 : 200);
}
