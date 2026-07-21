import { describe, expect, it } from "vitest";
import {
  applyDemoCircleOverrides,
  decodeDemoCircleOverrides,
  encodeDemoCircleOverrides,
} from "@/modules/identity/demo-session-state";
import { demoMembers, demoResources, DEMO_HOUSEHOLD_ID } from "@/modules/demo/seed";

function snapshot() {
  return {
    id: DEMO_HOUSEHOLD_ID,
    name: "The Morgan Household",
    members: structuredClone(demoMembers),
    resources: structuredClone(demoResources),
    auditEvents: [],
  };
}

describe("demo session circle state", () => {
  it("round trips validated circle overrides", () => {
    const encoded = encodeDemoCircleOverrides({ member_sam: "INNER" });
    expect(decodeDemoCircleOverrides(encoded)).toEqual({ member_sam: "INNER" });
  });

  it("rejects malformed or unsupported cookie state", () => {
    expect(decodeDemoCircleOverrides("not-base64-json")).toEqual({});
    const invalid = Buffer.from(JSON.stringify({ member_sam: "ADMIN" }), "utf8").toString("base64url");
    expect(decodeDemoCircleOverrides(invalid)).toEqual({});
  });

  it("applies membership changes to one session without mutating the seed", () => {
    const base = snapshot();
    const changed = applyDemoCircleOverrides(base, { member_sam: "INNER" });

    expect(changed.members.find((member) => member.id === "member_sam")?.circle).toBe("INNER");
    expect(base.members.find((member) => member.id === "member_sam")?.circle).toBe("OUTER");
    expect(applyDemoCircleOverrides(base, {}).members.find((member) => member.id === "member_sam")?.circle).toBe("OUTER");
  });
});
