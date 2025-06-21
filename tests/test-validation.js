import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { MemoryManager } from '../src/memory-manager.js';

describe('Validation Tests', () => {
  let memoryManager;

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
    if (memoryManager) {
      await memoryManager.closeAllConnections();
    }
  });

  describe('Database Connection', () => {
    it('should establish database connection', async () => {
      const result = await memoryManager.db.execute(sql`SELECT 1 as test`);
      expect(result).toBeDefined();
    });

    it('should have memory manager instance', () => {
      expect(memoryManager).toBeDefined();
      expect(memoryManager.db).toBeDefined();
    });
  });

  describe('Basic Memory Operations', () => {
    let testMemoryId;

    it('should create memory successfully', async () => {
      const embedding = new Array(1536).fill(0.5);
      const memory = await memoryManager.createMemory(
        'semantic',
        'Test validation memory',
        embedding,
        0.8,
        { confidence: 0.9 }
      );

      expect(memory).toBeDefined();
      expect(memory.id).toBeDefined();
      expect(memory.type).toBe('semantic');
      expect(memory.content).toBe('Test validation memory');
      expect(memory.importance).toBe(0.8);
      
      testMemoryId = memory.id;
    });

    it('should retrieve memory by ID', async () => {
      expect(testMemoryId).toBeDefined();
      
      const memory = await memoryManager.getMemoryById(testMemoryId);
      expect(memory).toBeDefined();
      expect(memory.id).toBe(testMemoryId);
      expect(memory.type_specific_data).toBeDefined();
    });

    it('should access memory and update count', async () => {
      const memory = await memoryManager.accessMemory(testMemoryId);
      expect(memory).toBeDefined();
      expect(memory.id).toBe(testMemoryId);
      expect(memory.accessCount).toBeGreaterThan(0);
    });
  });

  describe('Vector Operations', () => {
    it('should perform vector similarity search', async () => {
      const queryEmbedding = new Array(1536).fill(0.5);
      const results = await memoryManager.searchMemoriesBySimilarity(
        queryEmbedding,
        5,
        0.7
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Cluster Operations', () => {
    let testClusterId;

    it('should create memory cluster', async () => {
      const cluster = await memoryManager.createMemoryCluster(
        'Validation Test Cluster',
        'theme',
        'Test cluster for validation',
        ['validation', 'test']
      );

      expect(cluster).toBeDefined();
      expect(cluster.id).toBeDefined();
      expect(cluster.name).toBe('Validation Test Cluster');
      
      testClusterId = cluster.id;
    });

    it('should retrieve memory clusters', async () => {
      const clusters = await memoryManager.getMemoryClusters(10);
      expect(clusters).toBeDefined();
      expect(Array.isArray(clusters)).toBe(true);
      
      const foundCluster = clusters.find(c => c.id === testClusterId);
      expect(foundCluster).toBeDefined();
    });

    it('should activate cluster', async () => {
      const result = await memoryManager.activateCluster(testClusterId, 'validation test');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('System Health', () => {
    it('should get memory health statistics', async () => {
      const health = await memoryManager.getMemoryHealth();
      expect(health).toBeDefined();
      expect(Array.isArray(health)).toBe(true);
    });

    it('should get worldview primitives', async () => {
      const worldview = await memoryManager.getWorldviewPrimitives();
      expect(worldview).toBeDefined();
      expect(Array.isArray(worldview)).toBe(true);
    });

    it('should get identity core', async () => {
      const identity = await memoryManager.getIdentityCore();
      // Identity might not exist, which is acceptable
      expect(identity === null || typeof identity === 'object').toBe(true);
    });
  });

  describe('Working Memory', () => {
    it('should create and manage working memory', async () => {
      const embedding = new Array(1536).fill(0.3);
      const workingMemory = await memoryManager.createWorkingMemory(
        'Validation working memory',
        embedding,
        { ttl: 300 }
      );

      expect(workingMemory).toBeDefined();
      expect(workingMemory.id).toBeDefined();
      expect(workingMemory.content).toBe('Validation working memory');
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

  describe('Text Search', () => {
    it('should search memories by text', async () => {
      const results = await memoryManager.searchMemoriesByText('validation', 5);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should perform advanced search', async () => {
      const criteria = {
        textQuery: 'validation',
        memoryTypes: ['semantic'],
        importanceRange: [0.5, 1.0],
        limit: 5
      };

      const results = await memoryManager.searchMemoriesAdvanced(criteria);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid memory type gracefully', async () => {
      const embedding = new Array(1536).fill(0.5);
      
      await expect(async () => {
        await memoryManager.createMemory(
          'invalid_type',
          'Test invalid memory type',
          embedding,
          0.8
        );
      }).rejects.toThrow();
    });

    it('should handle invalid memory ID gracefully', async () => {
      const result = await memoryManager.getMemoryById('invalid-id');
      expect(result).toBeNull();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent operations', async () => {
      const promises = [];
      
      // Multiple health checks
      for (let i = 0; i < 3; i++) {
        promises.push(memoryManager.getMemoryHealth());
      }
      
      // Multiple cluster retrievals
      for (let i = 0; i < 2; i++) {
        promises.push(memoryManager.getMemoryClusters(5));
      }
      
      const results = await Promise.all(promises);
      expect(results).toBeDefined();
      expect(results.length).toBe(5);
      
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });
});
