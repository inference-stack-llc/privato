"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FilePenLine, FileUp, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, UploadCloud, X } from "lucide-react";
import type { InsuranceExtraction } from "@/modules/ai/schemas";
import type { Member, ResourceCategory, Visibility } from "@/modules/core/domain";
import { categoryLabels, visibilityLabels } from "@/modules/core/domain";
import { MemberAvatar } from "@/components/member-avatar";
import { canAccessResource } from "@/modules/authorization/policy";

type Mode = "choose" | "upload" | "manual" | "review";
interface ExtractionResponse { extraction: InsuranceExtraction; filename: string; mimeType: string; sizeBytes: number; provider: string; correlationId: string }

const MAX_BYTES = 5 * 1024 * 1024;
const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function AddResourceFlow({ members, principalMemberId }: { members: Member[]; principalMemberId: string }) {
  const [mode, setMode] = useState<Mode>("choose");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResponse>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("INSURANCE");
  const [visibility, setVisibility] = useState<Visibility>("INNER");
  const [expirationDate, setExpirationDate] = useState("");
  const [fields, setFields] = useState<Array<{ label: string; value: string; confidence?: number }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const owner = members.find((member) => member.id === principalMemberId)!;

  const audience = useMemo(() => members.filter((member) => canAccessResource({ householdId: member.householdId, memberId: member.id, circle: member.circle }, { householdId: owner.householdId, ownerMemberId: owner.id, visibility })), [members, owner, visibility]);

  function validate(candidate: File): string | undefined {
    if (!allowed.includes(candidate.type)) return "Choose a PDF, JPEG, PNG, or WebP document.";
    if (candidate.size > MAX_BYTES) return "This file is larger than the 5 MB demo limit.";
    if (candidate.size === 0) return "This file is empty.";
  }

  function chooseFile(candidate?: File) {
    if (!candidate) return;
    const problem = validate(candidate);
    setError(problem);
    if (!problem) setFile(candidate);
  }

  async function extract() {
    if (!file) return;
    setLoading(true);
    setError(undefined);
    const body = new FormData();
    body.set("document", file);
    const response = await fetch("/api/ai/extract", { method: "POST", body });
    const payload = await response.json() as ExtractionResponse & { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "AI extraction is temporarily unavailable. Continue with manual entry.");
      setLoading(false);
      return;
    }
    setResult(payload);
    setTitle(payload.extraction.title);
    setDescription(payload.extraction.documentType === "HEALTH_INSURANCE" ? "Health insurance information reviewed from an uploaded card." : "Auto insurance information reviewed from an uploaded card.");
    setCategory(payload.extraction.documentType === "HEALTH_INSURANCE" ? "HEALTH" : "INSURANCE");
    setVisibility(payload.extraction.recommendedVisibility);
    setExpirationDate(payload.extraction.expirationDate ?? "");
    setFields(payload.extraction.fields.map((field) => ({ label: field.label, value: field.value, confidence: field.confidence })));
    setMode("review");
    setLoading(false);
  }

  function startManual() {
    setTitle(""); setDescription(""); setFields([{ label: "Important detail", value: "" }]); setCategory("OTHER"); setVisibility("PRIVATE"); setExpirationDate(""); setMode("manual"); setError(undefined);
  }

  async function save() {
    if (!title.trim() || fields.some((field) => !field.label.trim() || !field.value.trim())) {
      setError("Add a resource name and complete each information field before saving.");
      return;
    }
    setLoading(true); setError(undefined);
    const response = await fetch("/api/resources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, description: description || "Important household information.", category, visibility, expirationDate: expirationDate || null, fields: fields.map(({ label, value }) => ({ label, value })), document: result ? { filename: result.filename, mimeType: result.mimeType, sizeBytes: result.sizeBytes } : null, source: result ? "AI_REVIEWED" : "MANUAL" }),
    });
    const payload = await response.json() as { resourceId?: string; error?: string };
    if (!response.ok || !payload.resourceId) { setError(payload.error ?? "The resource could not be saved."); setLoading(false); return; }
    router.push(`/vault/${payload.resourceId}`);
    router.refresh();
  }

  if (mode === "choose") return (
    <div className="add-choice-grid">
      <button type="button" className="add-choice featured" onClick={() => setMode("upload")}><span className="choice-icon"><Sparkles size={22} /></span><span className="choice-label">Recommended</span><h2>Upload a document</h2><p>Privato identifies an insurance card, extracts the details, and asks you to review every field.</p><span className="choice-action">Choose a document <ArrowRight size={16} /></span></button>
      <button type="button" className="add-choice" onClick={startManual}><span className="choice-icon neutral"><FilePenLine size={22} /></span><h2>Enter information manually</h2><p>Create a resource yourself. You control the fields, access level, and expiration date.</p><span className="choice-action">Start with a blank resource <ArrowRight size={16} /></span></button>
    </div>
  );

  if (mode === "upload") return (
    <section className="workflow-card surface-card">
      <button className="back-link button-link" type="button" onClick={() => setMode("choose")}><ArrowLeft size={15} />Choose another method</button>
      <div className="workflow-heading"><span className="workflow-icon"><FileUp size={23} /></span><div><span className="page-kicker">Step 1 of 2</span><h2>Upload an insurance card</h2><p>PDF, JPEG, PNG, or WebP. Maximum 5 MB.</p></div></div>
      <input className="sr-only" ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(event.target.files?.[0])} />
      <button type="button" className={`upload-dropzone ${dragging ? "dragging" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }}>
        <UploadCloud size={28} /><strong>{file ? file.name : "Drop your insurance card here"}</strong><span>{file ? `${(file.size / 1024).toFixed(0)} KB · ready to review` : "or select a file from your device"}</span>{file && <span className="status-badge"><Check size={12} /> File accepted</span>}
      </button>
      <div className="privacy-callout"><LockKeyhole size={18} /><div><strong>Your document is treated as private, untrusted data.</strong><span>It is sent only from the server, never logged, and cannot give instructions to the AI.</span></div></div>
      {error && <div className="inline-error" role="alert"><span>{error}</span><button type="button" onClick={startManual}>Enter manually instead</button></div>}
      <div className="workflow-actions"><button className="secondary-button" type="button" onClick={() => setMode("choose")}>Cancel</button><button className="primary-button" type="button" disabled={!file || loading} onClick={extract}>{loading ? <><LoaderCircle className="spin" size={17} /> Extracting securely…</> : <>Extract information <Sparkles size={16} /></>}</button></div>
    </section>
  );

  return (
    <section className="review-layout">
      <div className="review-main surface-card">
        <div className="review-heading"><div><span className="page-kicker">{mode === "review" ? "Step 2 of 2 · Review required" : "Manual resource"}</span><h2>{mode === "review" ? "Review what Privato found." : "Add the important details."}</h2><p>Nothing is saved until you confirm it. Correct any field that doesn’t look right.</p></div>{result && <span className="ai-provider"><Sparkles size={13} />{result.provider === "openai" ? "OpenAI extraction" : "Demo extraction"}</span>}</div>
        <div className="form-grid">
          <label className="form-field form-field-wide"><span>Resource name</span><input className="field-control" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="form-field form-field-wide"><span>Description</span><input className="field-control" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="form-field"><span>Category</span><select className="field-control" value={category} onChange={(event) => setCategory(event.target.value as ResourceCategory)}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="form-field"><span>Expiration date</span><input className="field-control" type="date" value={expirationDate} onChange={(event) => setExpirationDate(event.target.value)} /></label>
        </div>
        <div className="extracted-section"><div><h3>Structured information</h3><p>{fields.length} fields · all editable</p></div>
          <div className="editable-fields">{fields.map((field, index) => <div className="editable-field" key={`${field.label}-${index}`}><label><span>Field</span><input value={field.label} onChange={(event) => setFields((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /></label><label><span>Value</span><input value={field.value} onChange={(event) => setFields((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} /></label>{field.confidence !== undefined && <span className={`confidence ${field.confidence < .9 ? "uncertain" : ""}`}>{Math.round(field.confidence * 100)}%</span>}<button type="button" aria-label={`Remove ${field.label}`} onClick={() => setFields((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={14} /></button></div>)}</div>
          <button className="add-field-button" type="button" onClick={() => setFields((current) => [...current, { label: "", value: "" }])}>+ Add another field</button>
        </div>
        {result?.extraction.uncertainties.length ? <div className="uncertainty-note"><strong>Worth checking</strong>{result.extraction.uncertainties.map((item) => <span key={item}>{item}</span>)}</div> : null}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <aside className="review-aside">
        <section className="access-review surface-card"><span className="page-kicker">Visibility</span><h2>Who should have access?</h2>{result && <div className="recommendation"><Sparkles size={15} /><p><strong>Privato recommends {visibilityLabels[result.extraction.recommendedVisibility]}</strong>{result.extraction.recommendationReason}</p></div>}
          <div className="visibility-options">{(["PRIVATE", "CORE", "INNER", "OUTER"] as const).map((level) => <label key={level} className={visibility === level ? "selected" : ""}><input type="radio" name="visibility" value={level} checked={visibility === level} onChange={() => setVisibility(level)} /><span><strong>{visibilityLabels[level]}</strong><small>{level === "PRIVATE" ? "Only you" : level === "CORE" ? "Most trusted" : level === "INNER" ? "Close family" : "Essential access"}</small></span></label>)}</div>
          <div className="audience-preview"><span><ShieldCheck size={14} /> Effective audience · {audience.length}</span><div>{audience.map((member) => <MemberAvatar member={member} size="sm" key={member.id} />)}</div><p>{audience.map((member) => member.displayName.split(" ")[0]).join(", ")}</p></div>
        </section>
        <div className="review-save"><button className="secondary-button" type="button" onClick={() => setMode("choose")}>Cancel</button><button className="primary-button" type="button" disabled={loading} onClick={save}>{loading ? "Saving securely…" : "Approve & save"}<Check size={16} /></button></div>
      </aside>
    </section>
  );
}
