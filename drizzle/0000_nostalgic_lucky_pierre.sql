CREATE TYPE "public"."audit_outcome" AS ENUM('SUCCESS', 'DENIED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."circle_type" AS ENUM('CORE', 'INNER', 'OUTER');--> statement-breakpoint
CREATE TYPE "public"."resource_category" AS ENUM('INSURANCE', 'HEALTH', 'EMERGENCY_CONTACTS', 'VEHICLES', 'IDENTITY', 'FINANCIAL', 'LEGAL', 'HOUSEHOLD_INSTRUCTIONS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."resource_visibility" AS ENUM('PRIVATE', 'CORE', 'INNER', 'OUTER');--> statement-breakpoint
CREATE TABLE "ai_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"actor_member_id" uuid NOT NULL,
	"operation" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"status" text NOT NULL,
	"duration_ms" integer NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"token_usage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"estimated_cost" text,
	"safe_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"actor_member_id" uuid NOT NULL,
	"resource_id" uuid,
	"action" text NOT NULL,
	"outcome" "audit_outcome" NOT NULL,
	"safe_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circle_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"circle_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"type" "circle_type" NOT NULL,
	"name" text NOT NULL,
	"rank" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"initials" text NOT NULL,
	"relationship_label" text NOT NULL,
	"avatar_seed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_id" uuid NOT NULL,
	"sanitized_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"encrypted_bytes" jsonb NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"household_id" uuid NOT NULL,
	"owner_member_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" "resource_category" NOT NULL,
	"description" text NOT NULL,
	"visibility" "resource_visibility" NOT NULL,
	"encrypted_payload" jsonb NOT NULL,
	"encryption_version" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resources_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_actor_member_id_members_id_fk" FOREIGN KEY ("actor_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_member_id_members_id_fk" FOREIGN KEY ("actor_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_memberships" ADD CONSTRAINT "circle_memberships_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_memberships" ADD CONSTRAINT "circle_memberships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_memberships" ADD CONSTRAINT "circle_memberships_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circles" ADD CONSTRAINT "circles_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_documents" ADD CONSTRAINT "resource_documents_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_owner_member_id_members_id_fk" FOREIGN KEY ("owner_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_runs_household_created_idx" ON "ai_runs" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_household_created_idx" ON "audit_events" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_household_member_idx" ON "circle_memberships" USING btree ("household_id","member_id");--> statement-breakpoint
CREATE INDEX "memberships_circle_idx" ON "circle_memberships" USING btree ("circle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "circles_household_type_idx" ON "circles" USING btree ("household_id","type");--> statement-breakpoint
CREATE INDEX "members_household_idx" ON "members" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "resource_documents_resource_idx" ON "resource_documents" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "resources_household_idx" ON "resources" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "resources_owner_idx" ON "resources" USING btree ("owner_member_id");--> statement-breakpoint
CREATE INDEX "resources_visibility_idx" ON "resources" USING btree ("household_id","visibility");