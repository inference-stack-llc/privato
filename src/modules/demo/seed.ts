import type { AuditEvent, Member, Resource } from "@/modules/core/domain";

export const DEMO_HOUSEHOLD_ID = "hh_morgan";
export const DEFAULT_MEMBER_ID = "member_alex";

export const demoMembers: Member[] = [
  { id: "member_alex", householdId: DEMO_HOUSEHOLD_ID, displayName: "Alex Morgan", initials: "AM", relationshipLabel: "Household owner", circle: "CORE", avatarTone: "plum" },
  { id: "member_maya", householdId: DEMO_HOUSEHOLD_ID, displayName: "Maya Morgan", initials: "MM", relationshipLabel: "Spouse", circle: "CORE", avatarTone: "rose" },
  { id: "member_jordan", householdId: DEMO_HOUSEHOLD_ID, displayName: "Jordan Morgan", initials: "JM", relationshipLabel: "Adult child", circle: "INNER", avatarTone: "sage" },
  { id: "member_riley", householdId: DEMO_HOUSEHOLD_ID, displayName: "Riley Morgan", initials: "RM", relationshipLabel: "Teenage child", circle: "INNER", avatarTone: "gold" },
  { id: "member_sam", householdId: DEMO_HOUSEHOLD_ID, displayName: "Sam Rivera", initials: "SR", relationshipLabel: "Family friend", circle: "OUTER", avatarTone: "slate" },
];

const base = {
  householdId: DEMO_HOUSEHOLD_ID,
  ownerMemberId: "member_alex",
  createdAt: "2026-06-18T15:00:00.000Z",
  updatedAt: "2026-07-18T18:30:00.000Z",
};

export const demoResources: Resource[] = [
  {
    ...base,
    id: "family-emergency-contacts",
    name: "Family emergency contacts",
    category: "EMERGENCY_CONTACTS",
    description: "The first people to call if the Morgan household needs help.",
    visibility: "OUTER",
    fields: [
      { label: "Primary contact", value: "Maya Morgan · (555) 010-0142" },
      { label: "Backup contact", value: "Jordan Morgan · (555) 010-0188" },
      { label: "Meeting point", value: "Northside Community Center" },
    ],
  },
  {
    ...base,
    id: "auto-insurance-card",
    name: "Honda auto insurance",
    category: "INSURANCE",
    description: "Current proof of insurance for the family Honda.",
    visibility: "INNER",
    expiresAt: "2026-11-30",
    fields: [
      { label: "Provider", value: "Northstar Mutual" },
      { label: "Policy number", value: "AUTO-••••-4821", mask: true },
      { label: "Covered vehicle", value: "2022 Honda CR-V" },
      { label: "VIN", value: "••••••••••••6742", mask: true },
      { label: "Support", value: "(555) 010-0911" },
    ],
    document: { filename: "honda-insurance-card.pdf", mimeType: "application/pdf", sizeBytes: 184200 },
  },
  {
    ...base,
    id: "health-insurance-card",
    name: "Morgan family health plan",
    category: "HEALTH",
    description: "Medical and prescription plan details for the household.",
    visibility: "CORE",
    expiresAt: "2026-12-31",
    fields: [
      { label: "Provider", value: "Harbor Health Cooperative" },
      { label: "Plan", value: "Family Choice 250" },
      { label: "Member ID", value: "HH-••••-1904", mask: true },
      { label: "Group", value: "GRP-8042" },
      { label: "Member services", value: "(555) 010-2200" },
    ],
    document: { filename: "health-plan-card.png", mimeType: "image/png", sizeBytes: 792000 },
  },
  {
    ...base,
    id: "roadside-assistance",
    name: "Roadside assistance",
    category: "VEHICLES",
    description: "24/7 roadside help and towing instructions.",
    visibility: "INNER",
    fields: [
      { label: "Provider", value: "Northstar Roadside" },
      { label: "24/7 number", value: "(555) 010-7722" },
      { label: "Membership", value: "RS-••••-2218", mask: true },
      { label: "Coverage", value: "Towing up to 100 miles" },
    ],
  },
  {
    ...base,
    id: "vehicle-registration",
    name: "Honda vehicle registration",
    category: "VEHICLES",
    description: "Registration details for the family vehicle.",
    visibility: "CORE",
    expiresAt: "2027-02-28",
    fields: [
      { label: "Vehicle", value: "2022 Honda CR-V" },
      { label: "Plate", value: "SYN-274" },
      { label: "Registration ID", value: "CO-••••-6380", mask: true },
    ],
  },
  {
    ...base,
    id: "household-emergency-instructions",
    name: "Household emergency plan",
    category: "HOUSEHOLD_INSTRUCTIONS",
    description: "Simple steps, meeting places, and utility shutoff guidance.",
    visibility: "OUTER",
    fields: [
      { label: "First step", value: "Make sure everyone is safe, then call emergency services." },
      { label: "Meeting point", value: "Northside Community Center" },
      { label: "Pet carrier", value: "Hall closet, top shelf" },
    ],
  },
  {
    ...base,
    id: "financial-account-summary",
    name: "Financial account summary",
    category: "FINANCIAL",
    description: "A private inventory of household financial relationships.",
    visibility: "PRIVATE",
    fields: [
      { label: "Primary institution", value: "Example Community Credit Union" },
      { label: "Account reference", value: "•••• 0427", mask: true },
      { label: "Advisor", value: "Demo contact · (555) 010-4400" },
    ],
  },
  {
    ...base,
    id: "medical-summary",
    name: "Alex’s medical summary",
    category: "HEALTH",
    description: "Essential medical context for an emergency.",
    visibility: "CORE",
    fields: [
      { label: "Primary clinician", value: "Dr. Taylor Reed · (555) 010-3321" },
      { label: "Allergy", value: "Synthetic demo: penicillin" },
      { label: "Preferred hospital", value: "Example Regional Medical Center" },
    ],
  },
];

export const demoAuditEvents: AuditEvent[] = [
  { id: "audit_1", householdId: DEMO_HOUSEHOLD_ID, actorMemberId: "member_maya", resourceId: "health-insurance-card", action: "RESOURCE_VIEWED", outcome: "SUCCESS", summary: "Maya viewed the family health plan", createdAt: "2026-07-20T19:12:00.000Z" },
  { id: "audit_2", householdId: DEMO_HOUSEHOLD_ID, actorMemberId: "member_alex", resourceId: "auto-insurance-card", action: "RESOURCE_UPDATED", outcome: "SUCCESS", summary: "Alex updated Honda auto insurance", createdAt: "2026-07-19T16:40:00.000Z" },
  { id: "audit_3", householdId: DEMO_HOUSEHOLD_ID, actorMemberId: "member_jordan", resourceId: "roadside-assistance", action: "RESOURCE_VIEWED", outcome: "SUCCESS", summary: "Jordan viewed roadside assistance", createdAt: "2026-07-18T23:05:00.000Z" },
];
