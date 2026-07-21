import { AskPrivato } from "@/components/ask-privato";
import { getDemoSnapshot } from "@/modules/demo/demo-store";
import { getCurrentPrincipal } from "@/modules/identity/session";
import { listAuthorizedResources } from "@/modules/resources/service";

export const metadata = { title: "Ask Privato" };

export default async function AskPage() {
  const principal = await getCurrentPrincipal();
  const snapshot = getDemoSnapshot();
  const resources = listAuthorizedResources(principal, snapshot);
  return (
    <>
      <header className="page-heading"><div className="page-heading-copy"><span className="page-kicker">Permission-aware answers</span><h1>Ask the information you trust.</h1><p>A focused assistant for real household questions—grounded only in resources available to your current identity.</p></div></header>
      <AskPrivato
        key={principal.memberId}
        principalId={principal.memberId}
        identityName={principal.displayName}
        circle={principal.circle}
        accessibleCount={resources.length}
      />
    </>
  );
}
