import Link from "next/link";
import { CalendarClock, Users } from "lucide-react";
import type { Member, Resource } from "@/modules/core/domain";
import { categoryLabels, visibilityLabels } from "@/modules/core/domain";
import { CategoryIcon } from "@/components/category-icon";
import { effectiveAudience } from "@/modules/authorization/policy";

export function ResourceCard({ resource, members }: { resource: Resource; members: Member[] }) {
  const owner = members.find((member) => member.id === resource.ownerMemberId);
  const audience = effectiveAudience(resource, members);
  const expiration = resource.expiresAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(resource.expiresAt)) : undefined;
  return (
    <Link href={`/vault/${resource.id}`} className="resource-card">
      <div className="resource-card-top">
        <span className="resource-icon"><CategoryIcon category={resource.category} /></span>
        <span className={`visibility-badge visibility-${resource.visibility}`}>{visibilityLabels[resource.visibility]}</span>
      </div>
      <div className="resource-card-copy">
        <span className="resource-category">{categoryLabels[resource.category]}</span>
        <h3>{resource.name}</h3>
        <p>{resource.description}</p>
      </div>
      <div className="resource-card-meta">
        <span><Users size={14} />{audience.length === 1 ? "Owner only" : `${audience.length} people`}</span>
        {expiration && <span><CalendarClock size={14} />{expiration}</span>}
        <span className="resource-owner">Owned by {owner?.displayName.split(" ")[0]}</span>
      </div>
    </Link>
  );
}
