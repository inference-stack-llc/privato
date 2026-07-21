import { CircleManager } from "@/components/circle-manager";
import { getCurrentSessionContext } from "@/modules/identity/session";

export const metadata = { title: "Trust circles" };

export default async function CirclesPage() {
  const { principal, snapshot } = await getCurrentSessionContext();
  return (
    <>
      <header className="page-heading"><div className="page-heading-copy"><span className="page-kicker">Relationship-aware access</span><h1>Your circles of trust.</h1><p>Organize people by relationship. Moving someone immediately recalculates the information they can access—everywhere in Privato.</p></div></header>
      <CircleManager
        initialMembers={snapshot.members}
        resources={snapshot.resources}
        actorMemberId={principal.memberId}
        canManage={principal.circle === "CORE"}
      />
    </>
  );
}
