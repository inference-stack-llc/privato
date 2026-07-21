"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Member, Resource, ResourceCategory, Visibility } from "@/modules/core/domain";
import { categoryLabels, visibilityLabels } from "@/modules/core/domain";
import { ResourceCard } from "@/components/resource-card";

export function VaultBrowser({ resources, members }: { resources: Resource[]; members: Member[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"ALL" | ResourceCategory>("ALL");
  const [visibility, setVisibility] = useState<"ALL" | Visibility>("ALL");
  const categories = [...new Set(resources.map((resource) => resource.category))];
  const visible = useMemo(() => resources.filter((resource) => {
    const text = `${resource.name} ${resource.description} ${categoryLabels[resource.category]}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === "ALL" || resource.category === category) && (visibility === "ALL" || resource.visibility === visibility);
  }), [resources, query, category, visibility]);

  return (
    <>
      <div className="vault-toolbar surface-card">
        <label className="search-field"><Search size={17} aria-hidden="true" /><span className="sr-only">Search resources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your accessible information…" /></label>
        <label className="filter-select"><SlidersHorizontal size={15} /><span className="sr-only">Filter by visibility</span><select value={visibility} onChange={(event) => setVisibility(event.target.value as "ALL" | Visibility)}><option value="ALL">All access levels</option>{(["PRIVATE", "CORE", "INNER", "OUTER"] as const).map((level) => <option value={level} key={level}>{visibilityLabels[level]}</option>)}</select></label>
      </div>
      <div className="category-tabs" role="group" aria-label="Filter resources by category">
        <button type="button" className={category === "ALL" ? "active" : ""} onClick={() => setCategory("ALL")}>All <span>{resources.length}</span></button>
        {categories.map((item) => <button type="button" className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{categoryLabels[item]} <span>{resources.filter((resource) => resource.category === item).length}</span></button>)}
      </div>
      <p className="results-count" role="status">{visible.length} {visible.length === 1 ? "resource" : "resources"} available to you</p>
      {visible.length > 0 ? <div className="vault-grid">{visible.map((resource) => <ResourceCard key={resource.id} resource={resource} members={members} />)}</div> : <div className="empty-state"><div><Search size={25} /><h3>No accessible matches</h3><p>Try another search or filter. Restricted resources are never included in these results.</p></div></div>}
    </>
  );
}
