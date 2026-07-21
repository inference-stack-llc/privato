import type { Member } from "@/modules/core/domain";
import { cn } from "@/lib/cn";

export function MemberAvatar({ member, size = "md" }: { member: Pick<Member, "initials" | "displayName" | "avatarTone">; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={cn("member-avatar", `avatar-${member.avatarTone}`, `avatar-${size}`)} aria-label={member.displayName} role="img">
      {member.initials}
    </span>
  );
}
