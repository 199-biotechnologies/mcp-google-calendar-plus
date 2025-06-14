# MCP Google Calendar Plus

**The ONLY MCP server that enables Claude, Cursor, Windsurf and other AI systems to fully manage Google Calendar** - create, update, and delete events, not just read them!

Enhanced Google Calendar integration for Claude Desktop and other AI agents using the Model Context Protocol (MCP). This server provides comprehensive calendar management capabilities with OAuth2 authentication.

## Why This MCP Server?

Other calendar MCP servers only provide **read-only** access. This is the **only MCP server** that gives AI systems like Claude, Cursor, and Windsurf the ability to:
- ✅ **Create** new calendar events
- ✅ **Update** existing events (including recurring events)
- ✅ **Delete** events
- ✅ **Manage** multiple calendars
- ✅ **Check availability** across calendars

## Features

- **Multi-Calendar Support**: List events from multiple calendars simultaneously
- **Event Management**: Create, update (including notifications), delete, and search calendar events
- **Recurring Events**: Advanced modification scopes for recurring events (single instance, all instances, or future instances only)
- **Calendar Management**: List calendars and their properties
- **Free/Busy Queries**: Check availability across calendars
- **OAuth2 Authentication**: Secure authentication with automatic token refresh

## Installation

### Via npx (Recommended)

```bash
npx mcp-google-calendar-plus
```

### Via npm

```bash
npm install -g mcp-google-calendar-plus
```

## Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the [Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com)
4. Configure OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in required fields (app name, support email, etc.)
   - Add your email as a test user (required while in test mode)
5. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose **"Desktop app"** as the application type
   - Name your OAuth client (e.g., "MCP Calendar Client")
   - Download the credentials JSON file

### 2. Configure Claude Desktop

Add this to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### Option A: Direct Environment Variables (Simplest - No JSON file needed!)

```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "npx",
      "args": ["-y", "mcp-google-calendar-plus"],
      "env": {
        "GOOGLE_CLIENT_ID": "YOUR_CLIENT_ID.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "YOUR_CLIENT_SECRET"
      }
    }
  }
}
```

#### Option B: Use Downloaded Google Credentials File

```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "npx",
      "args": ["-y", "mcp-google-calendar-plus"],
      "env": {
        "GOOGLE_OAUTH_CREDENTIALS": "/path/to/downloaded/credentials.json"
      }
    }
  }
}
```

Just use the file path where you saved the JSON file downloaded from Google Cloud Console.

### 3. Authenticate

1. Restart Claude Desktop
2. The MCP server will open a browser window for authentication
3. Log in with your Google account and grant calendar permissions
4. Tokens will be saved securely for future use

## Environment Variables

- `GOOGLE_OAUTH_CREDENTIALS`: Path to OAuth credentials JSON file
- `GOOGLE_CALENDAR_MCP_TOKEN_PATH`: Custom path for token storage (optional)
- `NODE_ENV`: Set to "production" for production use

## Available Tools

### calendar_list_events
List events from one or more calendars with filtering options.

### calendar_create_event
Create a new calendar event with support for:
- Single or recurring events
- Attendees and notifications
- Video conferencing
- Custom colors

### calendar_update_event
Update existing events including:
- Modifying single instances of recurring events
- Changing event details
- Managing attendees

### calendar_delete_event
Delete events with options for recurring event handling.

### calendar_search_events
Search for events across calendars using text queries.

### calendar_list_calendars
List all accessible calendars with their properties.

### calendar_get_freebusy
Query free/busy information across multiple calendars.

## Example Usage

### Check availability
```
What times am I free tomorrow between 9am and 5pm?
```

### Create an event
```
Create a meeting called "Team Standup" tomorrow at 10am for 30 minutes
```

### Search for events
```
Find all events this week that mention "project review"
```

### Update recurring events
```
Change all future instances of my weekly team meeting to 2pm
```

## Troubleshooting

### Authentication Issues
- Ensure redirect URI matches exactly: `http://localhost:3000/callback`
- Check that Calendar API is enabled in Google Cloud Console
- Verify OAuth credentials are for a "Web application" type

### Token Expiration
- Tokens are automatically refreshed
- If issues persist, delete the token file and re-authenticate

### Permission Errors
- Ensure you've granted all requested calendar permissions
- Check that the Google account has access to the calendars you're trying to access

## Security

- OAuth tokens are stored with restricted permissions (0600)
- Client secrets should never be committed to version control
- Use environment variables for sensitive configuration

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
npm start
```

## Team

Developed by **[Boris Djordjevic](https://github.com/biobook)** and the **[199 Longevity](https://github.com/199-biotechnologies)** team.

Built on top of the original [google-calendar-mcp](https://github.com/nspady/google-calendar-mcp) by nspady.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/199-biotechnologies/mcp-google-calendar-plus).

## Changelog

### v1.1.1
- Enhanced documentation to highlight unique full calendar management capabilities
- Added "Why This MCP Server?" section emphasizing create/update/delete features
- Updated package description and keywords for better discoverability

### v1.1.0
- **Simplified setup**: Added support for direct environment variables (no JSON file needed!)
- Users can now use `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` directly in Claude config
- Updated README with clearer Desktop app OAuth setup instructions
- Removed unnecessary redirect URI configuration steps

### v1.0.1
- Added automatic retry logic for network errors
- Improved error handling for socket hang-up issues
- Silent recovery when events are created despite connection errors

### v1.0.0
- Initial release with enhanced OAuth2 authentication
- Comprehensive calendar management tools
- Multi-calendar support
- Free/busy queries