import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, FileLock2, History, Paperclip, ShieldCheck, UserRound, Users } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { MemberAvatar } from "@/components/member-avatar";
import { SensitiveValue } from "@/components/sensitive-value";
import { categoryLabels, visibilityLabels } from "@/modules/core/domain";
import { canAccessResource, effectiveAudience } from "@/modules/authorization/policy";
import { recordDemoAudit } from "@/modules/demo/demo-store";
import { getCurrentSessionContext } from "@/modules/identity/session";
import { getAuthorizedResource } from "@/modules/resources/service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ resourceId: string }> }) {
  const { resourceId } = await params;
  const { principal, snapshot } = await getCurrentSessionContext();
  const resource = snapshot.resources.find((item) => item.id === resourceId);
  return { title: resource && canAccessResource(principal, resource) ? resource.name : "Resource unavailable" };
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ resourceId: string }> }) {
  const { resourceId } = await params;
  const { principal, snapshot } = await getCurrentSessionContext();
  const candidate = snapshot.resources.find((item) => item.id === resourceId);
  if (!candidate) notFound();
  let resource;
  try {
    resource = getAuthorizedResource(principal, candidate, (authorized) => authorized);
  } catch {
    notFound();
  }
  const owner = snapshot.members.find((member) => member.id === resource.ownerMemberId)!;
  const audience = effectiveAudience(resource, snapshot.members);
  const audits = snapshot.auditEvents.filter((event) => event.resourceId === resource.id).slice(0, 5);
  recordDemoAudit({ householdId: principal.householdId, actorMemberId: principal.memberId, resourceId: resource.id, action: "RESOURCE_VIEWED", outcome: "SUCCESS", summary: `${principal.displayName} viewed ${resource.name}` });

  return (
    <>
      <Link className="back-link" href="/vault"><ArrowLeft size={15} />Back to vault</Link>
      <header className="resource-detail-heading">
        <div className="resource-title-mark"><CategoryIcon category={resource.category} size={25} /></div>
        <div><span className="page-kicker">{categoryLabels[resource.category]}</span><h1>{resource.name}</h1><p>{resource.description}</p></div>
        <span className={`visibility-badge visibility-${resource.visibility}`}><ShieldCheck size={12} />{visibilityLabels[resource.visibility]}</span>
      </header>
      <div className="resource-detail-grid">
        <div className="resource-detail-main">
          <section className="detail-section surface-card">
            <div className="detail-section-heading"><div><h2>Essential information</h2><p>Sensitive values are masked until you choose to reveal them.</p></div><FileLock2 size={19} /></div>
            <dl className="field-list">{resource.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd><SensitiveValue value={field.value} masked={field.mask} /></dd></div>)}</dl>
          </section>
          {resource.document && <section className="detail-section surface-card"><div className="document-row"><span className="document-icon"><Paperclip size={19} /></span><div><h2>Attached document</h2><strong>{resource.document.filename}</strong><small>{resource.document.mimeType} · {(resource.document.sizeBytes / 1024).toFixed(0)} KB · encrypted storage metadata</small></div><span className="status-badge"><ShieldCheck size={12} /> Protected</span></div><p className="prototype-note">Document preview and download are disabled in the infrastructure-free demo. The storage port requires authorization before decryption.</p></section>}
          <section className="detail-section surface-card">
            <div className="detail-section-heading"><div><h2>Audit history</h2><p>Meaningful access without sensitive payloads.</p></div><History size={19} /></div>
            <div className="audit-list">{audits.length ? audits.map((event) => <div key={event.id}><span className="audit-symbol"><History size={13} /></span><div><strong>{event.summary}</strong><small>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.createdAt))}</small></div><span>{event.outcome.toLowerCase()}</span></div>) : <p>No prior activity for this resource.</p>}</div>
          </section>
        </div>
        <aside className="resource-detail-aside">
          <section className="detail-side-card surface-card"><div className="detail-side-title"><Users size={17} /><h2>Who can access this?</h2></div><p>Calculated from current circle membership.</p><div className="audience-list">{audience.map((member) => <div key={member.id}><MemberAvatar member={member} size="sm" /><span><strong>{member.displayName}</strong><small>{member.id === resource.ownerMemberId ? "Owner" : `${member.circle[0]}${member.circle.slice(1).toLowerCase()} Circle`}</small></span></div>)}</div></section>
          <section className="detail-side-card surface-card"><div className="detail-side-title"><UserRound size={17} /><h2>Resource details</h2></div><dl className="meta-list"><div><dt>Owner</dt><dd>{owner.displayName}</dd></div><div><dt>Visibility</dt><dd>{visibilityLabels[resource.visibility]}</dd></div>{resource.expiresAt && <div><dt>Expires</dt><dd><CalendarClock size={13} />{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(resource.expiresAt))}</dd></div>}<div><dt>Updated</dt><dd>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(resource.updatedAt))}</dd></div></dl></section>
        </aside>
      </div>
    </>
  );
}
