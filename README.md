# Anthropic MCP Google Drive Client

This client uses the Anthropic Model Context Protocol (MCP) to generate a memory knowledge graph from Google Drive data. It processes files, emails, and calendar events to create a connected graph of information.

## Features

- Connects to Google Drive, Gmail, and Google Calendar
- Processes documents, spreadsheets, and other file types
- Analyzes content using MCP to extract entities and relationships
- Stores the knowledge graph in Neo4j
- Handles folders recursively
- Maintains relationships between related items

## Prerequisites

1. Node.js 18 or higher
2. Neo4j database instance
3. Google Cloud project with Drive, Gmail, and Calendar APIs enabled
4. MCP server running locally or remotely

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd anthropic-mcp-drive-client
```

2. Install dependencies:
```bash
npm install
```

3. Set up Google Cloud credentials:
   - Create a project in Google Cloud Console
   - Enable Drive, Gmail, and Calendar APIs
   - Create OAuth 2.0 credentials
   - Download the credentials and save as `credentials.json` in the project root

4. Configure environment variables:
```bash
export NEO4J_URI=neo4j://localhost:7687
export NEO4J_USERNAME=neo4j
export NEO4J_PASSWORD=your-password
export MCP_SERVER_COMMAND=path-to-mcp-server
```

5. Build the project:
```bash
npm run build
```

## Usage

Run the client:
```bash
npm start
```

The client will:
1. Connect to the MCP server
2. Authenticate with Google services
3. Process your Google Drive folder
4. Create a knowledge graph in Neo4j

## Knowledge Graph Structure

The graph consists of these main node types:
- File: Documents, spreadsheets, etc.
- Email: Gmail messages
- Event: Calendar events

Relationships between nodes are created based on:
- Content analysis
- Temporal relationships
- References between items
- Shared metadata

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## License

MIT 