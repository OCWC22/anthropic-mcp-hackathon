import { MCPClient } from './client/MCPClient';
async function main() {
    try {
        console.log('Connecting to MCP server and authenticating with Google...');
        const client = new MCPClient('neo4j://localhost:7687', // Your graph DB URI
        'neo4j', // Username
        'password' // Password
        );
        await client.connect();
        // Process Google Drive folder
        await client.processGoogleDriveFolder();
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
main();
