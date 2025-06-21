import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemoryManager } from '../src/memory-manager.js';

describe('Unit Tests', () => {
  let memoryManager;

  beforeAll(async () => {
    memoryManager = new MemoryManager();
  });

  afterAll(async () => {
    if (memoryManager) {
      await memoryManager.closeAllConnections();
    }
  });

  describe('Memory Manager Initialization', () => {
    it('should initialize memory manager', () => {
      expect(memoryManager).toBeDefined();
      expect(memoryManager.db).toBeDefined();
    });
  });

  describe('Memory Creation', () => {
    it('should create semantic memory', async () => {
      const embedding = new Array(1536).fill(0.5);
      const memory = await memoryManager.createMemory(
        'semantic',
        'Test semantic memory',
        embedding,
        0.8,
        { confidence: 0.9, category: ['test'], related_concepts: ['unit', 'testing'] }
      );

      expect(memory).toBeDefined();
      expect(memory.id).toBeDefined();
      expect(memory.type).toBe('semantic');
      expect(memory.content).toBe('Test semantic memory');
      expect(memory.importance).toBe(0.8);
    });

    it('should create episodic memory', async () => {
      const embedding = new Array(1536).fill(0.3);
      const memory = await memoryManager.createMemory(
        'episodic',
        'Test episodic memory',
        embedding,
        0.7,
        { 
          action_taken: { action: 'testing' },
          context: { environment: 'unit' },
          result: { outcome: 'success' },
          emotional_valence: 0.6
        }
      );

      expect(memory).toBeDefined();
      expect(memory.id).toBeDefined();
      expect(memory.type).toBe('episodic');
      expect(memory.content).toBe('Test episodic memory');
      expect(memory.importance).toBe(0.7);
    });

    it('should create procedural memory', async () => {
      const embedding = new Array(1536).fill(0.4);
      const memory = await memoryManager.createMemory(
        'procedural',
        'Test procedural memory',
        embedding,
        0.6,
        { 
          steps: { step1: 'initialize', step2: 'execute' },
          prerequisites: { skill: 'basic' },
          success_count: 5,
          total_attempts: 10
        }
      );

      expect(memory).toBeDefined();
      expect(memory.id).toBeDefined();
      expect(memory.type).toBe('procedural');
      expect(memory.content).toBe('Test procedural memory');
      expect(memory.importance).toBe(0.6);
    });

    it('should create strategic memory', async () => {
      const embedding = new Array(1536).fill(0.6);
      const memory = await memoryManager.createMemory(
        'strategic',
        'Test strategic memory',
        embedding,
        0.9,
        { 
          pattern_description: 'Strategic pattern',
          confidence_score: 0.8,
          supporting_evidence: ['evidence1', 'evidence2'],
          success_metrics: { accuracy: 0.95 }
        }
      );

      expect(memory).toBeDefined();
      expect(memory.id).toBeDefined();
      expect(memory.type).toBe('strategic');
      expect(memory.content).toBe('Test strategic memory');
      expect(memory.importance).toBe(0.9);
    });
  });

  describe('Memory Retrieval', () => {
    let testMemoryId;

    beforeAll(async () => {
      const embedding = new Array(1536).fill(0.5);
      const memory = await memoryManager.createMemory(
        'semantic',
        'Retrieval test memory',
        embedding,
        0.8
      );
      testMemoryId = memory.id;
    });

    it('should retrieve memory by ID', async () => {
      const memory = await memoryManager.getMemoryById(testMemoryId);
      
      expect(memory).toBeDefined();
      expect(memory.id).toBe(testMemoryId);
      expect(memory.content).toBe('Retrieval test memory');
    });

    it('should access memory and increment count', async () => {
      const memory = await memoryManager.accessMemory(testMemoryId);
      
      expect(memory).toBeDefined();
      expect(memory.id).toBe(testMemoryId);
      expect(memory.accessCount).toBeGreaterThan(0);
    });
  });

  describe('Memory Search', () => {
    beforeAll(async () => {
      // Create some test memories for searching
      const embedding1 = new Array(1536).fill(0.1);
      const embedding2 = new Array(1536).fill(0.2);
      
      await memoryManager.createMemory(
        'semantic',
        'Search test memory about artificial intelligence',
        embedding1,
        0.8
      );
      
      await memoryManager.createMemory(
        'semantic',
        'Another search test about machine learning',
        embedding2,
        0.7
      );
    });

    it('should search memories by similarity', async () => {
      const queryEmbedding = new Array(1536).fill(0.15);
      const results = await memoryManager.searchMemoriesBySimilarity(
        queryEmbedding,
        10,
        0.1
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search memories by text', async () => {
      const results = await memoryManager.searchMemoriesByText('artificial intelligence', 5);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should perform advanced search', async () => {
      const criteria = {
        textQuery: 'machine learning',
        memoryTypes: ['semantic'],
        importanceRange: [0.5, 1.0],
        limit: 5
      };

      const results = await memoryManager.searchMemoriesAdvanced(criteria);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Memory Clusters', () => {
    let testClusterId;

    it('should create memory cluster', async () => {
      const cluster = await memoryManager.createMemoryCluster(
        'Unit Test Cluster',
        'theme',
        'Cluster for unit testing',
        ['unit', 'test', 'cluster']
      );

      expect(cluster).toBeDefined();
      expect(cluster.id).toBeDefined();
      expect(cluster.name).toBe('Unit Test Cluster');
      expect(cluster.clusterType).toBe('theme');
      
      testClusterId = cluster.id;
    });

    it('should get memory clusters', async () => {
      const clusters = await memoryManager.getMemoryClusters(10);

      expect(clusters).toBeDefined();
      expect(Array.isArray(clusters)).toBe(true);
    });

    it('should get cluster memories', async () => {
      const memories = await memoryManager.getClusterMemories(testClusterId, 10);

      expect(memories).toBeDefined();
      expect(Array.isArray(memories)).toBe(true);
    });

    it('should activate cluster', async () => {
      const result = await memoryManager.activateCluster(testClusterId, 'unit test context');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Working Memory', () => {
    let workingMemoryId;

    it('should create working memory', async () => {
      const embedding = new Array(1536).fill(0.3);
      const workingMemory = await memoryManager.createWorkingMemory(
        'Unit test working memory',
        embedding,
        { ttl: 300 }
      );

      expect(workingMemory).toBeDefined();
      expect(workingMemory.id).toBeDefined();
      expect(workingMemory.content).toBe('Unit test working memory');
      
      workingMemoryId = workingMemory.id;
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

  describe('System Health', () => {
    it('should get memory health', async () => {
      const health = await memoryManager.getMemoryHealth();

      expect(health).toBeDefined();
      expect(Array.isArray(health)).toBe(true);
    });

    it('should get identity core', async () => {
      const identity = await memoryManager.getIdentityCore();
      // Identity might not exist, so we just check it doesn't throw
      expect(identity === null || typeof identity === 'object').toBe(true);
    });

    it('should get worldview primitives', async () => {
      const worldview = await memoryManager.getWorldviewPrimitives();

      expect(worldview).toBeDefined();
      expect(Array.isArray(worldview)).toBe(true);
    });

    it('should get active themes', async () => {
      try {
        const themes = await memoryManager.getActiveThemes(7);
        expect(themes).toBeDefined();
        expect(Array.isArray(themes)).toBe(true);
      } catch (error) {
        // Active themes might not be available in all database configurations
        expect(error.message).toContain('active_themes');
      }
    });
  });
});
