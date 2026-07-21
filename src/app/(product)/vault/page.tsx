import Link from "next/link";
import { Plus } from "lucide-react";
import { VaultBrowser } from "@/components/vault-browser";
import { getDemoSnapshot } from "@/modules/demo/demo-store";
import { getCurrentPrincipal } from "@/modules/identity/session";
import { listAuthorizedResources } from "@/modules/resources/service";

export const metadata = { title: "Resource vault" };

export default async function VaultPage() {
  const principal = await getCurrentPrincipal();
  const snapshot = getDemoSnapshot();
  const resources = listAuthorizedResources(principal, snapshot);
  return (
    <>
      <header className="page-heading">
        <div className="page-heading-copy"><span className="page-kicker">Your information network</span><h1>The family vault.</h1><p>Only information available to {principal.displayName.split(" ")[0]} appears here. Every result is filtered before it reaches this page.</p></div>
        <div className="page-actions"><Link className="primary-button" href="/add"><Plus size={17} />Add resource</Link></div>
      </header>
      <VaultBrowser resources={resources} members={snapshot.members} />
    </>
  );
}
