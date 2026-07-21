import { describe, expect, it } from "vitest";
import { demoResources } from "@/modules/demo/seed";

describe("demo resource seed", () => {
  it("retains revealable values for every masked field", () => {
    const maskedFields = demoResources.flatMap((resource) => resource.fields.filter((field) => field.mask));

    expect(maskedFields.length).toBeGreaterThan(0);
    expect(maskedFields.every((field) => !field.value.includes("•"))).toBe(true);
  });
});
