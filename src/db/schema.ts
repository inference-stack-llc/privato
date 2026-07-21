import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { EncryptedPayload } from "@/modules/encryption/crypto";

export const circleTypeEnum = pgEnum("circle_type", ["CORE", "INNER", "OUTER"]);
export const visibilityEnum = pgEnum("resource_visibility", ["PRIVATE", "CORE", "INNER", "OUTER"]);
export const resourceCategoryEnum = pgEnum("resource_category", [
  "INSURANCE",
  "HEALTH",
  "EMERGENCY_CONTACTS",
  "VEHICLES",
  "IDENTITY",
  "FINANCIAL",
  "LEGAL",
  "HOUSEHOLD_INSTRUCTIONS",
  "OTHER",
]);
export const auditOutcomeEnum = pgEnum("audit_outcome", ["SUCCESS", "DENIED", "FAILED"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ...timestamps,
});

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    initials: text("initials").notNull(),
    relationshipLabel: text("relationship_label").notNull(),
    avatarSeed: text("avatar_seed"),
    ...timestamps,
  },
  (table) => [index("members_household_idx").on(table.householdId)],
);

export const circles = pgTable(
  "circles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
    type: circleTypeEnum("type").notNull(),
    name: text("name").notNull(),
    rank: integer("rank").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("circles_household_type_idx").on(table.householdId, table.type),
    check("circles_rank_check", sql`${table.rank} between 1 and 3`),
  ],
);

export const circleMemberships = pgTable(
  "circle_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
    circleId: uuid("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("memberships_household_member_idx").on(table.householdId, table.memberId),
    index("memberships_circle_idx").on(table.circleId),
  ],
);

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: text("public_id").notNull().unique(),
    householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
    ownerMemberId: uuid("owner_member_id").notNull().references(() => members.id),
    name: text("name").notNull(),
    category: resourceCategoryEnum("category").notNull(),
    description: text("description").notNull(),
    visibility: visibilityEnum("visibility").notNull(),
    encryptedPayload: jsonb("encrypted_payload").$type<EncryptedPayload>().notNull(),
    encryptionVersion: integer("encryption_version").notNull().default(1),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("resources_household_idx").on(table.householdId),
    index("resources_owner_idx").on(table.ownerMemberId),
    index("resources_visibility_idx").on(table.householdId, table.visibility),
  ],
);

export const resourceDocuments = pgTable(
  "resource_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resourceId: uuid("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
    sanitizedFilename: text("sanitized_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    encryptedBytes: jsonb("encrypted_bytes").$type<EncryptedPayload>().notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("resource_documents_resource_idx").on(table.resourceId),
    check("resource_documents_size_check", sql`${table.sizeBytes} between 1 and 5242880`),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
    actorMemberId: uuid("actor_member_id").notNull().references(() => members.id),
    resourceId: uuid("resource_id").references(() => resources.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    outcome: auditOutcomeEnum("outcome").notNull(),
    safeMetadata: jsonb("safe_metadata").$type<Record<string, string | number | boolean>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_household_created_idx").on(table.householdId, table.createdAt)],
);

export const aiRuns = pgTable(
  "ai_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
    actorMemberId: uuid("actor_member_id").notNull().references(() => members.id),
    correlationId: text("correlation_id").notNull(),
    operation: text("operation").notNull(),
    retrievalMode: text("retrieval_mode").notNull().default("structured_lexical"),
    authorizedResourceCount: integer("authorized_resource_count").notNull().default(0),
    candidateCount: integer("candidate_count").notNull().default(0),
    sourceCount: integer("source_count").notNull().default(0),
    answerable: boolean("answerable").notNull().default(false),
    answerModelInvoked: boolean("answer_model_invoked").notNull().default(false),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    status: text("status").notNull(),
    durationMs: integer("duration_ms").notNull(),
    retryCount: integer("retry_count").notNull().default(0),
    circuitState: text("circuit_state").notNull().default("closed"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    tokenUsage: jsonb("token_usage").$type<{ input?: number; output?: number }>().notNull().default({}),
    estimatedCost: text("estimated_cost"),
    errorCategory: text("error_category"),
    safeMetadata: jsonb("safe_metadata").$type<Record<string, string | number | boolean>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("ai_runs_household_created_idx").on(table.householdId, table.createdAt),
    uniqueIndex("ai_runs_correlation_idx").on(table.correlationId),
    index("ai_runs_actor_created_idx").on(table.actorMemberId, table.createdAt),
  ],
);
