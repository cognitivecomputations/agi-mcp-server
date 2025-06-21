import { eq, and, or, desc, asc, sql, gt, lt, gte, lte, inArray, isNull, isNotNull } from 'drizzle-orm';
import { db, closeConnection } from './db/connection.js';
import * as schema from './db/schema.js';

export class MemoryManager {
  constructor() {
    this.db = db;
  }

  // Close all connections
  async closeAllConnections() {
    try {
      await closeConnection();
    } catch (error) {
      console.warn('Error closing connections:', error.message);
    }
  }

  // Create a new memory
  async createMemory(type, content, embedding, importance = 0.0, metadata = {}) {
    try {
      // Start transaction
      const result = await this.db.transaction(async (tx) => {
        // Insert main memory record
        const [memory] = await tx.insert(schema.memories).values({
          type,
          content,
          embedding: embedding,
          importance,
          decayRate: metadata.decayRate || 0.01
        }).returning();

        // Insert type-specific details
        switch (type) {
          case 'episodic':
            await tx.insert(schema.episodicMemories).values({
              memoryId: memory.id,
              actionTaken: metadata.action_taken || null,
              context: metadata.context || null,
              result: metadata.result || null,
              emotionalValence: metadata.emotional_valence || 0.0,
              eventTime: metadata.event_time || new Date(),
              verificationStatus: metadata.verification_status || null
            });
            break;

          case 'semantic':
            await tx.insert(schema.semanticMemories).values({
              memoryId: memory.id,
              confidence: metadata.confidence || 0.8,
              category: metadata.category || [],
              relatedConcepts: metadata.related_concepts || [],
              sourceReferences: metadata.source_references || null,
              contradictions: metadata.contradictions || null
            });
            break;

          case 'procedural':
            await tx.insert(schema.proceduralMemories).values({
              memoryId: memory.id,
              steps: metadata.steps || {},
              prerequisites: metadata.prerequisites || {},
              successCount: metadata.success_count || 0,
              totalAttempts: metadata.total_attempts || 0,
              failurePoints: metadata.failure_points || null
            });
            break;

          case 'strategic':
            await tx.insert(schema.strategicMemories).values({
              memoryId: memory.id,
              patternDescription: metadata.pattern_description || content,
              confidenceScore: metadata.confidence_score || 0.7,
              supportingEvidence: metadata.supporting_evidence || null,
              successMetrics: metadata.success_metrics || null,
              adaptationHistory: metadata.adaptation_history || null,
              contextApplicability: metadata.context_applicability || null
            });
            break;
        }

        return memory;
      });

      return result;
    } catch (error) {
      console.error('Error creating memory:', error);
      throw error;
    }
  }

  // Search memories by similarity
  async searchMemoriesBySimilarity(queryEmbedding, limit = 10, threshold = 0.7) {
    try {
      const embeddingVector = `[${queryEmbedding.join(',')}]`;
      
      const results = await this.db
        .select({
          id: schema.memories.id,
          type: schema.memories.type,
          content: schema.memories.content,
          importance: schema.memories.importance,
          accessCount: schema.memories.accessCount,
          createdAt: schema.memories.createdAt,
          relevanceScore: schema.memories.relevanceScore,
          similarity: sql`1 - (${schema.memories.embedding} <=> ${embeddingVector}::vector)`.as('similarity')
        })
        .from(schema.memories)
        .where(
          and(
            eq(schema.memories.status, 'active'),
            sql`1 - (${schema.memories.embedding} <=> ${embeddingVector}::vector) >= ${threshold}`
          )
        )
        .orderBy(sql`${schema.memories.embedding} <=> ${embeddingVector}::vector`)
        .limit(limit);

      return results;
    } catch (error) {
      const truncatedEmbedding = queryEmbedding.length > 10 
        ? `[${queryEmbedding.slice(0, 5).join(',')}...${queryEmbedding.slice(-5).join(',')}] (${queryEmbedding.length} values)`
        : `[${queryEmbedding.join(',')}]`;
      console.error('Error searching memories by similarity with embedding:', truncatedEmbedding, error.message);
      throw error;
    }
  }

  // Get memory by ID with type-specific data
  async getMemoryById(memoryId) {
    try {
      const memory = await this.db
        .select()
        .from(schema.memories)
        .where(eq(schema.memories.id, memoryId))
        .limit(1);

      if (!memory.length) return null;

      const baseMemory = memory[0];
      let typeSpecificData = null;

      // Get type-specific data
      switch (baseMemory.type) {
        case 'episodic':
          const episodic = await this.db
            .select()
            .from(schema.episodicMemories)
            .where(eq(schema.episodicMemories.memoryId, memoryId))
            .limit(1);
          typeSpecificData = episodic[0] || null;
          break;

        case 'semantic':
          const semantic = await this.db
            .select()
            .from(schema.semanticMemories)
            .where(eq(schema.semanticMemories.memoryId, memoryId))
            .limit(1);
          typeSpecificData = semantic[0] || null;
          break;

        case 'procedural':
          const procedural = await this.db
            .select()
            .from(schema.proceduralMemories)
            .where(eq(schema.proceduralMemories.memoryId, memoryId))
            .limit(1);
          typeSpecificData = procedural[0] || null;
          break;

        case 'strategic':
          const strategic = await this.db
            .select()
            .from(schema.strategicMemories)
            .where(eq(schema.strategicMemories.memoryId, memoryId))
            .limit(1);
          typeSpecificData = strategic[0] || null;
          break;
      }

      return {
        ...baseMemory,
        type_specific_data: typeSpecificData
      };
    } catch (error) {
      // Handle invalid UUID format gracefully
      if (error.cause && error.cause.message && error.cause.message.includes('invalid input syntax for type uuid')) {
        return null;
      }
      if (error.message && error.message.includes('invalid input syntax for type uuid')) {
        return null;
      }
      console.error('Error getting memory by ID:', error);
      throw error;
    }
  }

  // Access memory (increment access count)
  async accessMemory(memoryId) {
    try {
      await this.db
        .update(schema.memories)
        .set({
          accessCount: sql`${schema.memories.accessCount} + 1`,
          lastAccessed: new Date()
        })
        .where(eq(schema.memories.id, memoryId));

      return await this.getMemoryById(memoryId);
    } catch (error) {
      console.error('Error accessing memory:', error);
      throw error;
    }
  }

  // Create memory cluster
  async createMemoryCluster(name, clusterType, description, keywords = []) {
    try {
      const defaultEmbedding = new Array(1536).fill(0.0);
      
      const [cluster] = await this.db
        .insert(schema.memoryClusters)
        .values({
          name,
          clusterType,
          description,
          keywords,
          centroidEmbedding: defaultEmbedding,
          importanceScore: 0.0
        })
        .returning();

      return cluster;
    } catch (error) {
      console.error('Error creating memory cluster:', error);
      throw error;
    }
  }

  // Get memory clusters
  async getMemoryClusters(limit = 20) {
    try {
      const clusters = await this.db
        .select({
          id: schema.memoryClusters.id,
          name: schema.memoryClusters.name,
          clusterType: schema.memoryClusters.clusterType,
          description: schema.memoryClusters.description,
          keywords: schema.memoryClusters.keywords,
          importanceScore: schema.memoryClusters.importanceScore,
          activationCount: schema.memoryClusters.activationCount,
          lastActivated: schema.memoryClusters.lastActivated,
          createdAt: schema.memoryClusters.createdAt,
          memoryCount: sql`COALESCE(count(${schema.memoryClusterMembers.memoryId}) FILTER (WHERE ${schema.memoryClusterMembers.memoryId} IS NOT NULL), 0)`.as('memory_count'),
          memoryIds: sql`COALESCE(array_agg(${schema.memoryClusterMembers.memoryId}) FILTER (WHERE ${schema.memoryClusterMembers.memoryId} IS NOT NULL), ARRAY[]::uuid[])`.as('memory_ids')
        })
        .from(schema.memoryClusters)
        .leftJoin(
          schema.memoryClusterMembers,
          eq(schema.memoryClusters.id, schema.memoryClusterMembers.clusterId)
        )
        .groupBy(schema.memoryClusters.id)
        .orderBy(
          desc(schema.memoryClusters.createdAt),
          desc(schema.memoryClusters.importanceScore)
        )
        .limit(limit);

      return clusters;
    } catch (error) {
      console.error('Error getting memory clusters:', error);
      throw error;
    }
  }

  // Get cluster memories
  async getClusterMemories(clusterId, limit = 10) {
    try {
      const memories = await this.db
        .select({
          id: schema.memories.id,
          type: schema.memories.type,
          content: schema.memories.content,
          importance: schema.memories.importance,
          accessCount: schema.memories.accessCount,
          createdAt: schema.memories.createdAt,
          relevanceScore: schema.memories.relevanceScore,
          membershipStrength: schema.memoryClusterMembers.membershipStrength
        })
        .from(schema.memories)
        .innerJoin(
          schema.memoryClusterMembers,
          eq(schema.memories.id, schema.memoryClusterMembers.memoryId)
        )
        .where(
          and(
            eq(schema.memoryClusterMembers.clusterId, clusterId),
            eq(schema.memories.status, 'active')
          )
        )
        .orderBy(
          desc(schema.memoryClusterMembers.membershipStrength),
          desc(schema.memories.relevanceScore)
        )
        .limit(limit);

      return memories;
    } catch (error) {
      console.error('Error getting cluster memories:', error);
      throw error;
    }
  }

  // Activate cluster
  async activateCluster(clusterId, context = null) {
    try {
      const result = await this.db.transaction(async (tx) => {
        // Update cluster activation
        await tx
          .update(schema.memoryClusters)
          .set({
            activationCount: sql`${schema.memoryClusters.activationCount} + 1`,
            lastActivated: new Date()
          })
          .where(eq(schema.memoryClusters.id, clusterId));

        // Record activation history
        await tx.insert(schema.clusterActivationHistory).values({
          clusterId,
          activationContext: context,
          activationStrength: 1.0
        });

        return true;
      });

      // Return cluster with recent memories
      return await this.getClusterMemories(clusterId);
    } catch (error) {
      console.error('Error activating cluster:', error);
      throw error;
    }
  }

  // Search memories by text
  async searchMemoriesByText(query, limit = 10) {
    try {
      const results = await this.db
        .select({
          id: schema.memories.id,
          type: schema.memories.type,
          content: schema.memories.content,
          importance: schema.memories.importance,
          accessCount: schema.memories.accessCount,
          createdAt: schema.memories.createdAt,
          relevanceScore: schema.memories.relevanceScore,
          textRank: sql`ts_rank(to_tsvector('english', ${schema.memories.content}), plainto_tsquery('english', ${query}))`.as('text_rank')
        })
        .from(schema.memories)
        .where(
          and(
            eq(schema.memories.status, 'active'),
            sql`to_tsvector('english', ${schema.memories.content}) @@ plainto_tsquery('english', ${query})`
          )
        )
        .orderBy(
          sql`ts_rank(to_tsvector('english', ${schema.memories.content}), plainto_tsquery('english', ${query})) DESC`,
          desc(schema.memories.relevanceScore)
        )
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Error searching memories by text:', error);
      throw error;
    }
  }

  // Get identity core
  async getIdentityCore() {
    try {
      const identity = await this.db
        .select()
        .from(schema.identityModel)
        .orderBy(desc(schema.identityModel.id))
        .limit(1);

      return identity[0] || null;
    } catch (error) {
      console.error('Error getting identity core:', error);
      throw error;
    }
  }

  // Get worldview primitives
  async getWorldviewPrimitives() {
    try {
      const primitives = await this.db
        .select()
        .from(schema.worldviewPrimitives)
        .orderBy(
          desc(schema.worldviewPrimitives.confidence),
          desc(schema.worldviewPrimitives.stabilityScore)
        );

      return primitives;
    } catch (error) {
      console.error('Error getting worldview primitives:', error);
      throw error;
    }
  }

  // Get memory health
  async getMemoryHealth() {
    try {
      const health = await this.db
        .select()
        .from(schema.memoryHealth);

      return health;
    } catch (error) {
      console.error('Error getting memory health:', error);
      throw error;
    }
  }

  // Get active themes
  async getActiveThemes(days = 7) {
    try {
      const themes = await this.db
        .select()
        .from(schema.activeThemes);

      return themes;
    } catch (error) {
      console.error('Error getting active themes:', error);
      throw error;
    }
  }

  // Create working memory
  async createWorkingMemory(content, embedding, context = {}) {
    try {
      const ttl = context.ttl || 3600; // Default 1 hour
      const expirationTime = new Date(Date.now() + ttl * 1000);

      const [workingMemory] = await this.db
        .insert(schema.workingMemory)
        .values({
          content,
          embedding: embedding,
          expiry: expirationTime
        })
        .returning();

      return workingMemory;
    } catch (error) {
      console.error('Error creating working memory:', error);
      throw error;
    }
  }

  // Get working memories
  async getWorkingMemories(includeExpired = false) {
    try {
      let query = this.db.select().from(schema.workingMemory);

      if (!includeExpired) {
        query = query.where(
          or(
            isNull(schema.workingMemory.expiry),
            gt(schema.workingMemory.expiry, new Date())
          )
        );
      }

      const results = await query.orderBy(desc(schema.workingMemory.createdAt));
      return results;
    } catch (error) {
      console.error('Error getting working memories:', error);
      throw error;
    }
  }

  // Cleanup expired working memory
  async cleanupExpiredWorkingMemory() {
    try {
      const expired = await this.db
        .delete(schema.workingMemory)
        .where(
          and(
            isNotNull(schema.workingMemory.expiry),
            lte(schema.workingMemory.expiry, new Date())
          )
        )
        .returning();

      return expired;
    } catch (error) {
      console.error('Error cleaning up expired working memory:', error);
      throw error;
    }
  }

  // Advanced search
  async searchMemoriesAdvanced(criteria) {
    try {
      const {
        textQuery,
        embedding,
        memoryTypes = [],
        importanceRange = [0, 1],
        dateRange = {},
        limit = 10
      } = criteria;

      let query = this.db
        .select({
          id: schema.memories.id,
          type: schema.memories.type,
          content: schema.memories.content,
          importance: schema.memories.importance,
          accessCount: schema.memories.accessCount,
          createdAt: schema.memories.createdAt,
          relevanceScore: schema.memories.relevanceScore,
          textRank: textQuery 
            ? sql`ts_rank(to_tsvector('english', ${schema.memories.content}), plainto_tsquery('english', ${textQuery}))`.as('text_rank')
            : sql`0`.as('text_rank'),
          similarityScore: embedding
            ? sql`1 - (${schema.memories.embedding} <=> ${`[${embedding.join(',')}]`}::vector)`.as('similarity_score')
            : sql`0`.as('similarity_score')
        })
        .from(schema.memories);

      // Build where conditions
      const conditions = [eq(schema.memories.status, 'active')];

      if (textQuery) {
        conditions.push(
          sql`to_tsvector('english', ${schema.memories.content}) @@ plainto_tsquery('english', ${textQuery})`
        );
      }

      if (memoryTypes.length > 0) {
        conditions.push(inArray(schema.memories.type, memoryTypes));
      }

      conditions.push(
        and(
          gte(schema.memories.importance, importanceRange[0]),
          lte(schema.memories.importance, importanceRange[1])
        )
      );

      if (dateRange.start) {
        conditions.push(gte(schema.memories.createdAt, dateRange.start));
      }

      if (dateRange.end) {
        conditions.push(lte(schema.memories.createdAt, dateRange.end));
      }

      query = query.where(and(...conditions));

      // Order by relevance
      if (textQuery && embedding) {
        query = query.orderBy(
          sql`ts_rank(to_tsvector('english', ${schema.memories.content}), plainto_tsquery('english', ${textQuery})) DESC`,
          sql`1 - (${schema.memories.embedding} <=> ${`[${embedding.join(',')}]`}::vector) DESC`,
          desc(schema.memories.importance)
        );
      } else if (textQuery) {
        query = query.orderBy(
          sql`ts_rank(to_tsvector('english', ${schema.memories.content}), plainto_tsquery('english', ${textQuery})) DESC`,
          desc(schema.memories.importance)
        );
      } else if (embedding) {
        query = query.orderBy(
          sql`1 - (${schema.memories.embedding} <=> ${`[${embedding.join(',')}]`}::vector) DESC`,
          desc(schema.memories.importance)
        );
      } else {
        query = query.orderBy(desc(schema.memories.importance));
      }

      const results = await query.limit(limit);
      return results;
    } catch (error) {
      const truncatedEmbedding = embedding && embedding.length > 10 
        ? `[${embedding.slice(0, 5).join(',')}...${embedding.slice(-5).join(',')}] (${embedding.length} values)`
        : embedding ? `[${embedding.join(',')}]` : 'none';
      console.error('Error in advanced search with embedding:', truncatedEmbedding, 'textQuery:', textQuery, error.message);
      throw error;
    }
  }

  // ===== MISSING METHODS FROM ORIGINAL MEMORY MANAGER =====

  // Assign memory to clusters (database function)
  async assignMemoryToClusters(memoryId) {
    try {
      await this.db.execute(sql`SELECT assign_memory_to_clusters(${memoryId})`);
    } catch (error) {
      console.warn('assign_memory_to_clusters function not available:', error.message);
    }
  }

  // Memory relationship management
  async createMemoryRelationship(fromMemoryId, toMemoryId, relationshipType, properties = {}) {
    try {
      const [relationship] = await this.db
        .insert(schema.memoryRelationships)
        .values({
          fromMemoryId,
          toMemoryId,
          relationshipType,
          properties
        })
        .returning();
      
      return relationship;
    } catch (error) {
      console.warn('Memory relationships table not available:', error.message);
      return null;
    }
  }

  async getMemoryRelationships(memoryId, direction = 'both', relationshipType = null) {
    try {
      let query = this.db
        .select({
          id: schema.memoryRelationships.id,
          fromMemoryId: schema.memoryRelationships.fromMemoryId,
          toMemoryId: schema.memoryRelationships.toMemoryId,
          relationshipType: schema.memoryRelationships.relationshipType,
          strength: schema.memoryRelationships.strength,
          properties: schema.memoryRelationships.properties,
          createdAt: schema.memoryRelationships.createdAt,
          direction: sql`CASE 
            WHEN ${schema.memoryRelationships.fromMemoryId} = ${memoryId} THEN 'outgoing'
            ELSE 'incoming'
          END`.as('direction'),
          relatedMemoryId: sql`CASE 
            WHEN ${schema.memoryRelationships.fromMemoryId} = ${memoryId} THEN ${schema.memoryRelationships.toMemoryId}
            ELSE ${schema.memoryRelationships.fromMemoryId}
          END`.as('related_memory_id')
        })
        .from(schema.memoryRelationships);

      if (direction === 'outgoing') {
        query = query.where(eq(schema.memoryRelationships.fromMemoryId, memoryId));
      } else if (direction === 'incoming') {
        query = query.where(eq(schema.memoryRelationships.toMemoryId, memoryId));
      } else {
        query = query.where(
          or(
            eq(schema.memoryRelationships.fromMemoryId, memoryId),
            eq(schema.memoryRelationships.toMemoryId, memoryId)
          )
        );
      }

      if (relationshipType) {
        query = query.where(eq(schema.memoryRelationships.relationshipType, relationshipType));
      }

      const results = await query
        .orderBy(desc(schema.memoryRelationships.strength), desc(schema.memoryRelationships.createdAt));
      
      return results;
    } catch (error) {
      console.warn('Memory relationships query failed:', error.message);
      return [];
    }
  }

  async findRelatedMemories(memoryId, maxDepth = 2, minStrength = 0.3) {
    try {
      // Use recursive CTE to find related memories up to maxDepth
      const results = await this.db.execute(sql`
        WITH RECURSIVE memory_graph AS (
          -- Base case: direct relationships
          SELECT 
            mr.to_memory_id as memory_id,
            mr.relationship_type,
            mr.strength,
            1 as depth,
            ARRAY[mr.from_memory_id] as path
          FROM memory_relationships mr
          WHERE mr.from_memory_id = ${memoryId} AND mr.strength >= ${minStrength}
          
          UNION ALL
          
          -- Recursive case: follow relationships
          SELECT 
            mr.to_memory_id as memory_id,
            mr.relationship_type,
            mr.strength * mg.strength as strength,
            mg.depth + 1,
            mg.path || mr.from_memory_id
          FROM memory_relationships mr
          JOIN memory_graph mg ON mr.from_memory_id = mg.memory_id
          WHERE mg.depth < ${maxDepth}
            AND mr.strength >= ${minStrength}
            AND NOT (mr.to_memory_id = ANY(mg.path))
        )
        SELECT 
          mg.*,
          m.content,
          m.type,
          m.importance
        FROM memory_graph mg
        JOIN memories m ON mg.memory_id = m.id
        WHERE m.status = 'active'
        ORDER BY mg.strength DESC, mg.depth ASC
      `);
      
      return results.rows || [];
    } catch (error) {
      console.warn('Related memories query failed:', error.message);
      return [];
    }
  }

  // Memory lifecycle management
  async consolidateWorkingMemory(workingMemoryIds, consolidatedContent, consolidatedEmbedding) {
    try {
      const result = await this.db.transaction(async (tx) => {
        // Create consolidated memory
        const [consolidatedMemory] = await tx
          .insert(schema.memories)
          .values({
            type: 'semantic',
            content: consolidatedContent,
            embedding: consolidatedEmbedding,
            importance: 0.8,
            status: 'active'
          })
          .returning();

        const consolidatedId = consolidatedMemory.id;

        // Create relationships from working memories to consolidated memory
        for (const workingId of workingMemoryIds) {
          await tx.insert(schema.memoryRelationships).values({
            fromMemoryId: workingId,
            toMemoryId: consolidatedId,
            relationshipType: 'consolidation',
            strength: 1.0
          });

          // Mark working memory as consolidated
          await tx
            .update(schema.memories)
            .set({ status: 'consolidated' })
            .where(eq(schema.memories.id, workingId));
        }

        // Record consolidation event
        await tx.insert(schema.memoryChanges).values({
          memoryId: consolidatedId,
          changeType: 'consolidation',
          newValue: { source_memories: workingMemoryIds }
        });

        return consolidatedMemory;
      });

      return result;
    } catch (error) {
      console.warn('Memory consolidation failed:', error.message);
      throw error;
    }
  }

  async archiveOldMemories(daysOld = 365, importanceThreshold = 0.3) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      
      const archivedMemories = await this.db
        .update(schema.memories)
        .set({ status: 'archived' })
        .where(
          and(
            eq(schema.memories.status, 'active'),
            lt(schema.memories.createdAt, cutoffDate),
            lt(schema.memories.importance, importanceThreshold),
            lt(schema.memories.accessCount, 5)
          )
        )
        .returning({
          id: schema.memories.id,
          content: schema.memories.content,
          type: schema.memories.type
        });

      // Record archival events
      for (const memory of archivedMemories) {
        await this.db.insert(schema.memoryChanges).values({
          memoryId: memory.id,
          changeType: 'archival',
          newValue: { reason: 'Archived due to age and low importance' }
        });
      }

      return archivedMemories;
    } catch (error) {
      console.warn('Memory archival failed:', error.message);
      return [];
    }
  }

  async pruneMemories(criteria = {}) {
    try {
      const {
        maxAge = 1095, // 3 years
        minImportance = 0.1,
        maxAccessCount = 2,
        status = 'archived'
      } = criteria;

      const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);

      const prunedMemories = await this.db
        .update(schema.memories)
        .set({ status: 'deleted' })
        .where(
          and(
            eq(schema.memories.status, status),
            lt(schema.memories.createdAt, cutoffDate),
            lt(schema.memories.importance, minImportance),
            lte(schema.memories.accessCount, maxAccessCount)
          )
        )
        .returning({
          id: schema.memories.id,
          content: schema.memories.content,
          type: schema.memories.type
        });

      // Record deletion events
      for (const memory of prunedMemories) {
        await this.db.insert(schema.memoryChanges).values({
          memoryId: memory.id,
          changeType: 'deletion',
          newValue: { reason: 'Pruned based on criteria', criteria }
        });
      }

      return prunedMemories;
    } catch (error) {
      console.warn('Memory pruning failed:', error.message);
      return [];
    }
  }

  // Enhanced clustering
  async recalculateClusterCentroid(clusterId) {
    try {
      await this.db.execute(sql`SELECT recalculate_cluster_centroid(${clusterId})`);
      return true;
    } catch (error) {
      console.warn('Cluster centroid recalculation failed:', error.message);
      return false;
    }
  }

  async getClusterInsights(clusterId) {
    try {
      const insights = await this.db
        .select({
          id: schema.memoryClusters.id,
          name: schema.memoryClusters.name,
          clusterType: schema.memoryClusters.clusterType,
          description: schema.memoryClusters.description,
          importanceScore: schema.memoryClusters.importanceScore,
          totalMemories: sql`COUNT(${schema.memoryClusterMembers.memoryId})`.as('total_memories'),
          avgImportance: sql`AVG(${schema.memories.importance})`.as('avg_importance'),
          lastMemoryAccess: sql`MAX(${schema.memories.lastAccessed})`.as('last_memory_access'),
          recentMemories: sql`COUNT(CASE WHEN ${schema.memories.createdAt} > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END)`.as('recent_memories'),
          avgMembershipStrength: sql`AVG(${schema.memoryClusterMembers.membershipStrength})`.as('avg_membership_strength'),
          memoryTypes: sql`array_agg(DISTINCT ${schema.memories.type})`.as('memory_types')
        })
        .from(schema.memoryClusters)
        .leftJoin(
          schema.memoryClusterMembers,
          eq(schema.memoryClusters.id, schema.memoryClusterMembers.clusterId)
        )
        .leftJoin(
          schema.memories,
          and(
            eq(schema.memoryClusterMembers.memoryId, schema.memories.id),
            eq(schema.memories.status, 'active')
          )
        )
        .where(eq(schema.memoryClusters.id, clusterId))
        .groupBy(schema.memoryClusters.id)
        .limit(1);

      return insights[0] || null;
    } catch (error) {
      console.warn('Cluster insights query failed:', error.message);
      return null;
    }
  }

  async findSimilarClusters(clusterId, threshold = 0.7) {
    try {
      const embeddingVector = `[${Array(1536).fill(0).join(',')}]`;
      
      const results = await this.db.execute(sql`
        SELECT 
          mc2.*,
          1 - (mc1.centroid_embedding <=> mc2.centroid_embedding) as similarity
        FROM memory_clusters mc1
        CROSS JOIN memory_clusters mc2
        WHERE mc1.id = ${clusterId}
          AND mc2.id != ${clusterId}
          AND 1 - (mc1.centroid_embedding <=> mc2.centroid_embedding) >= ${threshold}
        ORDER BY similarity DESC
      `);
      
      return results.rows || [];
    } catch (error) {
      console.warn('Similar clusters query failed:', error.message);
      return [];
    }
  }

  // Memory change tracking
  async getMemoryHistory(memoryId) {
    try {
      const history = await this.db
        .select()
        .from(schema.memoryChanges)
        .where(eq(schema.memoryChanges.memoryId, memoryId))
        .orderBy(desc(schema.memoryChanges.changedAt));

      return history;
    } catch (error) {
      console.warn('Memory history query failed:', error.message);
      return [];
    }
  }

  async trackMemoryChange(memoryId, changeType, description, metadata = {}) {
    try {
      const [change] = await this.db
        .insert(schema.memoryChanges)
        .values({
          memoryId,
          changeType,
          newValue: { description, metadata }
        })
        .returning();

      return change;
    } catch (error) {
      console.warn('Memory change tracking failed:', error.message);
      return null;
    }
  }
}
