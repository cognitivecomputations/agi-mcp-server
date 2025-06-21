-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."cluster_type" AS ENUM('theme', 'emotion', 'temporal', 'person', 'pattern', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."memory_status" AS ENUM('active', 'archived', 'invalidated');--> statement-breakpoint
CREATE TYPE "public"."memory_type" AS ENUM('episodic', 'semantic', 'procedural', 'strategic');--> statement-breakpoint
CREATE TABLE "memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"type" "memory_type" NOT NULL,
	"status" "memory_status" DEFAULT 'active',
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"importance" double precision DEFAULT 0,
	"access_count" integer DEFAULT 0,
	"last_accessed" timestamp with time zone,
	"decay_rate" double precision DEFAULT 0.01,
	"relevance_score" double precision GENERATED ALWAYS AS ((importance * exp(((- decay_rate) * age_in_days(created_at))))) STORED
);
--> statement-breakpoint
CREATE TABLE "working_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"expiry" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "memory_clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"cluster_type" "cluster_type" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"centroid_embedding" vector(1536),
	"emotional_signature" jsonb,
	"keywords" text[],
	"importance_score" double precision DEFAULT 0,
	"coherence_score" double precision,
	"last_activated" timestamp with time zone,
	"activation_count" integer DEFAULT 0,
	"worldview_alignment" double precision
);
--> statement-breakpoint
CREATE TABLE "episodic_memories" (
	"memory_id" uuid PRIMARY KEY NOT NULL,
	"action_taken" jsonb,
	"context" jsonb,
	"result" jsonb,
	"emotional_valence" double precision,
	"verification_status" boolean,
	"event_time" timestamp with time zone,
	CONSTRAINT "valid_emotion" CHECK ((emotional_valence >= ('-1'::integer)::double precision) AND (emotional_valence <= (1)::double precision))
);
--> statement-breakpoint
CREATE TABLE "cluster_activation_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cluster_id" uuid,
	"activated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"activation_context" text,
	"activation_strength" double precision,
	"co_activated_clusters" uuid[],
	"resulting_insights" jsonb
);
--> statement-breakpoint
CREATE TABLE "semantic_memories" (
	"memory_id" uuid PRIMARY KEY NOT NULL,
	"confidence" double precision NOT NULL,
	"last_validated" timestamp with time zone,
	"source_references" jsonb,
	"contradictions" jsonb,
	"category" text[],
	"related_concepts" text[],
	CONSTRAINT "valid_confidence" CHECK ((confidence >= (0)::double precision) AND (confidence <= (1)::double precision))
);
--> statement-breakpoint
CREATE TABLE "procedural_memories" (
	"memory_id" uuid PRIMARY KEY NOT NULL,
	"steps" jsonb NOT NULL,
	"prerequisites" jsonb,
	"success_count" integer DEFAULT 0,
	"total_attempts" integer DEFAULT 0,
	"success_rate" double precision GENERATED ALWAYS AS (
CASE
    WHEN (total_attempts > 0) THEN ((success_count)::double precision / (total_attempts)::double precision)
    ELSE (0)::double precision
END) STORED,
	"average_duration" interval,
	"failure_points" jsonb
);
--> statement-breakpoint
CREATE TABLE "strategic_memories" (
	"memory_id" uuid PRIMARY KEY NOT NULL,
	"pattern_description" text NOT NULL,
	"supporting_evidence" jsonb,
	"confidence_score" double precision,
	"success_metrics" jsonb,
	"adaptation_history" jsonb,
	"context_applicability" jsonb,
	CONSTRAINT "valid_confidence" CHECK ((confidence_score >= (0)::double precision) AND (confidence_score <= (1)::double precision))
);
--> statement-breakpoint
CREATE TABLE "worldview_primitives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"belief" text NOT NULL,
	"confidence" double precision,
	"emotional_valence" double precision,
	"stability_score" double precision,
	"connected_beliefs" uuid[],
	"activation_patterns" jsonb,
	"memory_filter_rules" jsonb,
	"influence_patterns" jsonb,
	"preferred_clusters" uuid[]
);
--> statement-breakpoint
CREATE TABLE "worldview_memory_influences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worldview_id" uuid,
	"memory_id" uuid,
	"influence_type" text,
	"strength" double precision,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "memory_changes" (
	"change_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid,
	"changed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"change_type" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb
);
--> statement-breakpoint
CREATE TABLE "identity_memory_resonance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid,
	"identity_aspect" uuid,
	"resonance_strength" double precision,
	"integration_status" text
);
--> statement-breakpoint
CREATE TABLE "identity_model" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"self_concept" jsonb,
	"agency_beliefs" jsonb,
	"purpose_framework" jsonb,
	"group_identifications" jsonb,
	"boundary_definitions" jsonb,
	"emotional_baseline" jsonb,
	"threat_sensitivity" double precision,
	"change_resistance" double precision,
	"core_memory_clusters" uuid[]
);
--> statement-breakpoint
CREATE TABLE "memory_cluster_members" (
	"cluster_id" uuid NOT NULL,
	"memory_id" uuid NOT NULL,
	"membership_strength" double precision DEFAULT 1,
	"added_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"contribution_to_centroid" double precision,
	CONSTRAINT "memory_cluster_members_pkey" PRIMARY KEY("cluster_id","memory_id")
);
--> statement-breakpoint
CREATE TABLE "cluster_relationships" (
	"from_cluster_id" uuid NOT NULL,
	"to_cluster_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"strength" double precision DEFAULT 0.5,
	"discovered_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"evidence_memories" uuid[],
	CONSTRAINT "cluster_relationships_pkey" PRIMARY KEY("from_cluster_id","to_cluster_id","relationship_type")
);
--> statement-breakpoint
ALTER TABLE "episodic_memories" ADD CONSTRAINT "episodic_memories_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cluster_activation_history" ADD CONSTRAINT "cluster_activation_history_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "public"."memory_clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semantic_memories" ADD CONSTRAINT "semantic_memories_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedural_memories" ADD CONSTRAINT "procedural_memories_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_memories" ADD CONSTRAINT "strategic_memories_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worldview_memory_influences" ADD CONSTRAINT "worldview_memory_influences_worldview_id_fkey" FOREIGN KEY ("worldview_id") REFERENCES "public"."worldview_primitives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worldview_memory_influences" ADD CONSTRAINT "worldview_memory_influences_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_changes" ADD CONSTRAINT "memory_changes_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_memory_resonance" ADD CONSTRAINT "identity_memory_resonance_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_memory_resonance" ADD CONSTRAINT "identity_memory_resonance_identity_aspect_fkey" FOREIGN KEY ("identity_aspect") REFERENCES "public"."identity_model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_cluster_members" ADD CONSTRAINT "memory_cluster_members_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "public"."memory_clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_cluster_members" ADD CONSTRAINT "memory_cluster_members_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cluster_relationships" ADD CONSTRAINT "cluster_relationships_from_cluster_id_fkey" FOREIGN KEY ("from_cluster_id") REFERENCES "public"."memory_clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cluster_relationships" ADD CONSTRAINT "cluster_relationships_to_cluster_id_fkey" FOREIGN KEY ("to_cluster_id") REFERENCES "public"."memory_clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memories_content_idx" ON "memories" USING gin ("content" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "memories_embedding_idx" ON "memories" USING ivfflat ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "memories_relevance_score_idx" ON "memories" USING btree ("relevance_score" float8_ops) WHERE (status = 'active'::memory_status);--> statement-breakpoint
CREATE INDEX "memories_status_idx" ON "memories" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "memory_clusters_centroid_embedding_idx" ON "memory_clusters" USING ivfflat ("centroid_embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "memory_clusters_cluster_type_importance_score_idx" ON "memory_clusters" USING btree ("cluster_type" enum_ops,"importance_score" float8_ops);--> statement-breakpoint
CREATE INDEX "memory_clusters_last_activated_idx" ON "memory_clusters" USING btree ("last_activated" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "worldview_memory_influences_memory_id_strength_idx" ON "worldview_memory_influences" USING btree ("memory_id" float8_ops,"strength" float8_ops);--> statement-breakpoint
CREATE INDEX "identity_memory_resonance_memory_id_resonance_strength_idx" ON "identity_memory_resonance" USING btree ("memory_id" float8_ops,"resonance_strength" float8_ops);--> statement-breakpoint
CREATE INDEX "memory_cluster_members_cluster_id_membership_strength_idx" ON "memory_cluster_members" USING btree ("cluster_id" uuid_ops,"membership_strength" float8_ops);--> statement-breakpoint
CREATE INDEX "memory_cluster_members_memory_id_idx" ON "memory_cluster_members" USING btree ("memory_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "cluster_relationships_from_cluster_id_idx" ON "cluster_relationships" USING btree ("from_cluster_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "cluster_relationships_to_cluster_id_idx" ON "cluster_relationships" USING btree ("to_cluster_id" uuid_ops);--> statement-breakpoint
CREATE VIEW "public"."memory_health" AS (SELECT type, count(*) AS total_memories, avg(importance) AS avg_importance, avg(access_count) AS avg_access_count, count(*) FILTER (WHERE last_accessed > (CURRENT_TIMESTAMP - '1 day'::interval)) AS accessed_last_day, avg(relevance_score) AS avg_relevance FROM memories GROUP BY type);--> statement-breakpoint
CREATE VIEW "public"."cluster_insights" AS (SELECT mc.id, mc.name, mc.cluster_type, mc.importance_score, mc.coherence_score, count(mcm.memory_id) AS memory_count, mc.last_activated, array_agg(DISTINCT cr.to_cluster_id) AS related_clusters FROM memory_clusters mc LEFT JOIN memory_cluster_members mcm ON mc.id = mcm.cluster_id LEFT JOIN cluster_relationships cr ON mc.id = cr.from_cluster_id GROUP BY mc.id, mc.name, mc.cluster_type, mc.importance_score, mc.coherence_score, mc.last_activated ORDER BY mc.importance_score DESC);--> statement-breakpoint
CREATE VIEW "public"."active_themes" AS (SELECT mc.name AS theme, mc.emotional_signature, mc.keywords, count(DISTINCT mch.id) AS recent_activations, array_agg(DISTINCT mch.co_activated_clusters) FILTER (WHERE mch.co_activated_clusters IS NOT NULL) AS associated_themes FROM memory_clusters mc JOIN cluster_activation_history mch ON mc.id = mch.cluster_id WHERE mch.activated_at > (CURRENT_TIMESTAMP - '7 days'::interval) GROUP BY mc.id, mc.name, mc.emotional_signature, mc.keywords ORDER BY (count(DISTINCT mch.id)) DESC);
*/