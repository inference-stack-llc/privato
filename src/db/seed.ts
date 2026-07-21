import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { createDatabase } from "@/db/client";
import { circleMemberships, circles, households, members, resources } from "@/db/schema";
import { demoMembers, demoResources } from "@/modules/demo/seed";
import { encryptPayload, masterKeyFromEnvironment } from "@/modules/encryption/crypto";

function stableUuid(value: string): string {
  const hex = createHash("sha256").update(value).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}

async function seed() {
  const { db, client } = createDatabase();
  const householdId = stableUuid("morgan-household");
  await db.insert(households).values({ id: householdId, name: "The Morgan Household" }).onConflictDoNothing();

  const circleRows = (["CORE", "INNER", "OUTER"] as const).map((type, index) => ({
    id: stableUuid(`circle-${type}`), householdId, type, name: `${type[0]}${type.slice(1).toLowerCase()} Circle`, rank: index + 1,
  }));
  await db.insert(circles).values(circleRows).onConflictDoNothing();

  for (const member of demoMembers) {
    const memberId = stableUuid(member.id);
    await db.insert(members).values({ id: memberId, householdId, displayName: member.displayName, initials: member.initials, relationshipLabel: member.relationshipLabel, avatarSeed: member.avatarTone }).onConflictDoNothing();
    await db.insert(circleMemberships).values({ id: stableUuid(`membership-${member.id}`), householdId, memberId, circleId: stableUuid(`circle-${member.circle}`) }).onConflictDoNothing();
  }

  const key = masterKeyFromEnvironment();
  for (const resource of demoResources) {
    await db.insert(resources).values({
      id: stableUuid(resource.id), publicId: resource.id, householdId,
      ownerMemberId: stableUuid(resource.ownerMemberId), name: resource.name,
      category: resource.category, description: resource.description,
      visibility: resource.visibility, encryptedPayload: encryptPayload(resource.fields, key),
      expiresAt: resource.expiresAt ? new Date(resource.expiresAt) : null,
    }).onConflictDoUpdate({ target: resources.publicId, set: { name: resource.name, updatedAt: new Date() } });
  }
  const count = await db.select({ id: households.id }).from(households).where(eq(households.id, householdId));
  console.log(`Seeded ${count.length} Privato demo household.`);
  await client.end();
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database seed failed.");
  process.exitCode = 1;
});
