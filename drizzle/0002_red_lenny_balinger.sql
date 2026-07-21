ALTER TABLE "ai_runs" ADD COLUMN "correlation_id" text;--> statement-breakpoint
UPDATE "ai_runs" SET "correlation_id" = 'legacy-' || "id"::text WHERE "correlation_id" IS NULL;--> statement-breakpoint
ALTER TABLE "ai_runs" ALTER COLUMN "correlation_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "retrieval_mode" text DEFAULT 'structured_lexical' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "authorized_resource_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "candidate_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "source_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "answerable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "answer_model_invoked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "circuit_state" text DEFAULT 'closed' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "input_tokens" integer;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "output_tokens" integer;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "error_category" text;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_runs_correlation_idx" ON "ai_runs" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "ai_runs_actor_created_idx" ON "ai_runs" USING btree ("actor_member_id","created_at");
