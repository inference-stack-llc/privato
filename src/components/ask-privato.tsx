"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Check, LockKeyhole, MessageCircleMore, Send, ShieldCheck, Sparkles } from "lucide-react";
import type { Visibility } from "@/modules/core/domain";
import { visibilityLabels } from "@/modules/core/domain";

interface Citation { id: string; name: string; visibility: Visibility }
interface Answer { answer: string; citations: Citation[]; provider: string; correlationId: string }

const prompts = [
  "What number do I call for roadside assistance?",
  "When does the Honda insurance expire?",
  "Who should I contact in an emergency?",
  "Where is the family health-insurance information?",
];

export function AskPrivato({ firstName, accessibleCount }: { firstName: string; accessibleCount: number }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function ask(event?: FormEvent) {
    event?.preventDefault();
    if (!question.trim()) return;
    setPending(true); setAnswer(undefined); setError(undefined);
    const response = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) });
    const payload = await response.json() as Answer & { error?: string };
    if (!response.ok) { setError(payload.error ?? "Privato couldn’t answer right now. Try again."); setPending(false); return; }
    setAnswer(payload); setPending(false);
  }

  function selectPrompt(prompt: string) {
    setQuestion(prompt); setAnswer(undefined); setError(undefined);
  }

  return (
    <div className="ask-layout">
      <section className="ask-workspace surface-card">
        <div className="ask-intro"><span className="ask-mark"><Sparkles size={22} /></span><div><h2>What do you need to know?</h2><p>I’ll search only the information {firstName} can access, then cite what I used.</p></div></div>
        <form className="ask-form" onSubmit={ask}>
          <label htmlFor="ask-question" className="sr-only">Ask a question about accessible information</label>
          <textarea id="ask-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="Ask about insurance, emergency contacts, a vehicle, or household instructions…" />
          <div className="ask-form-footer"><span><LockKeyhole size={13} /> {accessibleCount} authorized resources in scope</span><button className="primary-button" type="submit" disabled={pending || !question.trim()}>{pending ? "Searching safely…" : "Ask Privato"}<Send size={15} /></button></div>
        </form>
        {!answer && !pending && !error && <div className="prompt-suggestions"><span>Try asking</span><div>{prompts.map((prompt) => <button type="button" key={prompt} onClick={() => selectPrompt(prompt)}>{prompt}<ArrowRight size={13} /></button>)}</div></div>}
        {pending && <div className="answer-pending" role="status"><span className="thinking-orbit"><Sparkles size={18} /></span><div><strong>Searching authorized resources</strong><span>Authorization first · retrieval second · AI last</span></div></div>}
        {error && <div className="answer-error" role="alert"><MessageCircleMore size={20} /><div><strong>Privato couldn’t complete that request.</strong><span>{error}</span></div><button className="secondary-button" type="button" onClick={() => ask()}>Try again</button></div>}
        {answer && <div className="answer-card" aria-live="polite"><div className="answer-label"><span><Sparkles size={14} /> Privato</span><small>{answer.provider === "openai" ? "Generated with OpenAI" : "Reliable demo response"}</small></div><p>{answer.answer}</p>{answer.citations.length > 0 && <div className="answer-citations"><span><BookOpenCheck size={14} /> Sources from your vault</span><div>{answer.citations.map((citation) => <Link href={`/vault/${citation.id}`} key={citation.id}><span className="citation-check"><Check size={12} /></span><span><strong>{citation.name}</strong><small>{visibilityLabels[citation.visibility]}</small></span><ArrowRight size={13} /></Link>)}</div></div>}{answer.citations.length === 0 && <div className="no-citations"><LockKeyhole size={14} />No accessible source matched. Restricted records were not searched or disclosed.</div>}</div>}
      </section>
      <aside className="ask-safety">
        <section className="surface-card safety-card"><span className="safety-icon"><ShieldCheck size={20} /></span><h2>Answers stop at your circle.</h2><p>The model never decides access. Privato filters resources using deterministic policy before building any AI context.</p><ol><li><span>1</span>Resolve {firstName}’s identity</li><li><span>2</span>Filter by current circle</li><li><span>3</span>Build authorized context</li><li><span>4</span>Generate and cite the answer</li></ol></section>
        <div className="scope-card"><LockKeyhole size={16} /><div><strong>Current retrieval scope</strong><span>{accessibleCount} resources · recalculated for every question</span></div></div>
      </aside>
    </div>
  );
}
