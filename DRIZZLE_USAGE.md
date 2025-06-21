# Drizzle ORM Integration

This project now includes Drizzle ORM for type-safe database interactions with PostgreSQL. Drizzle provides a modern, performant alternative to raw SQL queries while maintaining full control over your database schema.

## Setup

The Drizzle integration is already configured and ready to use. The setup includes:

- **Schema Definition**: `src/db/schema.js` - Auto-generated from existing database
- **Database Connection**: `src/db/connection.js` - Configured connection pool
- **Memory Manager**: `src/drizzle-memory-manager.js` - Drizzle-based implementation

## Key Features

### 1. Type-Safe Queries
```javascript
import { eq, and, desc } from 'drizzle-orm';
import { db } from './src/db/connection.js';
import * as schema from './src/db/schema.js';

// Type-safe query with auto-completion
const memories = await db
  .select()
  .from(schema.memories)
  .where(eq(schema.memories.status, 'active'))
  .orderBy(desc(schema.memories.importance));
```

### 2. Automatic Schema Generation
The schema was generated from your existing database using:
```bash
npx drizzle-kit introspect
```

### 3. Vector Similarity Search
```javascript
const embeddingVector = `[${queryEmbedding.join(',')}]`;
const results = await db
  .select({
    id: schema.memories.id,
    content: schema.memories.content,
    similarity: sql`1 - (${schema.memories.embedding} <=> ${embeddingVector}::vector)`.as('similarity')
  })
  .from(schema.memories)
  .where(sql`1 - (${schema.memories.embedding} <=> ${embeddingVector}::vector) >= ${threshold}`)
  .orderBy(sql`${schema.memories.embedding} <=> ${embeddingVector}::vector`);
```

### 4. Transaction Support
```javascript
const result = await db.transaction(async (tx) => {
  const [memory] = await tx.insert(schema.memories).values({
    type: 'semantic',
    content: 'Example content',
    embedding: '[0.1,0.2,0.3,...]'
  }).returning();

  await tx.insert(schema.semanticMemories).values({
    memoryId: memory.id,
    confidence: 0.9
  });

  return memory;
});
```

## Available Scripts

- `pnpm run test:drizzle` - Run Drizzle-specific tests
- `pnpm run db:generate` - Generate migration files
- `pnpm run db:migrate` - Run database migrations
- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:studio` - Launch Drizzle Studio (database GUI)

## Usage Examples

### Creating Memories
```javascript
import { DrizzleMemoryManager } from './src/drizzle-memory-manager.js';

const memoryManager = new DrizzleMemoryManager();

// Create a semantic memory
const memory = await memoryManager.createMemory(
  'semantic',
  'Drizzle ORM provides type-safe database queries',
  embedding, // 1536-dimensional array
  0.8, // importance
  {
    confidence: 0.9,
    category: ['technology', 'database'],
    related_concepts: ['ORM', 'TypeScript', 'SQL']
  }
);
```

### Searching Memories
```javascript
// Text search
const textResults = await memoryManager.searchMemoriesByText('Drizzle', 10);

// Similarity search
const similarResults = await memoryManager.searchMemoriesBySimilarity(
  queryEmbedding,
  10, // limit
  0.7 // threshold
);

// Advanced search
const advancedResults = await memoryManager.searchMemoriesAdvanced({
  textQuery: 'database',
  embedding: queryEmbedding,
  memoryTypes: ['semantic', 'procedural'],
  importanceRange: [0.5, 1.0],
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date()
  },
  limit: 20
});
```

### Working with Clusters
```javascript
// Create a cluster
const cluster = await memoryManager.createMemoryCluster(
  'Technology Concepts',
  'theme',
  'Cluster for technology-related memories',
  ['tech', 'programming', 'database']
);

// Get cluster memories
const clusterMemories = await memoryManager.getClusterMemories(cluster.id, 10);

// Activate cluster
const activatedMemories = await memoryManager.activateCluster(
  cluster.id,
  'User asked about database technologies'
);
```

## Schema Overview

The database schema includes these main tables:

- **memories** - Core memory storage with embeddings
- **episodic_memories** - Event-based memories
- **semantic_memories** - Factual knowledge
- **procedural_memories** - Step-by-step processes
- **strategic_memories** - Pattern-based insights
- **memory_clusters** - Memory groupings
- **working_memory** - Temporary memory storage
- **worldview_primitives** - Core beliefs and concepts
- **identity_model** - Self-concept and identity

## Benefits of Drizzle

1. **Type Safety** - Catch errors at compile time
2. **Performance** - Optimized query generation
3. **Developer Experience** - Auto-completion and IntelliSense
4. **Flexibility** - Raw SQL when needed, ORM when convenient
5. **Migration Management** - Version-controlled schema changes
6. **Database Introspection** - Generate schema from existing database

## Migration from Raw SQL

The original `MemoryManager` class remains available for backward compatibility. To migrate:

1. Replace imports:
   ```javascript
   // Old
   import { MemoryManager } from './src/memory-manager.js';
   
   // New
   import { DrizzleMemoryManager } from './src/drizzle-memory-manager.js';
   ```

2. The API remains largely the same, with improved type safety and performance.

## Testing

Run the Drizzle test suite:
```bash
pnpm run test:drizzle
```

This will test all major functionality including:
- Memory creation and retrieval
- Text and similarity search
- Cluster management
- Working memory operations
- Advanced search capabilities

## Database Studio

Launch Drizzle Studio for a visual database interface:
```bash
pnpm run db:studio
```

This provides a web-based GUI for exploring your database schema and data.
