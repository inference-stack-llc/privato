import Link from "next/link";
import { ArrowRight, Check, CircleDot, LockKeyhole, Sparkles } from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";

export default function EntryPage() {
  return (
    <main className="entry-page">
      <header className="entry-header"><BrandLockup /><span>Private by design. Prepared for real life.</span></header>
      <section className="entry-hero">
        <div className="entry-copy">
          <span className="eyebrow"><Sparkles size={14} /> A calmer way to be prepared</span>
          <h1>The right information.<br />The right people.<br /><em>Right when it matters.</em></h1>
          <p>Privato helps families securely organize essential documents and share them through trusted circles.</p>
          <Link href="/home" className="primary-button entry-cta">Enter demo household <ArrowRight size={18} /></Link>
          <div className="entry-proof"><span><Check size={14} /> Synthetic demo data</span><span><Check size={14} /> Permission-aware AI</span></div>
        </div>
        <div className="entry-visual" aria-label="Privato trust circles preview">
          <div className="orb orb-outer"><span>Outer</span>
            <div className="orb orb-inner"><span>Inner</span>
              <div className="orb orb-core"><LockKeyhole size={26} /><strong>Core</strong></div>
            </div>
          </div>
          <div className="visual-card visual-card-one"><CircleDot size={18} /><span><strong>5 trusted people</strong><small>organized by relationship</small></span></div>
          <div className="visual-card visual-card-two"><LockKeyhole size={18} /><span><strong>Private stays private</strong><small>authorization before retrieval</small></span></div>
        </div>
      </section>
      <footer className="entry-footer"><span>Digital vaults organize files.</span><strong>Privato organizes trust.</strong></footer>
    </main>
  );
}
