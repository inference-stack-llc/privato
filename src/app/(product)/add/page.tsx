import { AddResourceFlow } from "@/components/add-resource-flow";
import { getCurrentSessionContext } from "@/modules/identity/session";

export const metadata = { title: "Add a resource" };

export default async function AddResourcePage() {
  const { principal, snapshot } = await getCurrentSessionContext();
  return (
    <>
      <header className="page-heading"><div className="page-heading-copy"><span className="page-kicker">Add to your network</span><h1>What would you like to protect?</h1><p>Upload an insurance card for assisted extraction, or enter information yourself.</p></div></header>
      <AddResourceFlow members={snapshot.members} principalMemberId={principal.memberId} />
    </>
  );
}
