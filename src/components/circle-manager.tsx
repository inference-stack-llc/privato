"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, LockKeyhole, ShieldCheck, X } from "lucide-react";
import type { CircleType, Member, Resource } from "@/modules/core/domain";
import { canAccessResource } from "@/modules/authorization/policy";
import { MemberAvatar } from "@/components/member-avatar";

const circleCopy: Record<CircleType, { description: string; access: string }> = {
  CORE: { description: "The people you trust with your most sensitive shared information.", access: "Core, Inner & Outer resources" },
  INNER: { description: "Close family with access to practical household details.", access: "Inner & Outer resources" },
  OUTER: { description: "Trusted friends who can see essential emergency information.", access: "Outer resources only" },
};

function accessibleIds(member: Member, resources: Resource[]): Set<string> {
  return new Set(resources.filter((resource) => canAccessResource({ householdId: member.householdId, memberId: member.id, circle: member.circle }, resource)).map((resource) => resource.id));
}

export function CircleManager({
  initialMembers,
  resources,
  actorMemberId,
  canManage,
}: {
  initialMembers: Member[];
  resources: Resource[];
  actorMemberId: string;
  canManage: boolean;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [selected, setSelected] = useState<Member>();
  const [target, setTarget] = useState<CircleType>("INNER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const router = useRouter();

  const preview = useMemo(() => {
    if (!selected) return { gained: [], lost: [] };
    const oldIds = accessibleIds(selected, resources);
    const proposed = { ...selected, circle: target };
    const newIds = accessibleIds(proposed, resources);
    return {
      gained: resources.filter((resource) => newIds.has(resource.id) && !oldIds.has(resource.id)),
      lost: resources.filter((resource) => oldIds.has(resource.id) && !newIds.has(resource.id)),
    };
  }, [resources, selected, target]);

  function beginMove(member: Member) {
    if (!canManage) return;
    setSelected(member);
    setTarget(member.circle === "OUTER" ? "INNER" : member.circle === "INNER" ? "CORE" : "INNER");
    setError(undefined);
  }

  async function confirmMove() {
    if (!selected || selected.circle === target) return;
    setPending(true);
    setError(undefined);
    const response = await fetch("/api/circles/move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ memberId: selected.id, circle: target }),
    });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) {
      setError(payload?.error ?? "The circle change could not be saved. Try again.");
      setPending(false);
      return;
    }
    setMembers((current) => current.map((member) => member.id === selected.id ? { ...member, circle: target } : member));
    window.localStorage.setItem("privato:session-revision", Date.now().toString());
    setSuccess(`${selected.displayName} is now in the ${target[0]}${target.slice(1).toLowerCase()} Circle.`);
    setSelected(undefined);
    setPending(false);
    router.refresh();
    setTimeout(() => setSuccess(undefined), 5000);
  }

  return (
    <>
      {success && <div className="toast" role="status"><Check size={16} />{success}<button type="button" aria-label="Dismiss message" onClick={() => setSuccess(undefined)}><X size={14} /></button></div>}
      {!canManage && (
        <div className="circle-management-notice" role="status">
          <LockKeyhole size={18} />
          <div>
            <strong>Circle changes require a Core identity.</strong>
            <span>Use “Viewing as” to switch back to Alex or Maya, then move Sam.</span>
          </div>
        </div>
      )}
      <div className="circles-layout">
        <section className="circle-visual-panel surface-card" aria-labelledby="trust-map-title">
          <div className="circle-panel-heading"><div><span className="page-kicker">Trust map</span><h2 id="trust-map-title">Closer means more trusted.</h2></div><span className="inheritance-pill"><ShieldCheck size={14} /> Access inherits outward</span></div>
          <div className="trust-map" aria-hidden="true">
            <div className="trust-orbit trust-outer">
              <span className="orbit-label">Outer</span>
              <div className="orbit-people outer-people">{members.filter((member) => member.circle === "OUTER").map((member) => <div className="orbit-person" key={member.id}><MemberAvatar member={member} size="sm" /><small>{member.displayName.split(" ")[0]}</small></div>)}</div>
              <div className="trust-orbit trust-inner">
                <span className="orbit-label">Inner</span>
                <div className="orbit-people inner-people">{members.filter((member) => member.circle === "INNER").map((member) => <div className="orbit-person" key={member.id}><MemberAvatar member={member} size="sm" /><small>{member.displayName.split(" ")[0]}</small></div>)}</div>
                <div className="trust-orbit trust-core">
                  <span className="orbit-label core-label">Core</span>
                  <div className="orbit-people core-people">{members.filter((member) => member.circle === "CORE").map((member) => <div className="orbit-person" key={member.id}><MemberAvatar member={member} size="sm" /><small>{member.displayName.split(" ")[0]}</small></div>)}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="trust-rule"><LockKeyhole size={16} /><p><strong>Private is different.</strong> Private resources remain visible only to their owner, regardless of circle.</p></div>
        </section>

        <section className="circle-lists" aria-label="Accessible circle membership list">
          {(["CORE", "INNER", "OUTER"] as const).map((circle) => (
            <article className="circle-list-card surface-card" key={circle}>
              <div className="circle-list-title"><span className={`circle-number circle-number-${circle.toLowerCase()}`}>{circle === "CORE" ? "01" : circle === "INNER" ? "02" : "03"}</span><div><h2>{circle[0]}{circle.slice(1).toLowerCase()} Circle</h2><p>{circleCopy[circle].description}</p></div></div>
              <div className="circle-access-line"><Check size={13} /><span>{circleCopy[circle].access}</span></div>
              <div className="circle-members-list">
                {members.filter((member) => member.circle === circle).map((member) => (
                  <div className="circle-member" key={member.id}>
                    <MemberAvatar member={member} />
                    <span><strong>{member.displayName}</strong><small>{member.relationshipLabel}{member.id === actorMemberId ? " · Current view" : ""}</small></span>
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => beginMove(member)}
                      aria-label={canManage ? `Move ${member.displayName} to another circle` : `Switch to a Core identity to move ${member.displayName}`}
                    >Move <ChevronRight size={14} /></button>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>

      {selected && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(undefined); }}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="move-title">
            <button className="dialog-close" type="button" aria-label="Close dialog" onClick={() => setSelected(undefined)}><X size={18} /></button>
            <div className="dialog-icon"><MemberAvatar member={selected} size="lg" /></div>
            <span className="page-kicker">Preview access change</span>
            <h2 id="move-title">Move {selected.displayName}?</h2>
            <p className="dialog-lead">See the exact impact before the new circle takes effect.</p>
            <label className="field-label" htmlFor="target-circle">New trust circle</label>
            <select id="target-circle" className="field-control" value={target} onChange={(event) => setTarget(event.target.value as CircleType)}>
              {(["CORE", "INNER", "OUTER"] as const).map((circle) => <option key={circle} value={circle} disabled={circle === selected.circle}>{circle[0]}{circle.slice(1).toLowerCase()} Circle{circle === selected.circle ? " (current)" : ""}</option>)}
            </select>
            <div className="access-diff">
              {preview.gained.length > 0 && <div className="diff-group diff-gain"><span><ArrowUpRight size={15} /> Gains access to</span>{preview.gained.map((resource) => <strong key={resource.id}>{resource.name}</strong>)}</div>}
              {preview.lost.length > 0 && <div className="diff-group diff-loss"><span><ArrowDownRight size={15} /> Loses access to</span>{preview.lost.map((resource) => <strong key={resource.id}>{resource.name}</strong>)}</div>}
              {preview.gained.length === 0 && preview.lost.length === 0 && <p className="no-diff">This move does not change access to the current resources.</p>}
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => setSelected(undefined)}>Cancel</button><button type="button" className="primary-button" disabled={pending || selected.circle === target} onClick={confirmMove}>{pending ? "Updating…" : "Confirm move"}</button></div>
          </div>
        </div>
      )}
    </>
  );
}
