import type { Member, SessionPrincipal } from "@/modules/core/domain";

export interface IdentityProviderPort {
  resolve(candidateMemberId?: string): SessionPrincipal;
}

export class DemoIdentityProvider implements IdentityProviderPort {
  constructor(
    private readonly members: Member[],
    private readonly defaultMemberId: string,
  ) {}

  resolve(candidateMemberId?: string): SessionPrincipal {
    const member =
      this.members.find((item) => item.id === candidateMemberId) ??
      this.members.find((item) => item.id === this.defaultMemberId);
    if (!member) throw new Error("The demo identity configuration is invalid.");
    return {
      householdId: member.householdId,
      memberId: member.id,
      displayName: member.displayName,
      circle: member.circle,
      isDemo: true,
    };
  }
}
