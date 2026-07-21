import type { Member, Resource, SessionPrincipal, Visibility } from "@/modules/core/domain";

export const trustRank: Record<Visibility, number> = {
  PRIVATE: 0,
  CORE: 1,
  INNER: 2,
  OUTER: 3,
};

/** The only resource authorization rule in Privato. Lower ranks are more trusted. */
export function canAccessResource(
  principal: Pick<SessionPrincipal, "householdId" | "memberId" | "circle">,
  resource: Pick<Resource, "householdId" | "ownerMemberId" | "visibility">,
): boolean {
  if (principal.householdId !== resource.householdId) return false;
  if (principal.memberId === resource.ownerMemberId) return true;
  if (resource.visibility === "PRIVATE") return false;
  return trustRank[principal.circle] <= trustRank[resource.visibility];
}

export function effectiveAudience(resource: Resource, members: Member[]): Member[] {
  return members.filter((member) =>
    canAccessResource(
      {
        householdId: member.householdId,
        memberId: member.id,
        circle: member.circle,
      },
      resource,
    ),
  );
}

export class AuthorizationError extends Error {
  constructor() {
    super("The requested resource is not available.");
    this.name = "AuthorizationError";
  }
}

export function assertResourceAccess(
  principal: Pick<SessionPrincipal, "householdId" | "memberId" | "circle">,
  resource: Resource,
): void {
  if (!canAccessResource(principal, resource)) throw new AuthorizationError();
}
