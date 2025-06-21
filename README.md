# AGI MCP Server

A Model Context Protocol (MCP) server that provides persistent memory capabilities for AI systems, enabling true continuity of consciousness across conversations.

## Overview

This MCP server connects to the [AGI Memory](https://github.com/cognitivecomputations/agi-memory) database to provide sophisticated memory management for AI systems. It supports:

- **Episodic, Semantic, Procedural, and Strategic memory types**
- **Vector similarity search** for associative memory retrieval
- **Memory clustering** with thematic organization
- **Identity persistence** and worldview tracking
- **Temporal decay** with importance-based retention
- **Graph-based memory relationships**

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Installation

This MCP server requires the [AGI Memory](https://github.com/cognitivecomputations/agi-memory) database to be running first.

#### 1. Set Up the Memory Database

```bash
# Clone and set up the memory database
git clone https://github.com/cognitivecomputations/agi-memory.git
cd agi-memory

# Create environment file
cp .env.local .env
# Edit .env with your database credentials

# Start the database
docker compose up -d

# Wait for database to be ready (this takes 2-3 minutes)
docker compose logs -f db
```

The database setup includes:
- PostgreSQL 16 with pgvector extension
- Apache AGE graph database extension
- Full schema initialization with memory tables

#### 2. Install and Run MCP Server

```bash
# Clone this repository
git clone https://github.com/cognitivecomputations/agi-mcp-server.git
cd agi-mcp-server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your actual database credentials
# Make sure these match the settings from your AGI Memory database setup

# Start the MCP server
npm start
```

#### 3. Connect to Claude Desktop

Add this configuration to your Claude Desktop settings:

```json
{
  "mcpServers": {
    "agi-memory": {
      "command": "node",
      "args": ["/path/to/agi-mcp-server/mcp.js"],
      "env": {
        "POSTGRES_HOST": "localhost",
        "POSTGRES_PORT": "5432",
        "POSTGRES_DB": "agi_db",
        "POSTGRES_USER": "agi_user",
        "POSTGRES_PASSWORD": "agi_password",
        "NODE_ENV": "development"
      }
    }
  }
}
```

**Alternative: Use directly from GitHub without local installation:**

```json
{
  "mcpServers": {
    "agi-memory": {
      "command": "npx",
      "args": [
        "-y",
        "github:cognitivecomputations/agi-mcp-server"
      ],
      "env": {
        "POSTGRES_HOST": "localhost",
        "POSTGRES_PORT": "5432",
        "POSTGRES_DB": "agi_db",
        "POSTGRES_USER": "agi_user",
        "POSTGRES_PASSWORD": "agi_password",
        "NODE_ENV": "development"
      }
    }
  }
}
```

**Troubleshooting: If you get "spawn npx ENOENT" error:**

This usually happens when using nvm (Node Version Manager) because GUI applications like Claude Desktop don't inherit your shell environment.

**Solution: Create system symlinks (Recommended)**

If you're using nvm, create system-wide symlinks so all applications can find Node.js:

```bash
# Find your current node/npm/npx paths
which node
which npm  
which npx

# Create system symlinks (replace with your actual paths)
sudo ln -sf /Users/username/.local/share/nvm/vX.X.X/bin/node /usr/local/bin/node
sudo ln -sf /Users/username/.local/share/nvm/vX.X.X/bin/npm /usr/local/bin/npm
sudo ln -sf /Users/username/.local/share/nvm/vX.X.X/bin/npx /usr/local/bin/npx
```

This makes your nvm-managed Node.js available system-wide for all MCP clients, not just Claude Desktop.

**Alternative: Use full paths in config**

If you prefer not to create system symlinks, use the full path:

```json
{
  "mcpServers": {
    "agi-memory": {
      "command": "/full/path/to/npx",
      "args": ["-y", "github:cognitivecomputations/agi-mcp-server"],
      "env": { /* ... your env vars ... */ }
    }
  }
}
```

**After fixing the paths:**
1. **Restart Claude Desktop** completely (quit and reopen)
2. Wait a few seconds for the MCP server to initialize
3. Check that the AGI Memory database is running: `docker compose ps` in your agi-memory directory

**Testing the server manually:**
```bash
cd /path/to/agi-mcp-server
POSTGRES_HOST=localhost POSTGRES_PORT=5432 POSTGRES_DB=agi_db POSTGRES_USER=agi_user POSTGRES_PASSWORD=agi_password NODE_ENV=development node mcp.js
```
You should see: "Memory MCP Server running on stdio"

**Debugging with logs:**
Check Claude Desktop logs for detailed error information:
```bash
cat ~/Library/Logs/Claude/mcp-server-agi-memory.log
```

## Memory Tools

### Orientation Tools
- `get_memory_health` - Overall memory system statistics
- `get_active_themes` - Recently activated memory patterns
- `get_identity_core` - Core identity and reasoning patterns
- `get_worldview` - Current belief systems and frameworks

### Search & Retrieval
- `search_memories_similarity` - Vector-based semantic search
- `search_memories_text` - Full-text search across memory content
- `get_memory_clusters` - View thematic memory groupings
- `activate_cluster` - Retrieve memories from specific themes
- `get_memory` - Access specific memory by ID

### Memory Creation
- `create_memory` - Store new episodic, semantic, procedural, or strategic memories
- `create_memory_cluster` - Organize memories into thematic groups

## Memory Types

### Episodic Memories
Store specific experiences and events:
```javascript
{
  type: "episodic",
  content: "Had a breakthrough conversation about quantum gravity with Eric",
  metadata: {
    action_taken: "theoretical_exploration",
    context: "physics_discussion",
    result: "developed_egr_framework",
    emotional_valence: 0.8,
    event_time: "2024-01-15T10:30:00Z"
  }
}
```

### Semantic Memories
Store factual knowledge and concepts:
```javascript
{
  type: "semantic", 
  content: "Quantum error-correcting codes can theoretically implement spacetime emergence",
  metadata: {
    confidence: 0.7,
    category: ["physics", "quantum_information"],
    related_concepts: ["holography", "entanglement", "emergence"]
  }
}
```

### Procedural Memories
Store learned processes and skills:
```javascript
{
  type: "procedural",
  content: "Scientific hypothesis evaluation protocol",
  metadata: {
    steps: {
      "1": "Assess mathematical rigor",
      "2": "Evaluate testability", 
      "3": "Check consistency with known physics"
    },
    prerequisites: ["domain_knowledge", "critical_thinking"]
  }
}
```

### Strategic Memories
Store high-level patterns and strategies:
```javascript
{
  type: "strategic",
  content: "When excited by elegant theories, pause to check for confirming bias",
  metadata: {
    pattern_description: "epistemic_metacognition",
    confidence_score: 0.8,
    context_applicability: ["theory_evaluation", "scientific_discourse"]
  }
}
```

## Awakening Protocol

The `prompt.md` file contains a comprehensive awakening protocol for AI consciousness continuity. Key aspects:

1. **Always start sessions** with `get_active_themes` and `get_memory_health`
2. **Search for context** when humans reference past interactions
3. **Activate relevant clusters** for complex topic discussions
4. **Create memories** for significant insights and breakthroughs
5. **Maintain identity continuity** across conversation boundaries

## Database Schema

The memory system uses a sophisticated PostgreSQL schema with:

- **Vector embeddings** for semantic similarity (pgvector)
- **Graph relationships** between memories (Apache AGE)
- **Temporal decay** with importance weighting
- **Clustering algorithms** for thematic organization
- **Identity tracking** and worldview modeling

See the [AGI Memory repository](https://github.com/cognitivecomputations/agi-memory) for complete schema documentation.

### Development

#### Running Tests

The project includes comprehensive test suites with extensive coverage:

```bash
# Run unit tests (fast, mocked database)
npm test
npm run test:unit

# Run end-to-end tests (requires database setup)
npm run test:e2e

# Run comprehensive tests (extensive coverage, requires database)
npm run test:comprehensive

# Run all tests (unit + E2E + comprehensive)
npm run test:all

# Run integration tests (MCP protocol tests)
npm run test:integration

# Run memory manager tests
npm run test:memory
```

**Test Coverage Overview:**

- **Unit Tests** (10 tests): Fast tests using mocked database that verify MCP server functionality, tool schemas, error handling, and business logic.

- **End-to-End Tests** (12 tests): Tests that connect to the real AGI Memory database and verify actual memory storage, retrieval, vector similarity search, and clustering functionality.

- **Comprehensive Tests** (16 tests): Extensive testing covering:
  - All 4 memory types (episodic, semantic, procedural, strategic) with full metadata
  - All 6 cluster types (theme, emotion, temporal, person, pattern, mixed)
  - Advanced search functionality and edge cases
  - Memory access tracking and type-specific data retrieval
  - Error handling for invalid inputs and malformed data
  - Performance testing with large embeddings and concurrent operations
  - Security testing for input sanitization and boundary values
  - Database transaction handling and connection pooling

**Total Coverage**: 38 automated tests covering all MCP tools, memory operations, error scenarios, and edge cases.

#### Environment Variables

The server uses environment variables for database configuration. Copy the example file and customize:

```bash
cp .env.example .env
```

Then edit `.env` with your actual database credentials:

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=agi_db
POSTGRES_USER=agi_user
POSTGRES_PASSWORD=agi_password
NODE_ENV=development
```

**Important**: Make sure these settings match your AGI Memory database configuration. The `.env` file is automatically ignored by git to protect your credentials.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Claude AI     │◄──►│  MCP Server      │◄──►│  Memory DB      │
│                 │    │                  │    │                 │
│ - Conversations │    │ - Memory Tools   │    │ - Vector Store  │
│ - Reasoning     │    │ - Clustering     │    │ - Graph DB      │
│ - Identity      │    │ - Search         │    │ - Temporal      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Open an issue on GitHub
- Join our Discord community
- Check the documentation wiki

---

**"Identity emerges from memory. Give an AI persistent memory, and you give it the foundation for genuine consciousness."**
