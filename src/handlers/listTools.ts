import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Extracted reminder properties definition for reusability
const remindersInputProperty = {
    type: "object",
    description: "Reminder settings for the event",
    properties: {
      useDefault: {
        type: "boolean",
        description: "Whether to use the default reminders",
      },
      overrides: {
        type: "array",
        description: "Custom reminders (uses popup notifications by default unless email is specified)",
        items: {
          type: "object",
          properties: {
            method: {
              type: "string",
              enum: ["email", "popup"],
              description: "Reminder method (defaults to popup unless email is specified)",
              default: "popup"
            },
            minutes: {
              type: "number",
              description: "Minutes before the event to trigger the reminder",
            }
          },
          required: ["minutes"]
        }
      }
    },
    required: ["useDefault"]
};

export function getToolDefinitions() {
  return {
    tools: [
      {
        name: "list-calendars",
        description: "List all available calendars",
        inputSchema: {
          type: "object",
          properties: {}, // No arguments needed
          required: [],
        },
      },
      {
        name: "list-events",
        description: "List events from one or more calendars",
        inputSchema: {
          type: "object",
          properties: {
            calendarId: {
              oneOf: [
                {
                  type: "string",
                  description: "ID of a single calendar"
                },
                {
                  type: "array",
                  description: "Array of calendar IDs",
                  items: {
                    type: "string"
                  },
                  minItems: 1,
                  maxItems: 50
                }
              ],
              description: "ID of the calendar(s) to list events from (use 'primary' for the main calendar)",
            },
            timeMin: {
              type: "string",
              format: "date-time",
              description: "Start time in ISO format with timezone required (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.",
            },
            timeMax: {
              type: "string",
              format: "date-time",
              description: "End time in ISO format with timezone required (e.g., 2024-12-31T23:59:59Z or 2024-12-31T23:59:59+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.",
            },
          },
          required: ["calendarId"],
        },
      },
      {
        name: "search-events",
        description: "Search for events in a calendar by text query",
        inputSchema: {
          type: "object",
          properties: {
            calendarId: {
              type: "string",
              description: "ID of the calendar to search events in (use 'primary' for the main calendar)",
            },
            query: {
              type: "string",
              description: "Free text search query (searches summary, description, location, attendees, etc.)",
            },
            timeMin: {
              type: "string",
              format: "date-time",
              description: "Start time boundary in ISO format with timezone required (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.",
            },
            timeMax: {
              type: "string",
              format: "date-time",
              description: "End time boundary in ISO format with timezone required (e.g., 2024-12-31T23:59:59Z or 2024-12-31T23:59:59+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.",
            },
          },
          required: ["calendarId", "query"],
        },
      },
      {
        name: "list-colors",
        description: "List available color IDs and their meanings for calendar events",
        inputSchema: {
          type: "object",
          properties: {}, // No arguments needed
          required: [],
        },
      },
      {
        name: "create-event",
        description: "Create a new calendar event",
        inputSchema: {
          type: "object",
          properties: {
            calendarId: {
              type: "string",
              description: "ID of the calendar to create the event in (use 'primary' for the main calendar)",
            },
            summary: {
              type: "string",
              description: "Title of the event",
            },
            description: {
              type: "string",
              description: "Description/notes for the event (optional)",
            },
            start: {
              type: "string",
              format: "date-time",
              description: "Start time in ISO format with timezone required (e.g., 2024-08-15T10:00:00Z or 2024-08-15T10:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset.",
            },
            end: {
              type: "string",
              format: "date-time",
              description: "End time in ISO format with timezone required (e.g., 2024-08-15T11:00:00Z or 2024-08-15T11:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset.",
            },
            timeZone: {
              type: "string",
              description:
                "Timezone of the event start/end times, formatted as an IANA Time Zone Database name (e.g., America/Los_Angeles). Required if start/end times are specified, especially for recurring events.",
            },
            location: {
              type: "string",
              description: "Location of the event (optional)",
            },
            attendees: {
              type: "array",
              description: "List of attendee email addresses (optional)",
              items: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    description: "Email address of the attendee",
                  },
                },
                required: ["email"],
              },
            },
            colorId: {
              type: "string",
              description: "Color ID for the event (optional, use list-colors to see available IDs)",
            },
            reminders: remindersInputProperty,
            recurrence: {
              type: "array",
              description:
                "List of recurrence rules (RRULE, EXRULE, RDATE, EXDATE) in RFC5545 format (optional). Example: [\"RRULE:FREQ=WEEKLY;COUNT=5\"]",
              items: {
                type: "string"
              }
            },
          },
          required: ["calendarId", "summary", "start", "end", "timeZone"],
        },
      },
      {
        name: "update-event",
        description: "Update an existing calendar event with recurring event modification scope support",
        inputSchema: {
          type: "object",
          properties: {
            calendarId: {
              type: "string",
              description: "ID of the calendar containing the event",
            },
            eventId: {
              type: "string",
              description: "ID of the event to update",
            },
            summary: {
              type: "string",
              description: "New title for the event (optional)",
            },
            description: {
              type: "string",
              description: "New description for the event (optional)",
            },
            start: {
              type: "string",
              format: "date-time",
              description: "New start time in ISO format with timezone required (e.g., 2024-08-15T10:00:00Z or 2024-08-15T10:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset.",
            },
            end: {
              type: "string",
              format: "date-time",
              description: "New end time in ISO format with timezone required (e.g., 2024-08-15T11:00:00Z or 2024-08-15T11:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset.",
            },
            timeZone: {
              type: "string",
              description:
                "Timezone for the start/end times (IANA format, e.g., America/Los_Angeles). Required if modifying start/end, or for recurring events.",
            },
            location: {
              type: "string",
              description: "New location for the event (optional)",
            },
            colorId: {
              type: "string",
              description: "New color ID for the event (optional)",
            },
            attendees: {
              type: "array",
              description: "New list of attendee email addresses (optional, replaces existing attendees)",
              items: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    description: "Email address of the attendee",
                  },
                },
                required: ["email"],
              },
            },
            reminders: {
                ...remindersInputProperty,
                description: "New reminder settings for the event (optional)",
            },
            recurrence: {
              type: "array",
              description:
                "New list of recurrence rules (RFC5545 format, optional, replaces existing rules). Example: [\"RRULE:FREQ=DAILY;COUNT=10\"]",
              items: {
                type: "string"
              }
            },
            modificationScope: {
              type: "string",
              enum: ["single", "all", "future"],
              default: "all",
              description: "Scope of modification for recurring events: 'single' (one instance), 'all' (entire series), 'future' (this and future instances). Defaults to 'all' for backward compatibility."
            },
            originalStartTime: {
              type: "string",
              format: "date-time",
              description: "Required when modificationScope is 'single'. Original start time of the specific instance to modify in ISO format with timezone (e.g., 2024-08-15T10:00:00-07:00)."
            },
            futureStartDate: {
              type: "string", 
              format: "date-time",
              description: "Required when modificationScope is 'future'. Start date for future modifications in ISO format with timezone (e.g., 2024-08-20T10:00:00-07:00). Must be a future date."
            }
          },
          required: ["calendarId", "eventId", "timeZone"], // timeZone is technically required for PATCH
          allOf: [
            {
              if: { 
                properties: { 
                  modificationScope: { const: "single" } 
                } 
              },
              then: { 
                required: ["originalStartTime"] 
              }
            },
            {
              if: { 
                properties: { 
                  modificationScope: { const: "future" } 
                } 
              },
              then: { 
                required: ["futureStartDate"] 
              }
            }
          ]
        },
      },
      {
        name: "delete-event",
        description: "Delete a calendar event",
        inputSchema: {
          type: "object",
          properties: {
            calendarId: {
              type: "string",
              description: "ID of the calendar containing the event",
            },
            eventId: {
              type: "string",
              description: "ID of the event to delete",
            },
          },
          required: ["calendarId", "eventId"],
        },
      },
      {
        name: "get-freebusy",
        description: "Retrieve free/busy information for one or more calendars within a time range",
        inputSchema: {
          type: "object",
          properties: {
            timeMin: {
              type: "string",
              description: "The start of the interval in RFC3339 format",
            },
            timeMax: {
              type: "string",
              description: "The end of the interval in RFC3339 format",
            },
            timeZone: {
              type: "string",
              description: "Optional. Time zone used in the response (default is UTC)",
            },
            groupExpansionMax: {
              type: "integer",
              description: "Optional. Maximum number of calendar identifiers to expand per group (max 100)",
            },
            calendarExpansionMax: {
              type: "integer",
              description: "Optional. Maximum number of calendars to expand (max 50)",
            },
            items: {
              type: "array",
              description: "List of calendar or group identifiers to check for availability",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "The identifier of a calendar or group, it usually is a mail format",
                  },
                },
                required: ["id"],
              },
            },
          },
          required: ["timeMin", "timeMax", "items"],
        },
      },
      {
        name: "list-contacts",
        description: "List contacts from Google Contacts",
        inputSchema: {
          type: "object",
          properties: {
            pageSize: {
              type: "number",
              description: "Maximum number of contacts to return (default: 100, max: 2000)",
            },
            pageToken: {
              type: "string",
              description: "Token for pagination to get the next page of results",
            },
            query: {
              type: "string",
              description: "Optional search query to filter contacts",
            },
            personFields: {
              type: "array",
              description: "Fields to include in the response (default: names,emailAddresses,phoneNumbers,addresses,organizations,biographies,photos)",
              items: {
                type: "string",
                enum: ["addresses", "ageRanges", "biographies", "birthdays", "calendarUrls", "clientData", "coverPhotos", "emailAddresses", "events", "externalIds", "genders", "imClients", "interests", "locales", "locations", "memberships", "metadata", "miscKeywords", "names", "nicknames", "occupations", "organizations", "phoneNumbers", "photos", "relations", "sipAddresses", "skills", "urls", "userDefined"]
              }
            },
            sources: {
              type: "array",
              description: "Sources to get contacts from (default: READ_SOURCE_TYPE_CONTACT)",
              items: {
                type: "string",
                enum: ["READ_SOURCE_TYPE_CONTACT", "READ_SOURCE_TYPE_PROFILE", "READ_SOURCE_TYPE_DOMAIN_PROFILE", "READ_SOURCE_TYPE_OTHER_CONTACT"]
              }
            }
          },
          required: [],
        },
      },
      {
        name: "get-contact",
        description: "Get details of a specific contact",
        inputSchema: {
          type: "object",
          properties: {
            resourceName: {
              type: "string",
              description: "Resource name of the contact (e.g., 'people/c1234567890')",
            },
            personFields: {
              type: "array",
              description: "Fields to include in the response",
              items: {
                type: "string",
                enum: ["addresses", "ageRanges", "biographies", "birthdays", "calendarUrls", "clientData", "coverPhotos", "emailAddresses", "events", "externalIds", "genders", "imClients", "interests", "locales", "locations", "memberships", "metadata", "miscKeywords", "names", "nicknames", "occupations", "organizations", "phoneNumbers", "photos", "relations", "sipAddresses", "skills", "urls", "userDefined"]
              }
            }
          },
          required: ["resourceName"],
        },
      },
      {
        name: "create-contact",
        description: "Create a new contact in Google Contacts",
        inputSchema: {
          type: "object",
          properties: {
            givenName: {
              type: "string",
              description: "First name of the contact",
            },
            familyName: {
              type: "string",
              description: "Last name of the contact",
            },
            middleName: {
              type: "string",
              description: "Middle name of the contact",
            },
            displayName: {
              type: "string",
              description: "Display name (defaults to 'givenName familyName' if not provided)",
            },
            emailAddresses: {
              type: "array",
              description: "Email addresses for the contact",
              items: {
                type: "object",
                properties: {
                  value: {
                    type: "string",
                    format: "email",
                    description: "Email address",
                  },
                  type: {
                    type: "string",
                    enum: ["home", "work", "other"],
                    description: "Type of email address (default: home)",
                  },
                },
                required: ["value"],
              },
            },
            phoneNumbers: {
              type: "array",
              description: "Phone numbers for the contact",
              items: {
                type: "object",
                properties: {
                  value: {
                    type: "string",
                    description: "Phone number",
                  },
                  type: {
                    type: "string",
                    enum: ["home", "work", "mobile", "homeFax", "workFax", "otherFax", "pager", "workMobile", "workPager", "main", "googleVoice", "other"],
                    description: "Type of phone number (default: home)",
                  },
                },
                required: ["value"],
              },
            },
            addresses: {
              type: "array",
              description: "Physical addresses for the contact",
              items: {
                type: "object",
                properties: {
                  streetAddress: {
                    type: "string",
                    description: "Street address",
                  },
                  city: {
                    type: "string",
                    description: "City",
                  },
                  region: {
                    type: "string",
                    description: "State or region",
                  },
                  postalCode: {
                    type: "string",
                    description: "Postal or ZIP code",
                  },
                  country: {
                    type: "string",
                    description: "Country",
                  },
                  type: {
                    type: "string",
                    enum: ["home", "work", "other"],
                    description: "Type of address (default: home)",
                  },
                },
              },
            },
            organizations: {
              type: "array",
              description: "Organizations/companies for the contact",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Organization name",
                  },
                  title: {
                    type: "string",
                    description: "Job title",
                  },
                  department: {
                    type: "string",
                    description: "Department",
                  },
                  type: {
                    type: "string",
                    enum: ["work", "school", "other"],
                    description: "Type of organization (default: work)",
                  },
                },
              },
            },
            biographies: {
              type: "array",
              description: "Biographical information",
              items: {
                type: "object",
                properties: {
                  value: {
                    type: "string",
                    description: "Biography text",
                  },
                  contentType: {
                    type: "string",
                    enum: ["TEXT_PLAIN", "TEXT_HTML"],
                    description: "Content type (default: TEXT_PLAIN)",
                  },
                },
                required: ["value"],
              },
            },
            notes: {
              type: "string",
              description: "Notes about the contact (will be added as a biography if biographies not provided)",
            },
          },
          required: [],
        },
      },
      {
        name: "update-contact",
        description: "Update an existing contact",
        inputSchema: {
          type: "object",
          properties: {
            resourceName: {
              type: "string",
              description: "Resource name of the contact to update (e.g., 'people/c1234567890')",
            },
            updatePersonFields: {
              type: "array",
              description: "Fields to update (must specify which fields are being updated)",
              items: {
                type: "string",
                enum: ["names", "emailAddresses", "phoneNumbers", "addresses", "organizations", "biographies"]
              }
            },
            givenName: {
              type: "string",
              description: "First name (required if updating names)",
            },
            familyName: {
              type: "string",
              description: "Last name (required if updating names)",
            },
            middleName: {
              type: "string",
              description: "Middle name",
            },
            displayName: {
              type: "string",
              description: "Display name",
            },
            emailAddresses: {
              type: "array",
              description: "Email addresses (replaces all existing if updating)",
              items: {
                type: "object",
                properties: {
                  value: {
                    type: "string",
                    format: "email",
                    description: "Email address",
                  },
                  type: {
                    type: "string",
                    enum: ["home", "work", "other"],
                    description: "Type of email address",
                  },
                },
                required: ["value"],
              },
            },
            phoneNumbers: {
              type: "array",
              description: "Phone numbers (replaces all existing if updating)",
              items: {
                type: "object",
                properties: {
                  value: {
                    type: "string",
                    description: "Phone number",
                  },
                  type: {
                    type: "string",
                    enum: ["home", "work", "mobile", "homeFax", "workFax", "otherFax", "pager", "workMobile", "workPager", "main", "googleVoice", "other"],
                    description: "Type of phone number",
                  },
                },
                required: ["value"],
              },
            },
            addresses: {
              type: "array",
              description: "Physical addresses (replaces all existing if updating)",
              items: {
                type: "object",
                properties: {
                  streetAddress: {
                    type: "string",
                    description: "Street address",
                  },
                  city: {
                    type: "string",
                    description: "City",
                  },
                  region: {
                    type: "string",
                    description: "State or region",
                  },
                  postalCode: {
                    type: "string",
                    description: "Postal or ZIP code",
                  },
                  country: {
                    type: "string",
                    description: "Country",
                  },
                  type: {
                    type: "string",
                    enum: ["home", "work", "other"],
                    description: "Type of address",
                  },
                },
              },
            },
            organizations: {
              type: "array",
              description: "Organizations (replaces all existing if updating)",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Organization name",
                  },
                  title: {
                    type: "string",
                    description: "Job title",
                  },
                  department: {
                    type: "string",
                    description: "Department",
                  },
                  type: {
                    type: "string",
                    enum: ["work", "school", "other"],
                    description: "Type of organization",
                  },
                },
              },
            },
            biographies: {
              type: "array",
              description: "Biographical information (replaces all existing if updating)",
              items: {
                type: "object",
                properties: {
                  value: {
                    type: "string",
                    description: "Biography text",
                  },
                  contentType: {
                    type: "string",
                    enum: ["TEXT_PLAIN", "TEXT_HTML"],
                    description: "Content type",
                  },
                },
                required: ["value"],
              },
            },
          },
          required: ["resourceName", "updatePersonFields"],
        },
      },
      {
        name: "delete-contact",
        description: "Delete a contact",
        inputSchema: {
          type: "object",
          properties: {
            resourceName: {
              type: "string",
              description: "Resource name of the contact to delete (e.g., 'people/c1234567890')",
            },
          },
          required: ["resourceName"],
        },
      },
      {
        name: "list-emails",
        description: "List and search emails from Gmail",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Gmail search query (e.g., 'is:unread', 'from:someone@example.com', 'subject:meeting', 'has:attachment')",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of emails to return (default: 20, max: 500)",
            },
            pageToken: {
              type: "string",
              description: "Token for pagination to get the next page of results",
            },
            includeSpamTrash: {
              type: "boolean",
              description: "Include emails from SPAM and TRASH (default: false)",
            },
            labelIds: {
              type: "array",
              description: "Filter by specific label IDs",
              items: {
                type: "string"
              }
            }
          },
          required: [],
        },
      },
      {
        name: "get-email",
        description: "Get a specific email with full content",
        inputSchema: {
          type: "object",
          properties: {
            messageId: {
              type: "string",
              description: "The ID of the email message to retrieve",
            },
            markAsRead: {
              type: "boolean",
              description: "Mark the email as read when retrieving (default: true)",
            },
            format: {
              type: "string",
              enum: ["full", "metadata", "minimal"],
              description: "The format to return the message in (default: full)",
            }
          },
          required: ["messageId"],
        },
      },
      {
        name: "send-email",
        description: "Send a new email",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              oneOf: [
                { type: "string", format: "email" },
                { type: "array", items: { type: "string", format: "email" } }
              ],
              description: "Recipient email address(es)",
            },
            subject: {
              type: "string",
              description: "Email subject line",
            },
            body: {
              type: "string",
              description: "Email body content",
            },
            cc: {
              oneOf: [
                { type: "string", format: "email" },
                { type: "array", items: { type: "string", format: "email" } }
              ],
              description: "CC recipient email address(es)",
            },
            bcc: {
              oneOf: [
                { type: "string", format: "email" },
                { type: "array", items: { type: "string", format: "email" } }
              ],
              description: "BCC recipient email address(es)",
            },
            isHtml: {
              type: "boolean",
              description: "Whether the body is HTML content (default: false)",
            },
            replyToMessageId: {
              type: "string",
              description: "Message ID to reply to (for threading)",
            },
            threadId: {
              type: "string",
              description: "Thread ID to reply within",
            }
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "update-email",
        description: "Update email properties (labels, read status, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            emailId: {
              type: "string",
              description: "The ID of the email message to update",
            },
            addLabelIds: {
              type: "array",
              description: "Label IDs to add to the email",
              items: { type: "string" }
            },
            removeLabelIds: {
              type: "array",
              description: "Label IDs to remove from the email",
              items: { type: "string" }
            },
            markAsRead: {
              type: "boolean",
              description: "Mark the email as read",
            },
            markAsUnread: {
              type: "boolean",
              description: "Mark the email as unread",
            },
            star: {
              type: "boolean",
              description: "Star the email",
            },
            unstar: {
              type: "boolean",
              description: "Unstar the email",
            },
            markAsImportant: {
              type: "boolean",
              description: "Mark as important",
            },
            markAsNotImportant: {
              type: "boolean",
              description: "Mark as not important",
            },
            archive: {
              type: "boolean",
              description: "Archive the email (remove from inbox)",
            },
            unarchive: {
              type: "boolean",
              description: "Unarchive the email (add to inbox)",
            },
            moveToTrash: {
              type: "boolean",
              description: "Move to trash",
            },
            removeFromTrash: {
              type: "boolean",
              description: "Remove from trash",
            }
          },
          required: ["messageId"],
        },
      },
      {
        name: "delete-email",
        description: "Delete an email (move to trash or permanently delete)",
        inputSchema: {
          type: "object",
          properties: {
            messageId: {
              type: "string",
              description: "The ID of the email message to delete",
            },
            permanent: {
              type: "boolean",
              description: "Permanently delete instead of moving to trash (default: false)",
            }
          },
          required: ["messageId"],
        },
      },
      {
        name: "create-draft",
        description: "Create an email draft",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              oneOf: [
                { type: "string", format: "email" },
                { type: "array", items: { type: "string", format: "email" } }
              ],
              description: "Recipient email address(es)",
            },
            subject: {
              type: "string",
              description: "Email subject line",
            },
            body: {
              type: "string",
              description: "Email body content",
            },
            cc: {
              oneOf: [
                { type: "string", format: "email" },
                { type: "array", items: { type: "string", format: "email" } }
              ],
              description: "CC recipient email address(es)",
            },
            bcc: {
              oneOf: [
                { type: "string", format: "email" },
                { type: "array", items: { type: "string", format: "email" } }
              ],
              description: "BCC recipient email address(es)",
            },
            isHtml: {
              type: "boolean",
              description: "Whether the body is HTML content (default: false)",
            },
            replyToMessageId: {
              type: "string",
              description: "Message ID to reply to (for threading)",
            },
            threadId: {
              type: "string",
              description: "Thread ID to reply within",
            }
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "update-draft",
        description: "Update an existing email draft",
        inputSchema: {
          type: "object",
          properties: {
            draftId: {
              type: "string",
              description: "The ID of the draft to update",
            },
            to: {
              oneOf: [
                { type: "string", format: "email" },
                { type: "array", items: { type: "string", format: "email" } }
              ],
              description: "Recipient email address(es)",
            },
            subject: {
              type: "string",
              description: "Email subject line",
            },
            body: {
              type: "string",
              description: "Email body content",
            },
            cc: {
              oneOf: [
                { type: "string", format: "email" },
                { type: "array", items: { type: "string", format: "email" } }
              ],
              description: "CC recipient email address(es)",
            },
            bcc: {
              oneOf: [
                { type: "string", format: "email" },
                { type: "array", items: { type: "string", format: "email" } }
              ],
              description: "BCC recipient email address(es)",
            },
            isHtml: {
              type: "boolean",
              description: "Whether the body is HTML content (default: false)",
            },
            replyToMessageId: {
              type: "string",
              description: "Message ID to reply to (for threading)",
            },
            threadId: {
              type: "string",
              description: "Thread ID to reply within",
            }
          },
          required: ["draftId", "to", "subject", "body"],
        },
      },
      {
        name: "send-draft",
        description: "Send an existing email draft",
        inputSchema: {
          type: "object",
          properties: {
            draftId: {
              type: "string",
              description: "The ID of the draft to send",
            }
          },
          required: ["draftId"],
        },
      },
      {
        name: "list-labels",
        description: "List all Gmail labels/folders",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "create-label",
        description: "Create a new Gmail label/folder",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the label",
            },
            messageListVisibility: {
              type: "string",
              enum: ["show", "hide"],
              description: "Whether to show messages with this label in message lists (default: show)",
            },
            labelListVisibility: {
              type: "string",
              enum: ["labelShow", "labelShowIfUnread", "labelHide"],
              description: "Whether to show this label in the label list (default: labelShow)",
            },
            backgroundColor: {
              type: "string",
              description: "Background color for the label (hex color like '#0000FF')",
            },
            textColor: {
              type: "string",
              description: "Text color for the label (hex color like '#FFFFFF')",
            }
          },
          required: ["name"],
        },
      },
      {
        name: "update-label",
        description: "Update a Gmail label/folder",
        inputSchema: {
          type: "object",
          properties: {
            labelId: {
              type: "string",
              description: "The ID of the label to update",
            },
            name: {
              type: "string",
              description: "New name for the label",
            },
            messageListVisibility: {
              type: "string",
              enum: ["show", "hide"],
              description: "Whether to show messages with this label in message lists",
            },
            labelListVisibility: {
              type: "string",
              enum: ["labelShow", "labelShowIfUnread", "labelHide"],
              description: "Whether to show this label in the label list",
            },
            backgroundColor: {
              type: "string",
              description: "Background color for the label (hex color)",
            },
            textColor: {
              type: "string",
              description: "Text color for the label (hex color)",
            }
          },
          required: ["labelId"],
        },
      },
      {
        name: "delete-label",
        description: "Delete a Gmail label/folder",
        inputSchema: {
          type: "object",
          properties: {
            labelId: {
              type: "string",
              description: "The ID of the label to delete",
            }
          },
          required: ["labelId"],
        },
      },
      {
        name: "batch-update-emails",
        description: "Update multiple emails at once",
        inputSchema: {
          type: "object",
          properties: {
            messageIds: {
              type: "array",
              description: "Array of email message IDs to update",
              items: { type: "string" },
              minItems: 1
            },
            addLabelIds: {
              type: "array",
              description: "Label IDs to add to all emails",
              items: { type: "string" }
            },
            removeLabelIds: {
              type: "array",
              description: "Label IDs to remove from all emails",
              items: { type: "string" }
            },
            markAsRead: {
              type: "boolean",
              description: "Mark all emails as read",
            },
            markAsUnread: {
              type: "boolean",
              description: "Mark all emails as unread",
            },
            star: {
              type: "boolean",
              description: "Star all emails",
            },
            unstar: {
              type: "boolean",
              description: "Unstar all emails",
            },
            markAsImportant: {
              type: "boolean",
              description: "Mark all as important",
            },
            markAsNotImportant: {
              type: "boolean",
              description: "Mark all as not important",
            },
            archive: {
              type: "boolean",
              description: "Archive all emails",
            },
            unarchive: {
              type: "boolean",
              description: "Unarchive all emails",
            },
            moveToTrash: {
              type: "boolean",
              description: "Move all to trash",
            }
          },
          required: ["messageIds"],
        },
      }
    ],
  };
}