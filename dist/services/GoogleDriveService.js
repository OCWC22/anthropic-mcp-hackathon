import { google } from 'googleapis';
const SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.readonly'
];
export class GoogleDriveService {
    constructor() {
        this.auth = new google.auth.GoogleAuth({
            keyFile: 'credentials.json',
            scopes: SCOPES
        });
        this.drive = google.drive({
            version: 'v3',
            auth: this.auth
        });
        this.gmail = google.gmail({ version: 'v1', auth: this.auth });
        this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    }
    async authenticate() {
        await this.auth.getClient();
    }
    async listFiles(folderId) {
        try {
            const response = await this.drive.files.list({
                q: folderId ? `'${folderId}' in parents` : undefined,
                fields: 'files(id, name, mimeType, createdTime, modifiedTime)',
            });
            return response.data.files || [];
        }
        catch (error) {
            throw new Error(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getFileContent(fileId) {
        try {
            const response = await this.drive.files.get({
                fileId,
                alt: 'media',
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get file content: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getEmails() {
        try {
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                maxResults: 100,
            });
            return response.data.messages || [];
        }
        catch (error) {
            throw new Error(`Failed to get emails: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getCalendarEvents() {
        try {
            const response = await this.calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date().toISOString(),
                maxResults: 100,
                singleEvents: true,
                orderBy: 'startTime',
            });
            return response.data.items || [];
        }
        catch (error) {
            throw new Error(`Failed to get calendar events: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
