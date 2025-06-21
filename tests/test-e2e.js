import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { MemoryManager } from '../src/memory-manager.js';

describe('End-to-End Tests', () => {
  let memoryManager;
  let testMemoryId;
  let testClusterId;

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
          await tx.execute(sql`DELETE FROM episodic_memories WHERE memory_id IN (SELECT id FROM memories WHERE content LIKE '%E2E testing%')`);
          await tx.execute(sql`DELETE FROM semantic_memories WHERE memory_id IN (SELECT id FROM memories WHERE content LIKE '%E2E testing%')`);
          await tx.execute(sql`DELETE FROM procedural_memories WHERE memory_id IN (SELECT id FROM memories WHERE content LIKE '%E2E testing%')`);
          await tx.execute(sql`DELETE FROM strategic_memories WHERE memory_id IN (SELECT id FROM memories WHERE content LIKE '%E2E testing%')`);
          await tx.execute(sql`DELETE FROM memory_cluster_members WHERE memory_id IN (SELECT id FROM memories WHERE content LIKE '%E2E testing%')`);
          await tx.execute(sql`DELETE FROM memories WHERE content LIKE '%E2E testing%'`);
          await tx.execute(sql`DELETE FROM memories WHERE content LIKE '%Vector embedding test%'`);
          await tx.execute(sql`DELETE FROM memory_clusters WHERE name LIKE '%E2E Test%'`);
        });
      } catch (error) {
        console.warn('Cleanup warning:', error.message);
      }
      
      await memoryManager.closeAllConnections();
    }
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const result = await memoryManager.db.execute(sql`SELECT 1 as test`);
      expect(result).toBeDefined();
    });
  });

  describe('Memory Operations', () => {
    it('should create semantic memory', async () => {
      const embedding = new Array(1536).fill(0.5);
      const memory = await memoryManager.createMemory(
        'semantic',
        'Test semantic memory for E2E testing',
        embedding,
        0.8,
        { confidence: 0.9, category: ['test'], related_concepts: ['e2e', 'testing'] }
      );
      
      expect(memory).toBeDefined();
      expect(memory.id).toBeDefined();
      expect(memory.createdAt).toBeDefined();
      
      testMemoryId = memory.id;
    });

    it('should create episodic memory', async () => {
      const embedding = new Array(1536).fill(0.3);
      const memory = await memoryManager.createMemory(
        'episodic',
        'Test episodic memory for E2E testing',
        embedding,
        0.7,
        { 
          action_taken: { action: 'testing' },
          context: { environment: 'e2e' },
          result: { outcome: 'success' },
          emotional_valence: 0.6
        }
      );
      
      expect(memory).toBeDefined();
      expect(memory.id).toBeDefined();
      expect(memory.createdAt).toBeDefined();
    });

    it('should search memories by similarity', async () => {
      const queryEmbedding = new Array(1536).fill(0.5);
      const results = await memoryManager.searchMemoriesBySimilarity(
        queryEmbedding,
        10,
        0.1
      );
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search memories by text', async () => {
      const results = await memoryManager.searchMemoriesByText('E2E testing', 5);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should access memory by ID', async () => {
      expect(testMemoryId).toBeDefined();
      
      const memory = await memoryManager.accessMemory(testMemoryId);
      
      expect(memory).toBeDefined();
      expect(memory.id).toBe(testMemoryId);
      expect(memory.accessCount).toBeGreaterThan(0);
    });
  });

  describe('Cluster Operations', () => {
    it('should create memory cluster', async () => {
      const cluster = await memoryManager.createMemoryCluster(
        'E2E Test Cluster',
        'theme',
        'Cluster created during E2E testing',
        ['e2e', 'test', 'cluster']
      );
      
      expect(cluster).toBeDefined();
      expect(cluster.id).toBeDefined();
      expect(cluster.createdAt).toBeDefined();
      
      testClusterId = cluster.id;
    });

    it('should get memory clusters', async () => {
      const clusters = await memoryManager.getMemoryClusters(20);
      
      expect(clusters).toBeDefined();
      expect(Array.isArray(clusters)).toBe(true);
      expect(clusters.length).toBeGreaterThan(0);
    });

    it('should activate cluster', async () => {
      expect(testClusterId).toBeDefined();
      
      const result = await memoryManager.activateCluster(testClusterId, 'e2e test context');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('System Health', () => {
    it('should get memory health', async () => {
      const health = await memoryManager.getMemoryHealth();
      
      expect(health).toBeDefined();
      expect(Array.isArray(health)).toBe(true);
    });

    it('should get identity core', async () => {
      const identity = await memoryManager.getIdentityCore();
      
      // Identity might not exist yet, which is okay
      expect(identity === null || typeof identity === 'object').toBe(true);
    });

    it('should get worldview primitives', async () => {
      const worldview = await memoryManager.getWorldviewPrimitives();
      
      expect(worldview).toBeDefined();
      expect(Array.isArray(worldview)).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent connections', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(memoryManager.getMemoryHealth());
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Vector Operations', () => {
    it('should store and retrieve vector embeddings', async () => {
      const testEmbedding = new Array(1536).fill(0).map((_, i) => i % 2 === 0 ? 0.8 : 0.2);
      
      const memory = await memoryManager.createMemory(
        'semantic',
        'Vector embedding test memory',
        testEmbedding,
        0.9
      );
      
      expect(memory).toBeDefined();
      expect(memory.id).toBeDefined();
      
      // Search for similar vectors
      const similar = await memoryManager.searchMemoriesBySimilarity(
        testEmbedding,
        10,
        0.1
      );
      
      expect(similar).toBeDefined();
      expect(Array.isArray(similar)).toBe(true);
    });
  });

  describe('Working Memory', () => {
    it('should create and manage working memory', async () => {
      const embedding = new Array(1536).fill(0.3);
      const workingMemory = await memoryManager.createWorkingMemory(
        'E2E test working memory',
        embedding,
        { ttl: 300 }
      );
      
      expect(workingMemory).toBeDefined();
      expect(workingMemory.id).toBeDefined();
      expect(workingMemory.content).toBe('E2E test working memory');
    });

    it('should get working memories', async () => {
      const workingMemories = await memoryManager.getWorkingMemories(false);
      
      expect(workingMemories).toBeDefined();
      expect(Array.isArray(workingMemories)).toBe(true);
    });

    it('should cleanup expired working memory', async () => {
      const cleaned = await memoryManager.cleanupExpiredWorkingMemory();
      
      expect(cleaned).toBeDefined();
      expect(Array.isArray(cleaned)).toBe(true);
    });
  });
});
