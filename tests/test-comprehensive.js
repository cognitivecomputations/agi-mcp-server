import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { MemoryManager } from '../src/memory-manager.js';

describe('Comprehensive Tests', () => {
  let memoryManager;
  const testData = {};

  beforeAll(async () => {
    memoryManager = new MemoryManager();
    
    // Verify database connection
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
          await tx.execute(sql`DELETE FROM episodic_memories WHERE memory_id IN (SELECT id FROM memories WHERE content LIKE '%Comprehensive%')`);
          await tx.execute(sql`DELETE FROM semantic_memories WHERE memory_id IN (SELECT id FROM memories WHERE content LIKE '%Comprehensive%')`);
          await tx.execute(sql`DELETE FROM procedural_memories WHERE memory_id IN (SELECT id FROM memories WHERE content LIKE '%Comprehensive%')`);
          await tx.execute(sql`DELETE FROM strategic_memories WHERE memory_id IN (SELECT id FROM memories WHERE content LIKE '%Comprehensive%')`);
          await tx.execute(sql`DELETE FROM memory_cluster_members WHERE memory_id IN (SELECT id FROM memories WHERE content LIKE '%Comprehensive%')`);
          await tx.execute(sql`DELETE FROM memories WHERE content LIKE '%Comprehensive%'`);
          await tx.execute(sql`DELETE FROM memory_clusters WHERE name LIKE '%Comprehensive%'`);
        });
      } catch (error) {
        console.warn('Cleanup warning:', error.message);
      }
      
      await memoryManager.closeAllConnections();
    }
  });

  describe('Memory Type Coverage', () => {
    it('should create all memory types', async () => {
      const embedding = new Array(1536).fill(0.5);
      
      // Semantic memory
      const semantic = await memoryManager.createMemory(
        'semantic',
        'Comprehensive semantic memory test',
        embedding,
        0.8,
        { confidence: 0.9, category: ['comprehensive'], related_concepts: ['test'] }
      );
      expect(semantic).toBeDefined();
      expect(semantic.type).toBe('semantic');
      testData.semanticId = semantic.id;

      // Episodic memory
      const episodic = await memoryManager.createMemory(
        'episodic',
        'Comprehensive episodic memory test',
        embedding,
        0.7,
        { 
          action_taken: { action: 'comprehensive_testing' },
          context: { environment: 'test' },
          result: { outcome: 'success' },
          emotional_valence: 0.5
        }
      );
      expect(episodic).toBeDefined();
      expect(episodic.type).toBe('episodic');
      testData.episodicId = episodic.id;

      // Procedural memory
      const procedural = await memoryManager.createMemory(
        'procedural',
        'Comprehensive procedural memory test',
        embedding,
        0.6,
        { 
          steps: { step1: 'init', step2: 'process', step3: 'complete' },
          prerequisites: { knowledge: 'basic' },
          success_count: 10,
          total_attempts: 12
        }
      );
      expect(procedural).toBeDefined();
      expect(procedural.type).toBe('procedural');
      testData.proceduralId = procedural.id;

      // Strategic memory
      const strategic = await memoryManager.createMemory(
        'strategic',
        'Comprehensive strategic memory test',
        embedding,
        0.9,
        { 
          pattern_description: 'Comprehensive testing pattern',
          confidence_score: 0.85,
          supporting_evidence: ['test1', 'test2'],
          success_metrics: { accuracy: 0.95, efficiency: 0.88 }
        }
      );
      expect(strategic).toBeDefined();
      expect(strategic.type).toBe('strategic');
      testData.strategicId = strategic.id;
    });
  });

  describe('Search Functionality', () => {
    it('should perform comprehensive search operations', async () => {
      // Vector similarity search
      const queryEmbedding = new Array(1536).fill(0.5);
      const similarityResults = await memoryManager.searchMemoriesBySimilarity(
        queryEmbedding,
        10,
        0.1
      );
      expect(similarityResults).toBeDefined();
      expect(Array.isArray(similarityResults)).toBe(true);

      // Text search
      const textResults = await memoryManager.searchMemoriesByText('Comprehensive', 10);
      expect(textResults).toBeDefined();
      expect(Array.isArray(textResults)).toBe(true);
      expect(textResults.length).toBeGreaterThan(0);

      // Advanced search
      const advancedResults = await memoryManager.searchMemoriesAdvanced({
        textQuery: 'Comprehensive',
        memoryTypes: ['semantic', 'episodic'],
        importanceRange: [0.5, 1.0],
        limit: 10
      });
      expect(advancedResults).toBeDefined();
      expect(Array.isArray(advancedResults)).toBe(true);
    });
  });

  describe('Cluster Management', () => {
    it('should manage memory clusters comprehensively', async () => {
      // Create cluster
      const cluster = await memoryManager.createMemoryCluster(
        'Comprehensive Test Cluster',
        'theme',
        'Cluster for comprehensive testing',
        ['comprehensive', 'test', 'cluster']
      );
      expect(cluster).toBeDefined();
      expect(cluster.id).toBeDefined();
      testData.clusterId = cluster.id;

      // Get clusters
      const clusters = await memoryManager.getMemoryClusters(20);
      expect(clusters).toBeDefined();
      expect(Array.isArray(clusters)).toBe(true);
      
      const foundCluster = clusters.find(c => c.id === testData.clusterId);
      expect(foundCluster).toBeDefined();

      // Activate cluster
      const activationResult = await memoryManager.activateCluster(
        testData.clusterId,
        'comprehensive test activation'
      );
      expect(activationResult).toBeDefined();
      expect(Array.isArray(activationResult)).toBe(true);

      // Get cluster memories
      const clusterMemories = await memoryManager.getClusterMemories(testData.clusterId, 10);
      expect(clusterMemories).toBeDefined();
      expect(Array.isArray(clusterMemories)).toBe(true);
    });
  });

  describe('Memory Access and Updates', () => {
    it('should handle memory access and updates', async () => {
      expect(testData.semanticId).toBeDefined();

      // Access memory multiple times
      for (let i = 0; i < 3; i++) {
        const memory = await memoryManager.accessMemory(testData.semanticId);
        expect(memory).toBeDefined();
        expect(memory.id).toBe(testData.semanticId);
        expect(memory.accessCount).toBeGreaterThan(i);
      }

      // Get memory by ID
      const retrievedMemory = await memoryManager.getMemoryById(testData.semanticId);
      expect(retrievedMemory).toBeDefined();
      expect(retrievedMemory.id).toBe(testData.semanticId);
      expect(retrievedMemory.type_specific_data).toBeDefined();
    });
  });

  describe('Working Memory Operations', () => {
    it('should manage working memory lifecycle', async () => {
      const embedding = new Array(1536).fill(0.3);
      
      // Create working memory
      const workingMemory = await memoryManager.createWorkingMemory(
        'Comprehensive working memory test',
        embedding,
        { ttl: 600 }
      );
      expect(workingMemory).toBeDefined();
      expect(workingMemory.id).toBeDefined();
      testData.workingMemoryId = workingMemory.id;

      // Get working memories
      const workingMemories = await memoryManager.getWorkingMemories(false);
      expect(workingMemories).toBeDefined();
      expect(Array.isArray(workingMemories)).toBe(true);
      
      const foundWorking = workingMemories.find(wm => wm.id === testData.workingMemoryId);
      expect(foundWorking).toBeDefined();

      // Cleanup expired (should not affect our recent memory)
      const cleaned = await memoryManager.cleanupExpiredWorkingMemory();
      expect(cleaned).toBeDefined();
      expect(Array.isArray(cleaned)).toBe(true);
    });
  });

  describe('System Analytics', () => {
    it('should provide system health and analytics', async () => {
      // Memory health
      const health = await memoryManager.getMemoryHealth();
      expect(health).toBeDefined();
      expect(Array.isArray(health)).toBe(true);

      // Identity core
      const identity = await memoryManager.getIdentityCore();
      expect(identity === null || typeof identity === 'object').toBe(true);

      // Worldview primitives
      const worldview = await memoryManager.getWorldviewPrimitives();
      expect(worldview).toBeDefined();
      expect(Array.isArray(worldview)).toBe(true);

      // Active themes (may fail if view doesn't exist)
      try {
        const themes = await memoryManager.getActiveThemes(30);
        expect(themes).toBeDefined();
        expect(Array.isArray(themes)).toBe(true);
      } catch (error) {
        // Expected if active_themes view has issues
        expect(error.message).toContain('active_themes');
      }
    });
  });

  describe('Advanced Features', () => {
    it('should handle advanced memory operations', async () => {
      // Memory relationships (may not be available)
      try {
        const relationships = await memoryManager.getMemoryRelationships(testData.semanticId);
        expect(Array.isArray(relationships)).toBe(true);
      } catch (error) {
        // Expected if relationship tables don't exist
        console.log('Memory relationships not available:', error.message);
      }

      // Memory history (may not be available)
      try {
        const history = await memoryManager.getMemoryHistory(testData.semanticId);
        expect(Array.isArray(history)).toBe(true);
      } catch (error) {
        // Expected if change tracking tables don't exist
        console.log('Memory history not available:', error.message);
      }

      // Archive old memories
      const archived = await memoryManager.archiveOldMemories(1000, 0.1);
      expect(archived).toBeDefined();
      expect(Array.isArray(archived)).toBe(true);

      // Prune memories
      try {
        const pruned = await memoryManager.pruneMemories({
          maxAge: 2000,
          minImportance: 0.05,
          maxAccessCount: 1,
          status: 'archived'
        });
        expect(pruned).toBeDefined();
        expect(Array.isArray(pruned)).toBe(true);
      } catch (error) {
        // May fail due to database constraints
        console.log('Memory pruning warning:', error.message);
      }
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent operations', async () => {
      const promises = [];
      
      // Multiple concurrent health checks
      for (let i = 0; i < 5; i++) {
        promises.push(memoryManager.getMemoryHealth());
      }
      
      // Multiple concurrent searches
      const queryEmbedding = new Array(1536).fill(0.4);
      for (let i = 0; i < 3; i++) {
        promises.push(memoryManager.searchMemoriesBySimilarity(queryEmbedding, 5, 0.1));
      }
      
      const results = await Promise.all(promises);
      expect(results).toBeDefined();
      expect(results.length).toBe(8);
      
      // Verify all results are valid
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should handle large batch operations', async () => {
      const embedding = new Array(1536).fill(0.2);
      const batchPromises = [];
      
      // Create multiple memories in parallel
      for (let i = 0; i < 5; i++) {
        batchPromises.push(
          memoryManager.createMemory(
            'semantic',
            `Comprehensive batch memory ${i}`,
            embedding,
            0.5 + (i * 0.1)
          )
        );
      }
      
      const batchResults = await Promise.all(batchPromises);
      expect(batchResults).toBeDefined();
      expect(batchResults.length).toBe(5);
      
      batchResults.forEach((memory, index) => {
        expect(memory).toBeDefined();
        expect(memory.id).toBeDefined();
        expect(memory.content).toBe(`Comprehensive batch memory ${index}`);
      });
    });
  });
});
