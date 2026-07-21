import { randomUUID } from "node:crypto";
import type { AiRunRecord, AuditEvent, CircleType, HouseholdSnapshot, Resource } from "@/modules/core/domain";
import { demoAuditEvents, demoMembers, demoResources, DEMO_HOUSEHOLD_ID } from "@/modules/demo/seed";

type DemoState = HouseholdSnapshot;

declare global {
  var __privatoDemoState: DemoState | undefined;
}

function freshState(): DemoState {
  return {
    id: DEMO_HOUSEHOLD_ID,
    name: "The Morgan Household",
    members: structuredClone(demoMembers),
    resources: structuredClone(demoResources),
    auditEvents: structuredClone(demoAuditEvents),
    aiRuns: [],
  };
}

function state(): DemoState {
  globalThis.__privatoDemoState ??= freshState();
  return globalThis.__privatoDemoState;
}

export function getDemoSnapshot(): HouseholdSnapshot {
  return structuredClone(state());
}

export function findDemoResource(id: string): Resource | undefined {
  const resource = state().resources.find((item) => item.id === id);
  return resource ? structuredClone(resource) : undefined;
}

export function moveDemoMember(actorMemberId: string, memberId: string, circle: CircleType): void {
  const member = state().members.find((item) => item.id === memberId);
  if (!member) throw new Error("Member not found.");
  const previous = member.circle;
  member.circle = circle;
  state().auditEvents.unshift({
    id: randomUUID(),
    householdId: DEMO_HOUSEHOLD_ID,
    actorMemberId,
    action: "MEMBER_MOVED",
    outcome: "SUCCESS",
    summary: `${member.displayName} moved from ${previous.toLowerCase()} to ${circle.toLowerCase()}`,
    createdAt: new Date().toISOString(),
  });
}

export function addDemoResource(resource: Resource, actorMemberId: string): void {
  state().resources.unshift(structuredClone(resource));
  state().auditEvents.unshift({
    id: randomUUID(),
    householdId: resource.householdId,
    actorMemberId,
    resourceId: resource.id,
    action: "AI_EXTRACTION_APPROVED",
    outcome: "SUCCESS",
    summary: `${resource.name} was reviewed and added`,
    createdAt: new Date().toISOString(),
  });
}

export function recordDemoAudit(event: Omit<AuditEvent, "id" | "createdAt">): void {
  state().auditEvents.unshift({ ...event, id: randomUUID(), createdAt: new Date().toISOString() });
}

export function recordDemoAiRun(run: Omit<AiRunRecord, "id" | "createdAt">): void {
  const snapshot = state();
  snapshot.aiRuns ??= [];
  snapshot.aiRuns.unshift({ ...run, id: randomUUID(), createdAt: new Date().toISOString() });
}

export function resetDemoStore(): void {
  globalThis.__privatoDemoState = freshState();
}
