import Link from "next/link";
import { cn } from "@/lib/cn";

export function BrandLockup({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link href="/home" className={cn("brand-lockup", inverse && "brand-lockup-inverse")} aria-label="Privato home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {!compact && <span className="brand-word">Privato</span>}
    </Link>
  );
}
