import Link from "next/link";
import { ArrowRight, CalendarClock, CircleDot, FileCheck2, MessageCircleMore, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { ResourceCard } from "@/components/resource-card";
import { getDemoSnapshot } from "@/modules/demo/demo-store";
import { getCurrentPrincipal } from "@/modules/identity/session";
import { listAuthorizedResources } from "@/modules/resources/service";

export const metadata = { title: "Household" };

export default async function HomePage() {
  const principal = await getCurrentPrincipal();
  const snapshot = getDemoSnapshot();
  const resources = listAuthorizedResources(principal, snapshot);
  const currentMember = snapshot.members.find((member) => member.id === principal.memberId)!;
  const categories = new Set(resources.map((resource) => resource.category)).size;
  const expiring = resources.filter((resource) => resource.expiresAt).sort((a, b) => (a.expiresAt ?? "").localeCompare(b.expiresAt ?? ""));
  const activity = snapshot.auditEvents.slice(0, 3);

  return (
    <>
      <div className="dashboard-intro">
        <div>
          <span className="page-kicker">{snapshot.name}</span>
          <h1>Good morning, {currentMember.displayName.split(" ")[0]}.</h1>
          <p>Your family’s essentials are organized, current, and shared with intention.</p>
        </div>
        <div className="page-actions">
          <Link className="secondary-button" href="/ask"><MessageCircleMore size={17} />Ask Privato</Link>
          <Link className="primary-button" href="/add"><Plus size={17} />Add resource</Link>
        </div>
      </div>

      <section className="preparedness-card">
        <div className="readiness-ring" aria-label="Preparedness score: 86 percent"><span>86</span><small>%</small></div>
        <div className="preparedness-copy">
          <span className="status-badge"><ShieldCheck size={13} /> Well prepared</span>
          <h2>Your household essentials are in good shape.</h2>
          <p>Key contacts, insurance details, and emergency instructions are ready for the people who may need them.</p>
        </div>
        <div className="preparedness-stats">
          <div><strong>{resources.length}</strong><span>resources you can access</span></div>
          <div><strong>{categories}</strong><span>essential categories</span></div>
          <div><strong>{snapshot.members.length}</strong><span>trusted people</span></div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-primary">
          <div className="section-heading"><div><h2>Recently added</h2><p>Your most important information, at a glance.</p></div><Link className="section-link" href="/vault">View vault <ArrowRight size={14} /></Link></div>
          {resources.length ? <div className="resource-grid">{resources.slice(0, 4).map((resource) => <ResourceCard key={resource.id} resource={resource} members={snapshot.members} />)}</div> : <div className="empty-state"><div><FileCheck2 /><h3>No accessible resources yet</h3><p>Your circle membership determines what appears here.</p></div></div>}
        </section>
        <aside className="dashboard-aside">
          <section className="mini-panel circle-summary">
            <div className="mini-panel-heading"><span className="mini-icon"><CircleDot size={17} /></span><div><h2>Your trust circles</h2><p>Access inherits outward.</p></div></div>
            {(["CORE", "INNER", "OUTER"] as const).map((circle) => <div className="circle-row" key={circle}><span className={`circle-dot dot-${circle.toLowerCase()}`} /><span>{circle[0]}{circle.slice(1).toLowerCase()}</span><strong>{snapshot.members.filter((member) => member.circle === circle).length}</strong></div>)}
            <Link className="section-link" href="/circles">Manage circles <ArrowRight size={14} /></Link>
          </section>
          <section className="mini-panel">
            <div className="mini-panel-heading"><span className="mini-icon gold"><CalendarClock size={17} /></span><div><h2>Coming up</h2><p>Documents with expiration dates.</p></div></div>
            {expiring.slice(0, 2).map((resource) => <Link href={`/vault/${resource.id}`} className="expiry-row" key={resource.id}><span><strong>{resource.name}</strong><small>Expires {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(resource.expiresAt!))}</small></span><ArrowRight size={14} /></Link>)}
          </section>
          <section className="mini-panel activity-panel">
            <div className="mini-panel-heading"><span className="mini-icon"><Sparkles size={17} /></span><div><h2>Trusted activity</h2><p>Non-sensitive access history.</p></div></div>
            {activity.map((event) => <div className="activity-row" key={event.id}><span className="activity-dot" /><div><strong>{event.summary}</strong><small>{new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-Math.max(1, Math.round((Date.now() - new Date(event.createdAt).getTime()) / 86_400_000)), "day")}</small></div></div>)}
          </section>
        </aside>
      </div>
    </>
  );
}
