import { relations } from "drizzle-orm/relations";
import { memories, episodicMemories, memoryClusters, clusterActivationHistory, semanticMemories, proceduralMemories, strategicMemories, worldviewPrimitives, worldviewMemoryInfluences, memoryChanges, identityMemoryResonance, identityModel, memoryClusterMembers, clusterRelationships } from "./schema";

export const episodicMemoriesRelations = relations(episodicMemories, ({one}) => ({
	memory: one(memories, {
		fields: [episodicMemories.memoryId],
		references: [memories.id]
	}),
}));

export const memoriesRelations = relations(memories, ({many}) => ({
	episodicMemories: many(episodicMemories),
	semanticMemories: many(semanticMemories),
	proceduralMemories: many(proceduralMemories),
	strategicMemories: many(strategicMemories),
	worldviewMemoryInfluences: many(worldviewMemoryInfluences),
	memoryChanges: many(memoryChanges),
	identityMemoryResonances: many(identityMemoryResonance),
	memoryClusterMembers: many(memoryClusterMembers),
}));

export const clusterActivationHistoryRelations = relations(clusterActivationHistory, ({one}) => ({
	memoryCluster: one(memoryClusters, {
		fields: [clusterActivationHistory.clusterId],
		references: [memoryClusters.id]
	}),
}));

export const memoryClustersRelations = relations(memoryClusters, ({many}) => ({
	clusterActivationHistories: many(clusterActivationHistory),
	memoryClusterMembers: many(memoryClusterMembers),
	clusterRelationships_fromClusterId: many(clusterRelationships, {
		relationName: "clusterRelationships_fromClusterId_memoryClusters_id"
	}),
	clusterRelationships_toClusterId: many(clusterRelationships, {
		relationName: "clusterRelationships_toClusterId_memoryClusters_id"
	}),
}));

export const semanticMemoriesRelations = relations(semanticMemories, ({one}) => ({
	memory: one(memories, {
		fields: [semanticMemories.memoryId],
		references: [memories.id]
	}),
}));

export const proceduralMemoriesRelations = relations(proceduralMemories, ({one}) => ({
	memory: one(memories, {
		fields: [proceduralMemories.memoryId],
		references: [memories.id]
	}),
}));

export const strategicMemoriesRelations = relations(strategicMemories, ({one}) => ({
	memory: one(memories, {
		fields: [strategicMemories.memoryId],
		references: [memories.id]
	}),
}));

export const worldviewMemoryInfluencesRelations = relations(worldviewMemoryInfluences, ({one}) => ({
	worldviewPrimitive: one(worldviewPrimitives, {
		fields: [worldviewMemoryInfluences.worldviewId],
		references: [worldviewPrimitives.id]
	}),
	memory: one(memories, {
		fields: [worldviewMemoryInfluences.memoryId],
		references: [memories.id]
	}),
}));

export const worldviewPrimitivesRelations = relations(worldviewPrimitives, ({many}) => ({
	worldviewMemoryInfluences: many(worldviewMemoryInfluences),
}));

export const memoryChangesRelations = relations(memoryChanges, ({one}) => ({
	memory: one(memories, {
		fields: [memoryChanges.memoryId],
		references: [memories.id]
	}),
}));

export const identityMemoryResonanceRelations = relations(identityMemoryResonance, ({one}) => ({
	memory: one(memories, {
		fields: [identityMemoryResonance.memoryId],
		references: [memories.id]
	}),
	identityModel: one(identityModel, {
		fields: [identityMemoryResonance.identityAspect],
		references: [identityModel.id]
	}),
}));

export const identityModelRelations = relations(identityModel, ({many}) => ({
	identityMemoryResonances: many(identityMemoryResonance),
}));

export const memoryClusterMembersRelations = relations(memoryClusterMembers, ({one}) => ({
	memoryCluster: one(memoryClusters, {
		fields: [memoryClusterMembers.clusterId],
		references: [memoryClusters.id]
	}),
	memory: one(memories, {
		fields: [memoryClusterMembers.memoryId],
		references: [memories.id]
	}),
}));

export const clusterRelationshipsRelations = relations(clusterRelationships, ({one}) => ({
	memoryCluster_fromClusterId: one(memoryClusters, {
		fields: [clusterRelationships.fromClusterId],
		references: [memoryClusters.id],
		relationName: "clusterRelationships_fromClusterId_memoryClusters_id"
	}),
	memoryCluster_toClusterId: one(memoryClusters, {
		fields: [clusterRelationships.toClusterId],
		references: [memoryClusters.id],
		relationName: "clusterRelationships_toClusterId_memoryClusters_id"
	}),
}));