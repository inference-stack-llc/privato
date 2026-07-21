"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronDown,
  CircleUserRound,
  LockKeyhole,
  MessageCircleMore,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { AskPrivatoResponseDto } from "@/modules/assistant/types";
import { ASK_VALIDATION_MESSAGE } from "@/modules/assistant/types";
import type { CircleType } from "@/modules/core/domain";
import { categoryLabels, visibilityLabels } from "@/modules/core/domain";

const prompts = [
  "What number do I call for roadside assistance?",
  "Who do I call if the Honda breaks down?",
  "What’s the towing number?",
  "Who should I contact in an emergency?",
];

function labelCircle(circle: CircleType): string {
  return `${circle[0]}${circle.slice(1).toLowerCase()} Circle`;
}

function ProtectionTrace({ trace }: { trace: AskPrivatoResponseDto["trace"] }) {
  return (
    <details className="protection-trace">
      <summary>
        <span><ShieldCheck size={16} />How this answer was protected</span>
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div className="protection-trace-body">
        <p>Safe request metadata only—never the question, evidence, answer, or protected values.</p>
        <dl>
          <div><dt>Viewing as</dt><dd>{trace.viewingAs}</dd></div>
          <div><dt>Circle</dt><dd>{trace.circle}</dd></div>
          <div><dt>Authorized scope</dt><dd>{trace.authorizedResourceCount} resources</dd></div>
          <div><dt>Candidates considered</dt><dd>{trace.candidatesConsidered}</dd></div>
          <div><dt>Sources used</dt><dd>{trace.sourcesUsed}</dd></div>
          <div><dt>Policy decision</dt><dd>{trace.policyDecision}</dd></div>
          <div><dt>Retrieval</dt><dd>{trace.retrievalMethod}</dd></div>
          <div><dt>Answer model invoked</dt><dd>{trace.answerModelInvoked ? "Yes" : "No"}</dd></div>
          {trace.model && <div><dt>Model</dt><dd>{trace.model}</dd></div>}
          <div><dt>Duration</dt><dd>{trace.durationMs.toLocaleString()} ms</dd></div>
          <div><dt>Retries</dt><dd>{trace.retryCount}</dd></div>
          <div><dt>Circuit state</dt><dd>{trace.circuitState}</dd></div>
          {(trace.inputTokens !== undefined || trace.outputTokens !== undefined) && (
            <div><dt>Token usage</dt><dd>{(trace.inputTokens ?? 0) + (trace.outputTokens ?? 0)} total</dd></div>
          )}
          <div><dt>Correlation ID</dt><dd><code>{trace.correlationId}</code></dd></div>
        </dl>
      </div>
    </details>
  );
}

export function AskPrivato({
  principalId,
  identityName,
  circle,
  accessibleCount,
}: {
  principalId: string;
  identityName: string;
  circle: CircleType;
  accessibleCount: number;
}) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskPrivatoResponseDto>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const activeRequest = useRef<AbortController | undefined>(undefined);
  const firstName = identityName.split(" ")[0];

  useEffect(() => {
    function reset() {
      activeRequest.current?.abort();
      activeRequest.current = undefined;
      setQuestion("");
      setResult(undefined);
      setError(undefined);
      setPending(false);
    }

    function resetForSessionChange(event: StorageEvent) {
      if (event.key === "privato:session-revision") reset();
    }

    window.addEventListener("storage", resetForSessionChange);
    reset();
    return () => {
      window.removeEventListener("storage", resetForSessionChange);
      activeRequest.current?.abort();
    };
  }, [principalId]);

  async function ask(event?: FormEvent) {
    event?.preventDefault();
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) {
      setError(ASK_VALIDATION_MESSAGE);
      return;
    }

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setPending(true);
    setResult(undefined);
    setError(undefined);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: normalizedQuestion }),
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await response.json() as AskPrivatoResponseDto | { error?: string };
      if ("status" in payload) {
        setResult(payload);
      } else {
        setError(payload.error ?? "Privato couldn’t answer right now. Try again.");
      }
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === "AbortError") return;
      setError("Privato couldn’t answer right now. Try again.");
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = undefined;
        setPending(false);
      }
    }
  }

  function selectPrompt(prompt: string) {
    setQuestion(prompt);
    setResult(undefined);
    setError(undefined);
  }

  return (
    <div className="ask-layout">
      <section className="ask-workspace surface-card">
        <div className="ask-intro">
          <span className="ask-mark"><Sparkles size={22} /></span>
          <div>
            <h2>What do you need to know?</h2>
            <p>Privato searches only the information available to your current identity.</p>
          </div>
          <div className="ask-identity-pill" aria-label={`Viewing as ${identityName} in the ${labelCircle(circle)}`}>
            <CircleUserRound size={16} />
            <span><strong>{identityName}</strong><small>{labelCircle(circle)}</small></span>
          </div>
        </div>

        <form className="ask-form" onSubmit={ask}>
          <label htmlFor="ask-question" className="sr-only">Ask a question about accessible information</label>
          <textarea
            id="ask-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={500}
            placeholder="Ask about insurance, emergency contacts, a vehicle, or household instructions…"
          />
          <div className="ask-form-footer">
            <span><LockKeyhole size={13} />{accessibleCount} authorized resources in scope</span>
            <button className="primary-button" type="submit" disabled={pending || !question.trim()}>
              {pending ? "Searching safely…" : "Ask Privato"}<Send size={15} />
            </button>
          </div>
        </form>

        {!result && !pending && !error && (
          <div className="prompt-suggestions">
            <span>Try asking</span>
            <div>{prompts.map((prompt) => <button type="button" key={prompt} onClick={() => selectPrompt(prompt)}>{prompt}<ArrowRight size={13} /></button>)}</div>
          </div>
        )}

        {pending && (
          <div className="answer-pending" role="status">
            <span className="thinking-orbit"><Sparkles size={18} /></span>
            <div><strong>Searching accessible resources</strong><span>Authorization first · retrieval second · AI last</span></div>
          </div>
        )}

        {error && (
          <div className="answer-error" role="alert">
            <MessageCircleMore size={20} />
            <div><strong>Privato couldn’t complete that request.</strong><span>{error}</span></div>
            <button className="secondary-button" type="button" onClick={() => ask()}>Try again</button>
          </div>
        )}

        {result && (
          <div className={`answer-card answer-card-${result.status}`} aria-live="polite">
            <div className="answer-label">
              <span>{result.status === "answered" ? <Sparkles size={14} /> : <ShieldCheck size={14} />}Privato</span>
              <small>{result.status === "answered" ? "Grounded in your accessible vault" : result.status === "no_answer" ? "No accessible evidence found" : "Protected fallback"}</small>
            </div>
            <p>{result.answer}</p>

            {result.citations.length > 0 && (
              <div className="answer-citations">
                <span><BookOpenCheck size={14} />Sources from your vault</span>
                <div>{result.citations.map((citation) => (
                  <Link href={citation.href} key={citation.resourcePublicId}>
                    <span className="citation-check"><Check size={12} /></span>
                    <span>
                      <strong>{citation.name}</strong>
                      <small>{categoryLabels[citation.category]} · {visibilityLabels[citation.visibility]}</small>
                      {citation.reason && <em>{citation.reason}</em>}
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                ))}</div>
              </div>
            )}

            {result.status === "no_answer" && (
              <div className="no-citations"><LockKeyhole size={14} />No source was supplied to the answer model.</div>
            )}
            <ProtectionTrace trace={result.trace} />
          </div>
        )}
      </section>

      <aside className="ask-safety">
        <section className="surface-card safety-card">
          <span className="safety-icon"><ShieldCheck size={20} /></span>
          <h2>Answers stop at your circle.</h2>
          <p>The model never decides access. Privato applies deterministic policy before retrieval or AI context construction.</p>
          <ol>
            <li><span>1</span>Resolve {firstName}’s identity</li>
            <li><span>2</span>Calculate current access</li>
            <li><span>3</span>Retrieve relevant evidence</li>
            <li><span>4</span>Generate and validate citations</li>
          </ol>
        </section>
        <div className="scope-card"><LockKeyhole size={16} /><div><strong>Current retrieval scope</strong><span>{accessibleCount} resources · recalculated for every question</span></div></div>
      </aside>
    </div>
  );
}
