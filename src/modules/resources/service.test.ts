import { describe, expect, it, vi } from "vitest";
import { demoResources } from "@/modules/demo/seed";
import { getAuthorizedResource } from "@/modules/resources/service";
import type { SessionPrincipal } from "@/modules/core/domain";

describe("authorized resource lookup", () => {
  const sam: SessionPrincipal = { householdId: "hh_morgan", memberId: "member_sam", displayName: "Sam Rivera", circle: "OUTER", isDemo: true };

  it("cannot bypass authorization to reach the sensitive read boundary", () => {
    const privateResource = demoResources.find((resource) => resource.visibility === "PRIVATE")!;
    const decrypt = vi.fn(() => privateResource.fields);
    expect(() => getAuthorizedResource(sam, privateResource, decrypt)).toThrow("not available");
    expect(decrypt).not.toHaveBeenCalled();
  });

  it("reads after authorization succeeds", () => {
    const outerResource = demoResources.find((resource) => resource.visibility === "OUTER")!;
    const decrypt = vi.fn(() => outerResource.fields);
    expect(getAuthorizedResource(sam, outerResource, decrypt)).toEqual(outerResource.fields);
    expect(decrypt).toHaveBeenCalledOnce();
  });
});
