#!/usr/bin/env node

import 'dotenv/config';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MemoryManager } from './src/memory-manager.js';

// Initialize memory manager
const memoryManager = new MemoryManager();

// MCP Server setup
const server = new Server({
  name: "memory-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_memory",
        description: "Create a new memory with optional type-specific metadata",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["episodic", "semantic", "procedural", "strategic"],
              description: "Type of memory to create"
            },
            content: {
              type: "string",
              description: "The main content/text of the memory"
            },
            embedding: {
              type: "array",
              items: { type: "number" },
              description: "Vector embedding for the memory content"
            },
            importance: {
              type: "number",
              description: "Importance score (0.0 to 1.0)",
              default: 0.0
            },
            metadata: {
              type: "object",
              description: "Type-specific metadata (action_taken, context, confidence, etc.)",
              default: {}
            }
          },
          required: ["type", "content", "embedding"]
        }
      },
      {
        name: "search_memories_similarity",
        description: "Search memories by vector similarity",
        inputSchema: {
          type: "object",
          properties: {
            embedding: {
              type: "array",
              items: { type: "number" },
              description: "Query embedding vector"
            },
            limit: {
              type: "integer",
              description: "Maximum number of results",
              default: 10
            },
            threshold: {
              type: "number",
              description: "Minimum similarity threshold",
              default: 0.7
            }
          },
          required: ["embedding"]
        }
      },
      {
        name: "search_memories_text",
        description: "Search memories by text content using full-text search",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Text query to search for"
            },
            limit: {
              type: "integer",
              description: "Maximum number of results",
              default: 10
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_memory",
        description: "Retrieve a specific memory by ID and mark it as accessed",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "UUID of the memory to retrieve"
            }
          },
          required: ["memory_id"]
        }
      },
      {
        name: "get_memory_clusters",
        description: "Retrieve memory clusters ordered by importance/activity",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              description: "Maximum number of clusters to return",
              default: 20
            }
          }
        }
      },
      {
        name: "activate_cluster",
        description: "Activate a memory cluster and get its associated memories",
        inputSchema: {
          type: "object",
          properties: {
            cluster_id: {
              type: "string",
              description: "UUID of the cluster to activate"
            },
            context: {
              type: "string",
              description: "Context description for this activation",
              default: null
            }
          },
          required: ["cluster_id"]
        }
      },
      {
        name: "create_memory_cluster",
        description: "Create a new memory cluster",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the cluster"
            },
            cluster_type: {
              type: "string",
              enum: ["theme", "emotion", "temporal", "person", "pattern", "mixed"],
              description: "Type of cluster"
            },
            description: {
              type: "string",
              description: "Description of the cluster"
            },
            keywords: {
              type: "array",
              items: { type: "string" },
              description: "Keywords associated with this cluster",
              default: []
            }
          },
          required: ["name", "cluster_type"]
        }
      },
      {
        name: "get_identity_core",
        description: "Retrieve the current identity model and core memory clusters",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_worldview",
        description: "Retrieve current worldview primitives and beliefs",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_memory_health",
        description: "Get overall statistics about memory system health",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_active_themes",
        description: "Get recently activated memory themes and patterns",
        inputSchema: {
          type: "object",
          properties: {
            days: {
              type: "integer",
              description: "Number of days to look back",
              default: 7
            }
          }
        }
      },
      {
        name: "create_memory_relationship",
        description: "Create a relationship between two memories",
        inputSchema: {
          type: "object",
          properties: {
            from_memory_id: {
              type: "string",
              description: "UUID of the source memory"
            },
            to_memory_id: {
              type: "string", 
              description: "UUID of the target memory"
            },
            relationship_type: {
              type: "string",
              enum: ["causal", "temporal", "semantic", "emotional", "strategic", "consolidation"],
              description: "Type of relationship"
            },
            properties: {
              type: "object",
              description: "Additional properties for the relationship",
              default: {}
            }
          },
          required: ["from_memory_id", "to_memory_id", "relationship_type"]
        }
      },
      {
        name: "get_memory_relationships",
        description: "Get relationships for a specific memory",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "UUID of the memory"
            },
            direction: {
              type: "string",
              enum: ["incoming", "outgoing", "both"],
              description: "Direction of relationships to retrieve",
              default: "both"
            },
            relationship_type: {
              type: "string",
              description: "Filter by relationship type (optional)"
            }
          },
          required: ["memory_id"]
        }
      },
      {
        name: "find_related_memories",
        description: "Find memories related through graph traversal",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "UUID of the starting memory"
            },
            max_depth: {
              type: "integer",
              description: "Maximum depth to traverse",
              default: 2
            },
            min_strength: {
              type: "number",
              description: "Minimum relationship strength",
              default: 0.3
            }
          },
          required: ["memory_id"]
        }
      },
      {
        name: "consolidate_working_memory",
        description: "Consolidate multiple working memories into a single semantic memory",
        inputSchema: {
          type: "object",
          properties: {
            working_memory_ids: {
              type: "array",
              items: { type: "string" },
              description: "Array of working memory UUIDs to consolidate"
            },
            consolidated_content: {
              type: "string",
              description: "Content for the consolidated memory"
            },
            consolidated_embedding: {
              type: "array",
              items: { type: "number" },
              description: "Embedding for the consolidated memory"
            }
          },
          required: ["working_memory_ids", "consolidated_content", "consolidated_embedding"]
        }
      },
      {
        name: "archive_old_memories",
        description: "Archive old memories based on age and importance criteria",
        inputSchema: {
          type: "object",
          properties: {
            days_old: {
              type: "integer",
              description: "Minimum age in days for archival",
              default: 365
            },
            importance_threshold: {
              type: "number",
              description: "Maximum importance for archival",
              default: 0.3
            }
          }
        }
      },
      {
        name: "prune_memories",
        description: "Permanently delete memories based on criteria",
        inputSchema: {
          type: "object",
          properties: {
            criteria: {
              type: "object",
              properties: {
                max_age: {
                  type: "integer",
                  description: "Maximum age in days",
                  default: 1095
                },
                min_importance: {
                  type: "number",
                  description: "Minimum importance threshold",
                  default: 0.1
                },
                max_access_count: {
                  type: "integer",
                  description: "Maximum access count",
                  default: 2
                },
                status: {
                  type: "string",
                  description: "Memory status to prune",
                  default: "archived"
                }
              }
            }
          }
        }
      },
      {
        name: "get_cluster_insights",
        description: "Get detailed analytics for a memory cluster",
        inputSchema: {
          type: "object",
          properties: {
            cluster_id: {
              type: "string",
              description: "UUID of the cluster"
            }
          },
          required: ["cluster_id"]
        }
      },
      {
        name: "find_similar_clusters",
        description: "Find clusters similar to a given cluster",
        inputSchema: {
          type: "object",
          properties: {
            cluster_id: {
              type: "string",
              description: "UUID of the reference cluster"
            },
            threshold: {
              type: "number",
              description: "Minimum similarity threshold",
              default: 0.7
            }
          },
          required: ["cluster_id"]
        }
      },
      {
        name: "create_working_memory",
        description: "Create a temporary working memory with expiration",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Content of the working memory"
            },
            embedding: {
              type: "array",
              items: { type: "number" },
              description: "Vector embedding for the content"
            },
            context: {
              type: "object",
              properties: {
                ttl: {
                  type: "integer",
                  description: "Time to live in seconds",
                  default: 3600
                }
              },
              default: {}
            }
          },
          required: ["content", "embedding"]
        }
      },
      {
        name: "get_working_memories",
        description: "Retrieve current working memories",
        inputSchema: {
          type: "object",
          properties: {
            include_expired: {
              type: "boolean",
              description: "Include expired working memories",
              default: false
            }
          }
        }
      },
      {
        name: "cleanup_expired_working_memory",
        description: "Clean up expired working memories",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_memory_history",
        description: "Get change history for a specific memory",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "UUID of the memory"
            }
          },
          required: ["memory_id"]
        }
      },
      {
        name: "search_memories_advanced",
        description: "Advanced memory search with multiple criteria",
        inputSchema: {
          type: "object",
          properties: {
            criteria: {
              type: "object",
              properties: {
                text_query: {
                  type: "string",
                  description: "Text search query"
                },
                embedding: {
                  type: "array",
                  items: { type: "number" },
                  description: "Vector embedding for similarity search"
                },
                memory_types: {
                  type: "array",
                  items: { type: "string" },
                  description: "Filter by memory types",
                  default: []
                },
                importance_range: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 2,
                  maxItems: 2,
                  description: "Importance range [min, max]",
                  default: [0, 1]
                },
                date_range: {
                  type: "object",
                  properties: {
                    start: { type: "string", format: "date-time" },
                    end: { type: "string", format: "date-time" }
                  },
                  default: {}
                },
                limit: {
                  type: "integer",
                  description: "Maximum number of results",
                  default: 10
                }
              }
            }
          },
          required: ["criteria"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  try {
    switch (name) {
      case "create_memory":
        const memory = await memoryManager.createMemory(
          args.type,
          args.content,
          args.embedding,
          args.importance || 0.0,
          args.metadata || {}
        );
        return { content: [{ type: "text", text: JSON.stringify(memory, null, 2) }] };

      case "search_memories_similarity":
        const similarMemories = await memoryManager.searchMemoriesBySimilarity(
          args.embedding,
          args.limit || 10,
          args.threshold || 0.7
        );
        return { content: [{ type: "text", text: JSON.stringify(similarMemories, null, 2) }] };

      case "search_memories_text":
        const textResults = await memoryManager.searchMemoriesByText(
          args.query,
          args.limit || 10
        );
        return { content: [{ type: "text", text: JSON.stringify(textResults, null, 2) }] };

      case "get_memory":
        const retrievedMemory = await memoryManager.accessMemory(args.memory_id);
        return { content: [{ type: "text", text: JSON.stringify(retrievedMemory, null, 2) }] };

      case "get_memory_clusters":
        const clusters = await memoryManager.getMemoryClusters(args.limit || 20);
        return { content: [{ type: "text", text: JSON.stringify(clusters, null, 2) }] };

      case "activate_cluster":
        const clusterMemories = await memoryManager.activateCluster(
          args.cluster_id,
          args.context || null
        );
        return { content: [{ type: "text", text: JSON.stringify(clusterMemories, null, 2) }] };

      case "create_memory_cluster":
        const newCluster = await memoryManager.createMemoryCluster(
          args.name,
          args.cluster_type,
          args.description,
          args.keywords || []
        );
        return { content: [{ type: "text", text: JSON.stringify(newCluster, null, 2) }] };

      case "get_identity_core":
        const identity = await memoryManager.getIdentityCore();
        return { content: [{ type: "text", text: JSON.stringify(identity, null, 2) }] };

      case "get_worldview":
        const worldview = await memoryManager.getWorldviewPrimitives();
        return { content: [{ type: "text", text: JSON.stringify(worldview, null, 2) }] };

      case "get_memory_health":
        const health = await memoryManager.getMemoryHealth();
        return { content: [{ type: "text", text: JSON.stringify(health, null, 2) }] };

      case "get_active_themes":
        const themes = await memoryManager.getActiveThemes(args.days || 7);
        return { content: [{ type: "text", text: JSON.stringify(themes, null, 2) }] };

      case "create_memory_relationship":
        const relationship = await memoryManager.createMemoryRelationship(
          args.from_memory_id,
          args.to_memory_id,
          args.relationship_type,
          args.properties || {}
        );
        return { content: [{ type: "text", text: JSON.stringify(relationship, null, 2) }] };

      case "get_memory_relationships":
        const relationships = await memoryManager.getMemoryRelationships(
          args.memory_id,
          args.direction || 'both',
          args.relationship_type || null
        );
        return { content: [{ type: "text", text: JSON.stringify(relationships, null, 2) }] };

      case "find_related_memories":
        const relatedMemories = await memoryManager.findRelatedMemories(
          args.memory_id,
          args.max_depth || 2,
          args.min_strength || 0.3
        );
        return { content: [{ type: "text", text: JSON.stringify(relatedMemories, null, 2) }] };

      case "consolidate_working_memory":
        const consolidatedMemory = await memoryManager.consolidateWorkingMemory(
          args.working_memory_ids,
          args.consolidated_content,
          args.consolidated_embedding
        );
        return { content: [{ type: "text", text: JSON.stringify(consolidatedMemory, null, 2) }] };

      case "archive_old_memories":
        const archivedMemories = await memoryManager.archiveOldMemories(
          args.days_old || 365,
          args.importance_threshold || 0.3
        );
        return { content: [{ type: "text", text: JSON.stringify(archivedMemories, null, 2) }] };

      case "prune_memories":
        const prunedMemories = await memoryManager.pruneMemories(args.criteria || {});
        return { content: [{ type: "text", text: JSON.stringify(prunedMemories, null, 2) }] };

      case "get_cluster_insights":
        const clusterInsights = await memoryManager.getClusterInsights(args.cluster_id);
        return { content: [{ type: "text", text: JSON.stringify(clusterInsights, null, 2) }] };

      case "find_similar_clusters":
        const similarClusters = await memoryManager.findSimilarClusters(
          args.cluster_id,
          args.threshold || 0.7
        );
        return { content: [{ type: "text", text: JSON.stringify(similarClusters, null, 2) }] };

      case "create_working_memory":
        const workingMemory = await memoryManager.createWorkingMemory(
          args.content,
          args.embedding,
          args.context || {}
        );
        return { content: [{ type: "text", text: JSON.stringify(workingMemory, null, 2) }] };

      case "get_working_memories":
        const workingMemories = await memoryManager.getWorkingMemories(
          args.include_expired || false
        );
        return { content: [{ type: "text", text: JSON.stringify(workingMemories, null, 2) }] };

      case "cleanup_expired_working_memory":
        const cleanedMemories = await memoryManager.cleanupExpiredWorkingMemory();
        return { content: [{ type: "text", text: JSON.stringify(cleanedMemories, null, 2) }] };

      case "get_memory_history":
        const memoryHistory = await memoryManager.getMemoryHistory(args.memory_id);
        return { content: [{ type: "text", text: JSON.stringify(memoryHistory, null, 2) }] };

      case "search_memories_advanced":
        const advancedResults = await memoryManager.searchMemoriesAdvanced(args.criteria);
        return { content: [{ type: "text", text: JSON.stringify(advancedResults, null, 2) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return { 
      content: [{ 
        type: "text", 
        text: `Error executing ${name}: ${error.message}` 
      }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Memory MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
