import {
  CarFront,
  FileBadge,
  FileHeart,
  FileKey,
  Landmark,
  NotebookTabs,
  PhoneCall,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { ResourceCategory } from "@/modules/core/domain";

const icons: Record<ResourceCategory, LucideIcon> = {
  INSURANCE: ShieldCheck,
  HEALTH: FileHeart,
  EMERGENCY_CONTACTS: PhoneCall,
  VEHICLES: CarFront,
  IDENTITY: FileKey,
  FINANCIAL: Landmark,
  LEGAL: FileBadge,
  HOUSEHOLD_INSTRUCTIONS: NotebookTabs,
  OTHER: FileBadge,
};

export function CategoryIcon({ category, size = 20 }: { category: ResourceCategory; size?: number }) {
  const Icon = icons[category];
  return <Icon size={size} aria-hidden="true" strokeWidth={1.8} />;
}
