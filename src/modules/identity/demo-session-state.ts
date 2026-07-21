import { z } from "zod";
import { circleTypes, type CircleType, type HouseholdSnapshot } from "@/modules/core/domain";

const circleOverridesSchema = z.record(
  z.string().min(1).max(80),
  z.enum(circleTypes),
);

export type DemoCircleOverrides = Record<string, CircleType>;

export function decodeDemoCircleOverrides(value?: string): DemoCircleOverrides {
  if (!value) return {};
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const parsed = circleOverridesSchema.safeParse(decoded);
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function encodeDemoCircleOverrides(overrides: DemoCircleOverrides): string {
  return Buffer.from(JSON.stringify(circleOverridesSchema.parse(overrides)), "utf8").toString("base64url");
}

export function applyDemoCircleOverrides(
  snapshot: HouseholdSnapshot,
  overrides: DemoCircleOverrides,
): HouseholdSnapshot {
  return {
    ...snapshot,
    members: snapshot.members.map((member) => (
      overrides[member.id] ? { ...member, circle: overrides[member.id] } : member
    )),
  };
}
