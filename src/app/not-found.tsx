import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function NotFound() {
  return <main className="standalone-state"><div><span className="state-icon"><LockKeyhole /></span><h1>This resource isn’t available.</h1><p>It may not exist, or it may not be shared with your current identity. Privato never reveals restricted records.</p><Link className="primary-button" href="/vault">Return to your vault</Link></div></main>;
}
