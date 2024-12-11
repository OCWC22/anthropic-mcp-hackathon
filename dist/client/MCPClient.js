import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { GoogleDriveService } from '../services/GoogleDriveService.js';
import { KnowledgeGraphService } from '../services/KnowledgeGraphService.js';
import { z } from 'zod';
const resultSchema = z.object({
    content: z.object({
        text: z.string()
    })
});
export class MCPClient {
    constructor(graphUri, graphUsername, graphPassword) {
        this.client = new Client({
            name: "google-drive-mcp-client",
            version: "1.0.0",
        }, {
            capabilities: {
                sampling: {},
            },
        });
        this.driveService = new GoogleDriveService();
        this.graphService = new KnowledgeGraphService(graphUri, graphUsername, graphPassword);
    }
    async connect(serverCommand = 'node') {
        try {
            const transport = new StdioClientTransport({
                command: serverCommand,
                args: [],
            });
            await this.client.connect(transport);
            await this.driveService.authenticate();
        }
        catch (error) {
            throw new Error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async processGoogleDriveFolder(folderId) {
        try {
            // Get all files in the folder
            const files = await this.driveService.listFiles(folderId);
            // Process each file
            for (const file of files) {
                if (!file.id)
                    continue;
                // Create node for the file
                const fileNode = {
                    id: file.id,
                    type: 'File',
                    properties: {
                        name: file.name,
                        mimeType: file.mimeType,
                        createdTime: file.createdTime,
                        modifiedTime: file.modifiedTime,
                    }
                };
                await this.graphService.addNode(fileNode);
                // If it's a folder, process it recursively
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    await this.processGoogleDriveFolder(file.id);
                }
                else {
                    // Get file content and analyze it
                    const content = await this.driveService.getFileContent(file.id);
                    await this.analyzeContent(file.id, content);
                }
            }
            // Process emails
            const emails = await this.driveService.getEmails();
            for (const email of emails) {
                if (!email.id)
                    continue;
                const emailNode = {
                    id: email.id,
                    type: 'Email',
                    properties: {
                        threadId: email.threadId,
                    }
                };
                await this.graphService.addNode(emailNode);
            }
            // Process calendar events
            const events = await this.driveService.getCalendarEvents();
            for (const event of events) {
                if (!event.id)
                    continue;
                const eventNode = {
                    id: event.id,
                    type: 'Event',
                    properties: {
                        summary: event.summary,
                        start: event.start?.dateTime || event.start?.date,
                        end: event.end?.dateTime || event.end?.date,
                    }
                };
                await this.graphService.addNode(eventNode);
            }
        }
        catch (error) {
            throw new Error(`Failed to process folder: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async analyzeContent(fileId, content) {
        try {
            // Use MCP to analyze the content
            const result = await this.client.request({
                method: "sampling/createMessage",
                params: {
                    messages: [
                        {
                            role: "user",
                            content: {
                                type: "text",
                                text: `Analyze this content and identify key entities, concepts, and relationships: ${typeof content === 'string' ? content : JSON.stringify(content)}`,
                            },
                        },
                    ],
                    maxTokens: 1000,
                },
            }, z.object({
                model: z.string(),
                role: z.string(),
                content: z.object({
                    type: z.string(),
                    text: z.string()
                })
            }));
            // Process the analysis and create relationships
            const resultParsed = resultSchema.parse(result);
            const analysis = JSON.parse(resultParsed.content.text);
            // Create relationships based on analysis
            if (analysis.relationships) {
                for (const rel of analysis.relationships) {
                    const relationship = {
                        from: fileId,
                        to: rel.targetId,
                        type: rel.type,
                        properties: rel.properties || {}
                    };
                    await this.graphService.addRelationship(relationship);
                }
            }
        }
        catch (error) {
            console.error('Error analyzing content:', error instanceof Error ? error.message : String(error));
        }
    }
    async close() {
        await this.client.close();
        await this.graphService.close();
    }
}
