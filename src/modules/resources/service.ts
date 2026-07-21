import type { HouseholdSnapshot, Resource, SessionPrincipal } from "@/modules/core/domain";
import { assertResourceAccess, canAccessResource } from "@/modules/authorization/policy";

export function listAuthorizedResources(
  principal: SessionPrincipal,
  snapshot: HouseholdSnapshot,
): Resource[] {
  return snapshot.resources.filter((resource) => canAccessResource(principal, resource));
}

export function getAuthorizedResource<T>(
  principal: SessionPrincipal,
  resource: Resource,
  readSensitivePayload: (authorizedResource: Resource) => T,
): T {
  assertResourceAccess(principal, resource);
  return readSensitivePayload(resource);
}
