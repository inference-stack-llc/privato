import { ProductShell } from "@/components/product-shell";
import { getCurrentSessionContext } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const { principal, snapshot } = await getCurrentSessionContext();
  return <ProductShell principal={principal} members={snapshot.members}>{children}</ProductShell>;
}
