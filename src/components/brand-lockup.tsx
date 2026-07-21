import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function BrandLockup({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link href="/" className={cn("brand-lockup", inverse && "brand-lockup-inverse")} aria-label="Privato home">
      <span className={cn("brand-logo-frame", compact && "brand-logo-frame-compact")} aria-hidden="true">
        <Image className="brand-logo" src="/privato-logo.png" alt="" width={3317} height={803} priority />
      </span>
    </Link>
  );
}
