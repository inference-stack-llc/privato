# Five-minute demonstration

## 0:00–0:35 — Positioning

Open the entry page.

Say: “Digital vaults organize files. Privato organizes trust. The question we answer is: if something happened tonight, would the right people know where everything is?”

Select **Enter demo household**.

## 0:35–1:15 — Household readiness

On the dashboard, point out the calm preparedness summary, recent essentials, expiration dates, trusted activity, and five synthetic household members.

Open **Circles**. Explain that lower ranks are closer and more trusted: Core inherits Inner and Outer; Inner inherits Outer; Private remains owner-only.

## 1:15–2:05 — Deterministic access

In Outer Circle, choose **Move** for Sam Rivera. The confirmation dialog shows that moving Sam to Inner grants exactly:

- Honda auto insurance
- Roadside assistance

Confirm the move. Use the identity switcher to view as Sam. Open **Vault** and show the four accessible resources.

Paste `/vault/financial-account-summary`. The result is the same non-disclosing unavailable state as a nonexistent record.

Switch back to Alex.

## 2:05–3:25 — AI-assisted insurance intake

Choose **Add resource** → **Upload a document**. Upload a synthetic PDF or insurance-card image under 5 MB.

Point out:

- server-side file validation
- untrusted-document instruction boundary
- confidence indicators and masked uncertainty
- every extracted field is editable
- the model recommends Inner Circle but cannot authorize or save
- the effective audience updates immediately

Correct the resource title, then choose **Approve & save**. On the detail screen, show masked identifiers, exact audience, expiration, protected document metadata, and audit history.

## 3:25–4:30 — Ask Privato

Switch to Sam and open **Ask Privato**.

Ask: “What number do I call for roadside assistance?” Show the grounded answer and clickable resource citation.

Then ask: “Where is the family health-insurance information?” The response is:

“I couldn’t find accessible information for that request.”

Emphasize that the health record was never placed in the AI context and its existence is not disclosed.

## 4:30–5:00 — Close

Summarize:

- authorization is deterministic and centralized
- identity and membership changes take effect immediately
- AI reduces administration but never makes security decisions
- sensitive PostgreSQL payloads use versioned AES-256-GCM encryption
- the demo is honest about infrastructure and compliance limitations

Close with: “The right information. The right people. Right when it matters.”
