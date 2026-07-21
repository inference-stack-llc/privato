"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Member, SessionPrincipal } from "@/modules/core/domain";
import { MemberAvatar } from "@/components/member-avatar";

export function IdentitySwitcher({ principal, members }: { principal: SessionPrincipal; members: Member[] }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string>();
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const active = members.find((member) => member.id === principal.memberId) ?? members[0];

  async function switchIdentity(memberId: string) {
    setPending(memberId);
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (response.ok) {
      setOpen(false);
      router.refresh();
    }
    setPending(undefined);
  }

  return (
    <div className="identity-switcher" ref={container}>
      <button className="identity-trigger" type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <MemberAvatar member={active} size="sm" />
        <span className="identity-trigger-copy">
          <span>Viewing as</span>
          <strong>{active.displayName}</strong>
        </span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <>
          <button className="popover-scrim" aria-label="Close identity menu" onClick={() => setOpen(false)} />
          <div className="identity-menu" role="menu" aria-label="Preview household identity">
            <div className="identity-menu-heading">
              <strong>Preview an identity</strong>
              <span>See exactly what each person can access.</span>
            </div>
            {members.map((member) => (
              <button key={member.id} role="menuitem" type="button" className="identity-option" disabled={pending !== undefined} onClick={() => switchIdentity(member.id)}>
                <MemberAvatar member={member} size="sm" />
                <span><strong>{member.displayName}</strong><small>{member.relationshipLabel} · {member.circle.toLowerCase()}</small></span>
                {member.id === principal.memberId && <Check size={16} aria-label="Current identity" />}
              </button>
            ))}
            <p className="demo-disclaimer">Demo preview only — not production authentication.</p>
          </div>
        </>
      )}
    </div>
  );
}
