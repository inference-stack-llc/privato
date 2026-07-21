import { ProductShell } from "@/components/product-shell";
import { getDemoSnapshot } from "@/modules/demo/demo-store";
import { getCurrentPrincipal } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const [principal, snapshot] = await Promise.all([getCurrentPrincipal(), Promise.resolve(getDemoSnapshot())]);
  return <ProductShell principal={principal} members={snapshot.members}>{children}</ProductShell>;
}
