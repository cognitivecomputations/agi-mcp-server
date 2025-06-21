import { pgTable, index, uuid, timestamp, text, vector, doublePrecision, integer, jsonb, foreignKey, check, boolean, interval, primaryKey, pgView, bigint, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const clusterType = pgEnum("cluster_type", ['theme', 'emotion', 'temporal', 'person', 'pattern', 'mixed'])
export const memoryStatus = pgEnum("memory_status", ['active', 'archived', 'invalidated'])
export const memoryType = pgEnum("memory_type", ['episodic', 'semantic', 'procedural', 'strategic'])


export const memories = pgTable("memories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	type: memoryType().notNull(),
	status: memoryStatus().default('active'),
	content: text().notNull(),
	embedding: vector({ dimensions: 1536 }).notNull(),
	importance: doublePrecision().default(0),
	accessCount: integer("access_count").default(0),
	lastAccessed: timestamp("last_accessed", { withTimezone: true, mode: 'string' }),
	decayRate: doublePrecision("decay_rate").default(0.01),
	relevanceScore: doublePrecision("relevance_score").generatedAlwaysAs(sql`(importance * exp(((- decay_rate) * age_in_days(created_at))))`),
}, (table) => [
	index("memories_content_idx").using("gin", table.content.asc().nullsLast().op("gin_trgm_ops")),
	index("memories_embedding_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
	index("memories_relevance_score_idx").using("btree", table.relevanceScore.desc().nullsFirst().op("float8_ops")).where(sql`(status = 'active'::memory_status)`),
	index("memories_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const workingMemory = pgTable("working_memory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	content: text().notNull(),
	embedding: vector({ dimensions: 1536 }).notNull(),
	expiry: timestamp({ withTimezone: true, mode: 'string' }),
});

export const memoryClusters = pgTable("memory_clusters", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	clusterType: clusterType("cluster_type").notNull(),
	name: text().notNull(),
	description: text(),
	centroidEmbedding: vector("centroid_embedding", { dimensions: 1536 }),
	emotionalSignature: jsonb("emotional_signature"),
	keywords: text().array(),
	importanceScore: doublePrecision("importance_score").default(0),
	coherenceScore: doublePrecision("coherence_score"),
	lastActivated: timestamp("last_activated", { withTimezone: true, mode: 'string' }),
	activationCount: integer("activation_count").default(0),
	worldviewAlignment: doublePrecision("worldview_alignment"),
}, (table) => [
	index("memory_clusters_centroid_embedding_idx").using("ivfflat", table.centroidEmbedding.asc().nullsLast().op("vector_cosine_ops")),
	index("memory_clusters_cluster_type_importance_score_idx").using("btree", table.clusterType.asc().nullsLast().op("enum_ops"), table.importanceScore.desc().nullsFirst().op("float8_ops")),
	index("memory_clusters_last_activated_idx").using("btree", table.lastActivated.desc().nullsFirst().op("timestamptz_ops")),
]);

export const episodicMemories = pgTable("episodic_memories", {
	memoryId: uuid("memory_id").primaryKey().notNull(),
	actionTaken: jsonb("action_taken"),
	context: jsonb(),
	result: jsonb(),
	emotionalValence: doublePrecision("emotional_valence"),
	verificationStatus: boolean("verification_status"),
	eventTime: timestamp("event_time", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.memoryId],
			foreignColumns: [memories.id],
			name: "episodic_memories_memory_id_fkey"
		}),
	check("valid_emotion", sql`(emotional_valence >= ('-1'::integer)::double precision) AND (emotional_valence <= (1)::double precision)`),
]);

export const clusterActivationHistory = pgTable("cluster_activation_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clusterId: uuid("cluster_id"),
	activatedAt: timestamp("activated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	activationContext: text("activation_context"),
	activationStrength: doublePrecision("activation_strength"),
	coActivatedClusters: uuid("co_activated_clusters").array(),
	resultingInsights: jsonb("resulting_insights"),
}, (table) => [
	foreignKey({
			columns: [table.clusterId],
			foreignColumns: [memoryClusters.id],
			name: "cluster_activation_history_cluster_id_fkey"
		}),
]);

export const semanticMemories = pgTable("semantic_memories", {
	memoryId: uuid("memory_id").primaryKey().notNull(),
	confidence: doublePrecision().notNull(),
	lastValidated: timestamp("last_validated", { withTimezone: true, mode: 'string' }),
	sourceReferences: jsonb("source_references"),
	contradictions: jsonb(),
	category: text().array(),
	relatedConcepts: text("related_concepts").array(),
}, (table) => [
	foreignKey({
			columns: [table.memoryId],
			foreignColumns: [memories.id],
			name: "semantic_memories_memory_id_fkey"
		}),
	check("valid_confidence", sql`(confidence >= (0)::double precision) AND (confidence <= (1)::double precision)`),
]);

export const proceduralMemories = pgTable("procedural_memories", {
	memoryId: uuid("memory_id").primaryKey().notNull(),
	steps: jsonb().notNull(),
	prerequisites: jsonb(),
	successCount: integer("success_count").default(0),
	totalAttempts: integer("total_attempts").default(0),
	successRate: doublePrecision("success_rate").generatedAlwaysAs(sql`
CASE
    WHEN (total_attempts > 0) THEN ((success_count)::double precision / (total_attempts)::double precision)
    ELSE (0)::double precision
END`),
	averageDuration: interval("average_duration"),
	failurePoints: jsonb("failure_points"),
}, (table) => [
	foreignKey({
			columns: [table.memoryId],
			foreignColumns: [memories.id],
			name: "procedural_memories_memory_id_fkey"
		}),
]);

export const strategicMemories = pgTable("strategic_memories", {
	memoryId: uuid("memory_id").primaryKey().notNull(),
	patternDescription: text("pattern_description").notNull(),
	supportingEvidence: jsonb("supporting_evidence"),
	confidenceScore: doublePrecision("confidence_score"),
	successMetrics: jsonb("success_metrics"),
	adaptationHistory: jsonb("adaptation_history"),
	contextApplicability: jsonb("context_applicability"),
}, (table) => [
	foreignKey({
			columns: [table.memoryId],
			foreignColumns: [memories.id],
			name: "strategic_memories_memory_id_fkey"
		}),
	check("valid_confidence", sql`(confidence_score >= (0)::double precision) AND (confidence_score <= (1)::double precision)`),
]);

export const worldviewPrimitives = pgTable("worldview_primitives", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	category: text().notNull(),
	belief: text().notNull(),
	confidence: doublePrecision(),
	emotionalValence: doublePrecision("emotional_valence"),
	stabilityScore: doublePrecision("stability_score"),
	connectedBeliefs: uuid("connected_beliefs").array(),
	activationPatterns: jsonb("activation_patterns"),
	memoryFilterRules: jsonb("memory_filter_rules"),
	influencePatterns: jsonb("influence_patterns"),
	preferredClusters: uuid("preferred_clusters").array(),
});

export const worldviewMemoryInfluences = pgTable("worldview_memory_influences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	worldviewId: uuid("worldview_id"),
	memoryId: uuid("memory_id"),
	influenceType: text("influence_type"),
	strength: doublePrecision(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("worldview_memory_influences_memory_id_strength_idx").using("btree", table.memoryId.asc().nullsLast().op("float8_ops"), table.strength.desc().nullsFirst().op("float8_ops")),
	foreignKey({
			columns: [table.worldviewId],
			foreignColumns: [worldviewPrimitives.id],
			name: "worldview_memory_influences_worldview_id_fkey"
		}),
	foreignKey({
			columns: [table.memoryId],
			foreignColumns: [memories.id],
			name: "worldview_memory_influences_memory_id_fkey"
		}),
]);

export const memoryChanges = pgTable("memory_changes", {
	changeId: uuid("change_id").defaultRandom().primaryKey().notNull(),
	memoryId: uuid("memory_id"),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	changeType: text("change_type").notNull(),
	oldValue: jsonb("old_value"),
	newValue: jsonb("new_value"),
}, (table) => [
	foreignKey({
			columns: [table.memoryId],
			foreignColumns: [memories.id],
			name: "memory_changes_memory_id_fkey"
		}),
]);

export const identityMemoryResonance = pgTable("identity_memory_resonance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	memoryId: uuid("memory_id"),
	identityAspect: uuid("identity_aspect"),
	resonanceStrength: doublePrecision("resonance_strength"),
	integrationStatus: text("integration_status"),
}, (table) => [
	index("identity_memory_resonance_memory_id_resonance_strength_idx").using("btree", table.memoryId.asc().nullsLast().op("float8_ops"), table.resonanceStrength.desc().nullsFirst().op("float8_ops")),
	foreignKey({
			columns: [table.memoryId],
			foreignColumns: [memories.id],
			name: "identity_memory_resonance_memory_id_fkey"
		}),
	foreignKey({
			columns: [table.identityAspect],
			foreignColumns: [identityModel.id],
			name: "identity_memory_resonance_identity_aspect_fkey"
		}),
]);

export const identityModel = pgTable("identity_model", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	selfConcept: jsonb("self_concept"),
	agencyBeliefs: jsonb("agency_beliefs"),
	purposeFramework: jsonb("purpose_framework"),
	groupIdentifications: jsonb("group_identifications"),
	boundaryDefinitions: jsonb("boundary_definitions"),
	emotionalBaseline: jsonb("emotional_baseline"),
	threatSensitivity: doublePrecision("threat_sensitivity"),
	changeResistance: doublePrecision("change_resistance"),
	coreMemoryClusters: uuid("core_memory_clusters").array(),
});

export const memoryClusterMembers = pgTable("memory_cluster_members", {
	clusterId: uuid("cluster_id").notNull(),
	memoryId: uuid("memory_id").notNull(),
	membershipStrength: doublePrecision("membership_strength").default(1),
	addedAt: timestamp("added_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	contributionToCentroid: doublePrecision("contribution_to_centroid"),
}, (table) => [
	index("memory_cluster_members_cluster_id_membership_strength_idx").using("btree", table.clusterId.asc().nullsLast().op("uuid_ops"), table.membershipStrength.desc().nullsFirst().op("float8_ops")),
	index("memory_cluster_members_memory_id_idx").using("btree", table.memoryId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clusterId],
			foreignColumns: [memoryClusters.id],
			name: "memory_cluster_members_cluster_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.memoryId],
			foreignColumns: [memories.id],
			name: "memory_cluster_members_memory_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.clusterId, table.memoryId], name: "memory_cluster_members_pkey"}),
]);

export const clusterRelationships = pgTable("cluster_relationships", {
	fromClusterId: uuid("from_cluster_id").notNull(),
	toClusterId: uuid("to_cluster_id").notNull(),
	relationshipType: text("relationship_type").notNull(),
	strength: doublePrecision().default(0.5),
	discoveredAt: timestamp("discovered_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	evidenceMemories: uuid("evidence_memories").array(),
}, (table) => [
	index("cluster_relationships_from_cluster_id_idx").using("btree", table.fromClusterId.asc().nullsLast().op("uuid_ops")),
	index("cluster_relationships_to_cluster_id_idx").using("btree", table.toClusterId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.fromClusterId],
			foreignColumns: [memoryClusters.id],
			name: "cluster_relationships_from_cluster_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toClusterId],
			foreignColumns: [memoryClusters.id],
			name: "cluster_relationships_to_cluster_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.fromClusterId, table.toClusterId, table.relationshipType], name: "cluster_relationships_pkey"}),
]);
export const memoryHealth = pgView("memory_health", {	type: memoryType(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalMemories: bigint("total_memories", { mode: "number" }),
	avgImportance: doublePrecision("avg_importance"),
	avgAccessCount: numeric("avg_access_count"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	accessedLastDay: bigint("accessed_last_day", { mode: "number" }),
	avgRelevance: doublePrecision("avg_relevance"),
}).as(sql`SELECT type, count(*) AS total_memories, avg(importance) AS avg_importance, avg(access_count) AS avg_access_count, count(*) FILTER (WHERE last_accessed > (CURRENT_TIMESTAMP - '1 day'::interval)) AS accessed_last_day, avg(relevance_score) AS avg_relevance FROM memories GROUP BY type`);

export const clusterInsights = pgView("cluster_insights", {	id: uuid(),
	name: text(),
	clusterType: clusterType("cluster_type"),
	importanceScore: doublePrecision("importance_score"),
	coherenceScore: doublePrecision("coherence_score"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	memoryCount: bigint("memory_count", { mode: "number" }),
	lastActivated: timestamp("last_activated", { withTimezone: true, mode: 'string' }),
	relatedClusters: uuid("related_clusters"),
}).as(sql`SELECT mc.id, mc.name, mc.cluster_type, mc.importance_score, mc.coherence_score, count(mcm.memory_id) AS memory_count, mc.last_activated, array_agg(DISTINCT cr.to_cluster_id) AS related_clusters FROM memory_clusters mc LEFT JOIN memory_cluster_members mcm ON mc.id = mcm.cluster_id LEFT JOIN cluster_relationships cr ON mc.id = cr.from_cluster_id GROUP BY mc.id, mc.name, mc.cluster_type, mc.importance_score, mc.coherence_score, mc.last_activated ORDER BY mc.importance_score DESC`);

export const activeThemes = pgView("active_themes", {	theme: text(),
	emotionalSignature: jsonb("emotional_signature"),
	keywords: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	recentActivations: bigint("recent_activations", { mode: "number" }),
	associatedThemes: uuid("associated_themes"),
}).as(sql`SELECT mc.name AS theme, mc.emotional_signature, mc.keywords, count(DISTINCT mch.id) AS recent_activations, array_agg(DISTINCT mch.co_activated_clusters) FILTER (WHERE mch.co_activated_clusters IS NOT NULL) AS associated_themes FROM memory_clusters mc JOIN cluster_activation_history mch ON mc.id = mch.cluster_id WHERE mch.activated_at > (CURRENT_TIMESTAMP - '7 days'::interval) GROUP BY mc.id, mc.name, mc.emotional_signature, mc.keywords ORDER BY (count(DISTINCT mch.id)) DESC`);