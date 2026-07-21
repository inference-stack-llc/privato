import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
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
        <div className="entry-visual">
          <Image
            className="entry-hero-image"
            src="/privato-home-hero.png"
            alt="Privato organizing trusted circles and sharing a family insurance card when it is needed"
            width={3344}
            height={1882}
            priority
            sizes="(max-width: 980px) calc(100vw - 40px), 52vw"
          />
        </div>
      </section>
      <footer className="entry-footer"><span>Digital vaults organize files.</span><strong>Privato organizes trust.</strong></footer>
    </main>
  );
}
