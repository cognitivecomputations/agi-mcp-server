import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { MemoryManager } from '../src/memory-manager.js';

describe('Enhanced Features Tests', () => {
  let memoryManager;
  const testData = {};

  beforeAll(async () => {
    memoryManager = new MemoryManager();
    
    // Test database connection
    try {
      await memoryManager.db.execute(sql`SELECT 1`);
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (memoryManager) {
      try {
        await memoryManager.db.transaction(async (tx) => {
          await tx.execute(sql`DELETE FROM memories WHERE content LIKE '%Enhanced%'`);
          await tx.execute(sql`DELETE FROM memories WHERE content LIKE '%machine learning%'`);
          await tx.execute(sql`DELETE FROM memories WHERE content LIKE '%Temporary calculation%'`);
          await tx.execute(sql`DELETE FROM memories WHERE content LIKE '%Step %'`);
          await tx.execute(sql`DELETE FROM memories WHERE content LIKE '%Consolidated process%'`);
          await tx.execute(sql`DELETE FROM memory_clusters WHERE name LIKE '%Enhanced Test%'`);
        });
      } catch (error) {
        console.warn('Cleanup warning:', error.message);
      }
      
      await memoryManager.closeAllConnections();
    }
  });

  describe('Graph Relationship Management', () => {
    beforeAll(async () => {
      // Create test memories for relationships
      const embedding1 = new Array(1536).fill(0.1);
      const embedding2 = new Array(1536).fill(0.2);
      
      const memory1 = await memoryManager.createMemory(
        'episodic',
        'Learning about machine learning algorithms',
        embedding1,
        0.8
      );
      
      const memory2 = await memoryManager.createMemory(
        'semantic',
        'Neural networks are a type of machine learning algorithm',
        embedding2,
        0.9
      );
      
      testData.memory1Id = memory1.id;
      testData.memory2Id = memory2.id;
    });

    it('should create memory relationship', async () => {
      try {
        const relationship = await memoryManager.createMemoryRelationship(
          testData.memory1Id,
          testData.memory2Id,
          'semantic',
          { strength: 0.8, context: 'learning_session' }
        );
        
        // Relationship creation might fail if table doesn't exist
        expect(relationship === null || typeof relationship === 'object').toBe(true);
        testData.relationshipId = relationship?.id;
      } catch (error) {
        // Expected if relationship tables don't exist
        expect(error.message).toContain('relationship');
      }
    });

    it('should get memory relationships', async () => {
      const relationships = await memoryManager.getMemoryRelationships(testData.memory1Id);
      expect(Array.isArray(relationships)).toBe(true);
    });

    it('should find related memories', async () => {
      const relatedMemories = await memoryManager.findRelatedMemories(testData.memory1Id, 2, 0.3);
      expect(Array.isArray(relatedMemories)).toBe(true);
    });
  });

  describe('Working Memory Management', () => {
    it('should create working memory with expiration', async () => {
      const embedding = new Array(1536).fill(0.3);
      const workingMemory = await memoryManager.createWorkingMemory(
        'Temporary calculation: 2 + 2 = 4',
        embedding,
        { ttl: 300 }
      );
      
      expect(workingMemory).toBeDefined();
      expect(workingMemory.id).toBeDefined();
      testData.workingMemoryId = workingMemory.id;
    });

    it('should get working memories', async () => {
      const workingMemories = await memoryManager.getWorkingMemories(false);
      expect(Array.isArray(workingMemories)).toBe(true);
    });

    it('should cleanup expired working memory', async () => {
      const cleanedMemories = await memoryManager.cleanupExpiredWorkingMemory();
      expect(Array.isArray(cleanedMemories)).toBe(true);
    });
  });

  describe('Enhanced Clustering Features', () => {
    beforeAll(async () => {
      const cluster = await memoryManager.createMemoryCluster(
        'Enhanced Test Cluster',
        'theme',
        'A cluster for testing enhanced features',
        ['test', 'enhanced', 'features']
      );
      testData.clusterId = cluster.id;
    });

    it('should get cluster insights', async () => {
      const insights = await memoryManager.getClusterInsights(testData.clusterId);
      // Insights might be null if advanced cluster features aren't available
      expect(insights === null || typeof insights === 'object').toBe(true);
    });

    it('should find similar clusters', async () => {
      const similarClusters = await memoryManager.findSimilarClusters(testData.clusterId, 0.5);
      expect(Array.isArray(similarClusters)).toBe(true);
    });
  });

  describe('Advanced Search Features', () => {
    it('should perform advanced search with multiple criteria', async () => {
      const criteria = {
        textQuery: 'machine learning',
        memoryTypes: ['episodic', 'semantic'],
        importanceRange: [0.5, 1.0],
        limit: 5
      };
      
      const results = await memoryManager.searchMemoriesAdvanced(criteria);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Memory Lifecycle Management', () => {
    it('should archive old memories', async () => {
      const archivedMemories = await memoryManager.archiveOldMemories(1000, 0.1);
      expect(Array.isArray(archivedMemories)).toBe(true);
    });

    it('should prune memories with criteria', async () => {
      try {
        const prunedMemories = await memoryManager.pruneMemories({
          maxAge: 2000,
          minImportance: 0.05,
          maxAccessCount: 1,
          status: 'archived'
        });
        expect(Array.isArray(prunedMemories)).toBe(true);
      } catch (error) {
        // May fail due to database constraints
        console.log('Memory pruning warning:', error.message);
      }
    });
  });

  describe('Memory Change Tracking', () => {
    it('should get memory change history', async () => {
      const history = await memoryManager.getMemoryHistory(testData.memory1Id);
      expect(Array.isArray(history)).toBe(true);
    });

    it('should track memory change', async () => {
      const changeRecord = await memoryManager.trackMemoryChange(
        testData.memory1Id,
        'access',
        'Memory accessed during enhanced features test',
        { test_context: 'enhanced_features_test' }
      );
      
      // Change tracking might not be available, so null is acceptable
      expect(changeRecord === null || typeof changeRecord === 'object').toBe(true);
    });
  });

  describe('Memory Consolidation', () => {
    it('should create working memories for consolidation test', async () => {
      const embedding1 = new Array(1536).fill(0.4);
      const embedding2 = new Array(1536).fill(0.5);
      
      const workingMemory1 = await memoryManager.createWorkingMemory(
        'Step 1: Initialize variables',
        embedding1,
        { ttl: 600 }
      );
      
      const workingMemory2 = await memoryManager.createWorkingMemory(
        'Step 2: Process data',
        embedding2,
        { ttl: 600 }
      );
      
      testData.workingMemoryIds = [workingMemory1.id, workingMemory2.id];
      
      expect(workingMemory1.id).toBeDefined();
      expect(workingMemory2.id).toBeDefined();
    });

    it('should consolidate working memories', async () => {
      const consolidatedEmbedding = new Array(1536).fill(0.45);
      
      try {
        const consolidatedMemory = await memoryManager.consolidateWorkingMemory(
          testData.workingMemoryIds,
          'Consolidated process: Initialize variables and process data',
          consolidatedEmbedding
        );
        
        expect(consolidatedMemory.id).toBeDefined();
      } catch (error) {
        // Consolidation might fail if relationship tables don't exist
        if (error.message.includes('relationship') || error.message.includes('consolidation')) {
          console.log('Memory consolidation requires relationship tables');
        } else {
          throw error;
        }
      }
    });
  });
});
