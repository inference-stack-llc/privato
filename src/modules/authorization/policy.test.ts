import { describe, expect, it } from "vitest";
import { canAccessResource } from "@/modules/authorization/policy";
import type { CircleType, Resource, SessionPrincipal, Visibility } from "@/modules/core/domain";

const baseResource = { householdId: "household", ownerMemberId: "owner" } satisfies Pick<Resource, "householdId" | "ownerMemberId">;

function principal(circle: CircleType, memberId = "viewer"): SessionPrincipal {
  return { householdId: "household", memberId, displayName: "Viewer", circle, isDemo: true };
}

describe("circle authorization matrix", () => {
  const cases: Array<[CircleType, Visibility, boolean]> = [
    ["CORE", "CORE", true], ["CORE", "INNER", true], ["CORE", "OUTER", true],
    ["INNER", "CORE", false], ["INNER", "INNER", true], ["INNER", "OUTER", true],
    ["OUTER", "CORE", false], ["OUTER", "INNER", false], ["OUTER", "OUTER", true],
  ];

  it.each(cases)("allows %s member to access %s resource: %s", (circle, visibility, expected) => {
    expect(canAccessResource(principal(circle), { ...baseResource, visibility })).toBe(expected);
  });

  it("always allows an owner", () => {
    expect(canAccessResource(principal("OUTER", "owner"), { ...baseResource, visibility: "PRIVATE" })).toBe(true);
  });

  it.each<CircleType>(["CORE", "INNER", "OUTER"])("denies a non-owner %s member access to private resources", (circle) => {
    expect(canAccessResource(principal(circle), { ...baseResource, visibility: "PRIVATE" })).toBe(false);
  });

  it("denies cross-household access before considering rank", () => {
    expect(canAccessResource({ ...principal("CORE"), householdId: "another" }, { ...baseResource, visibility: "OUTER" })).toBe(false);
  });
});
