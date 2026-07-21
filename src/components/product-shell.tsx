import type { Member, SessionPrincipal } from "@/modules/core/domain";
import { BrandLockup } from "@/components/brand-lockup";
import { AppNavigation } from "@/components/app-navigation";
import { IdentitySwitcher } from "@/components/identity-switcher";

export function ProductShell({ principal, members, children }: { principal: SessionPrincipal; members: Member[]; children: React.ReactNode }) {
  return (
    <div className="product-shell">
      <aside className="sidebar">
        <BrandLockup />
        <AppNavigation />
        <div className="sidebar-trust">
          <span className="trust-glyph" aria-hidden="true">✓</span>
          <div><strong>Protected by circles</strong><span>Access is recalculated on every request.</span></div>
        </div>
      </aside>
      <div className="product-main">
        <header className="topbar">
          <div className="mobile-brand"><BrandLockup compact /></div>
          {principal.memberId !== "member_alex" && <div className="viewing-banner">Preview mode</div>}
          <IdentitySwitcher principal={principal} members={members} />
        </header>
        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}
