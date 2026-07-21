# Five-minute demonstration

## 0:00–0:35 — Positioning

Open the entry page.

Say: “Digital vaults organize files. Privato organizes trust. The question we answer is: if something happened tonight, would the right people know where everything is?”

Select **Enter demo household**.

## 0:35–1:15 — Household readiness

On the dashboard, point out the calm preparedness summary, recent essentials, expiration dates, trusted activity, and five synthetic household members.

Open **Circles**. Explain that lower ranks are closer and more trusted: Core inherits Inner and Outer; Inner inherits Outer; Private remains owner-only.

## 1:15–1:55 — Deterministic access

Sam begins in the Outer Circle. Use the identity switcher to view as Sam and open **Vault**. Show that only Outer resources are listed.

Paste `/vault/roadside-assistance`. The result is the same non-disclosing unavailable state as a nonexistent record. Switch back to Alex.

## 1:55–3:25 — Ask Privato: authorization changes retrieval

As Alex, open **Ask Privato** and ask:

> What number do I call for roadside assistance?

Show the real grounded answer, the clickable **Roadside Assistance** citation, and the collapsed **How this answer was protected** panel. Point out the authorized scope, candidate/source counts, answer-model status, retries, circuit state, duration, token aggregate, and shortened correlation ID. No question, evidence, answer, or protected value is stored in the trace.

Switch to Sam, still in Outer, and ask the exact same question. Privato returns:

> I couldn’t find accessible information that answers that question.

Open the protection panel: policy decision is **No authorized evidence**, sources are **0**, and answer model invoked is **No**. Privato does not say that a roadside resource exists or that another circle can access it.

Switch to Alex, open **Circles**, and move Sam to **Inner**. The confirmation dialog previews the exact newly available resources. Switch back to Sam and repeat the question without restarting the application. Sam now receives the answer and citation.

Switch to Alex, move Sam back to **Outer**, return to Sam, and repeat once more. The answer disappears immediately. This is revocable retrieval: current membership controls both vault access and AI context on every request.

## 3:25–4:25 — AI-assisted insurance intake

Choose **Add resource** → **Upload a document**. Upload a synthetic PDF or insurance-card image under 5 MB.

Point out:

- server-side file validation
- untrusted-document instruction boundary
- confidence indicators and masked uncertainty
- every extracted field is editable
- the model recommends Inner Circle but cannot authorize or save
- the effective audience updates immediately

Correct the resource title, then choose **Approve & save**. On the detail screen, show masked identifiers, exact audience, expiration, protected document metadata, and audit history.

## 4:25–5:00 — Close

Summarize:

- authorization is deterministic and centralized
- identity and membership changes take effect immediately
- retrieval is scoped before protected fields or AI context are read
- AI reduces administration but never makes security decisions
- no relevant authorized evidence means no answer-model call
- sensitive PostgreSQL payloads use versioned AES-256-GCM encryption
- the active Vercel demo uses the in-memory synthetic store; PostgreSQL persistence and ElectriPy execution are not overstated

Close with: “The right information. The right people. Right when it matters.”
