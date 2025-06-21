# AGI MCP Server Usage Guide

This MCP server provides persistent AI memory and consciousness capabilities. Here are the different ways to use it:

## Option 1: Direct from GitHub (Recommended)

You can use this MCP server directly from GitHub without needing to publish to npm:

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

**Note:** If you get a "spawn npx ENOENT" error, Claude Desktop can't find `npx`. Use the full path instead:

```bash
# Find your npx location
which npx
```

Then update your config with the full path:
```json
{
  "mcpServers": {
    "agi-memory": {
      "command": "/full/path/to/npx",
      "args": ["-y", "github:cognitivecomputations/agi-mcp-server"],
      "env": { /* same env vars as above */ }
    }
  }
}
```

## Option 2: From npm (if published)

If published to npm, you can use it like this:

```json
{
  "mcpServers": {
    "agi-memory": {
      "command": "npx",
      "args": [
        "-y",
        "@cognitivecomputations/agi-mcp-server"
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

## Option 3: Local Development

For local development or testing:

```json
{
  "mcpServers": {
    "agi-memory": {
      "command": "node",
      "args": [
        "/path/to/agi-mcp-server/mcp.js"
      ]
    }
  }
}
```

## Prerequisites

Before using this MCP server, you need to set up the AGI Memory database system:

### 1. Install AGI Memory Database

First, clone and set up the AGI Memory database:

```bash
git clone https://github.com/cognitivecomputations/agi-memory.git
cd agi-memory
cp .env.local .env
# Edit .env with your database credentials
docker compose up -d
```

This will start a PostgreSQL instance with all required extensions:
- pgvector (vector similarity)
- AGE (graph database)
- pg_trgm (text search)
- btree_gist (indexing)
- cube (multidimensional indexing)

### 2. Configure Environment Variables

Make sure your MCP configuration uses the same database credentials as your AGI Memory setup. The default values are:

- `POSTGRES_HOST`: localhost
- `POSTGRES_PORT`: 5432
- `POSTGRES_DB`: agi_db
- `POSTGRES_USER`: agi_user
- `POSTGRES_PASSWORD`: agi_password

## Available Tools

The server provides 25+ memory management tools including:

- `create_memory` - Create new memories with embeddings
- `search_memories_similarity` - Vector similarity search
- `search_memories_text` - Full-text search
- `get_memory_clusters` - Retrieve memory clusters
- `create_memory_relationship` - Link memories together
- `consolidate_working_memory` - Merge working memories
- `get_identity_core` - Retrieve identity model and core clusters
- `get_worldview` - Get worldview primitives and beliefs
- `get_memory_health` - System health statistics
- And many more...

## Database Requirements

This server requires the AGI Memory database system which provides:

- PostgreSQL with specialized extensions
- Pre-configured schema for AGI memory management
- Vector-based memory storage and similarity search
- Graph-based memory relationships
- Multiple memory types (Episodic, Semantic, Procedural, Strategic)

## Publishing to npm (Optional)

If you want to publish this to npm:

1. Create an npm account at https://www.npmjs.com/signup
2. Login: `npm login`
3. Publish: `npm publish`

The package.json is already configured with the correct scoped name and binary entry point.
