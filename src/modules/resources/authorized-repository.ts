import type { HouseholdSnapshot, Resource, SessionPrincipal } from "@/modules/core/domain";
import type {
  AuthorizedResourceRepositoryPort,
  AuthorizedResourceSearchRecord,
} from "@/modules/assistant/types";
import { canAccessResource } from "@/modules/authorization/policy";

function currentPrincipal(
  snapshot: HouseholdSnapshot,
  principal: SessionPrincipal,
): SessionPrincipal | undefined {
  if (snapshot.id !== principal.householdId) return undefined;
  const member = snapshot.members.find((item) => (
    item.id === principal.memberId && item.householdId === principal.householdId
  ));
  if (!member) return undefined;
  return { ...principal, displayName: member.displayName, circle: member.circle };
}

/**
 * Infrastructure-independent authorized repository for the active synthetic demo.
 * Every method takes a fresh snapshot so circle changes take effect on the next request.
 */
export class DemoAuthorizedResourceRepository implements AuthorizedResourceRepositoryPort {
  constructor(private readonly snapshotProvider: () => HouseholdSnapshot) {}

  async listAuthorizedResourceIds(principal: SessionPrincipal): Promise<string[]> {
    const snapshot = this.snapshotProvider();
    const effectivePrincipal = currentPrincipal(snapshot, principal);
    if (!effectivePrincipal) return [];
    return snapshot.resources
      .filter((resource) => canAccessResource(effectivePrincipal, resource))
      .map((resource) => resource.id);
  }

  async listAuthorizedSearchRecords(
    principal: SessionPrincipal,
    authorizedResourceIds: readonly string[],
  ): Promise<AuthorizedResourceSearchRecord[]> {
    const snapshot = this.snapshotProvider();
    const effectivePrincipal = currentPrincipal(snapshot, principal);
    if (!effectivePrincipal) return [];
    const authorizedIds = new Set(authorizedResourceIds);

    return snapshot.resources.flatMap((resource) => {
      if (!authorizedIds.has(resource.id) || !canAccessResource(effectivePrincipal, resource)) return [];
      const owner = snapshot.members.find((member) => member.id === resource.ownerMemberId);
      if (!owner || owner.householdId !== principal.householdId) return [];
      return [{
        resourcePublicId: resource.id,
        householdId: resource.householdId,
        ownerMemberId: resource.ownerMemberId,
        ownerDisplayName: owner.displayName,
        name: resource.name,
        category: resource.category,
        description: resource.description,
        visibility: resource.visibility,
        fieldLabels: resource.fields.map((field) => field.label),
        expiresAt: resource.expiresAt,
      }];
    });
  }

  async findAuthorizedByPublicId(
    principal: SessionPrincipal,
    resourcePublicId: string,
  ): Promise<Resource | undefined> {
    const snapshot = this.snapshotProvider();
    const effectivePrincipal = currentPrincipal(snapshot, principal);
    if (!effectivePrincipal) return undefined;
    const resource = snapshot.resources.find((item) => item.id === resourcePublicId);
    if (!resource || !canAccessResource(effectivePrincipal, resource)) return undefined;
    return structuredClone(resource);
  }
}
