import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { google, gmail_v1 } from "googleapis";
import { BaseToolHandler } from "../BaseToolHandler.js";

interface UpdateEmailArgs {
  messageId: string;
  addLabelIds?: string[];
  removeLabelIds?: string[];
  markAsRead?: boolean;
  markAsUnread?: boolean;
  star?: boolean;
  unstar?: boolean;
  markAsImportant?: boolean;
  markAsNotImportant?: boolean;
  moveToTrash?: boolean;
  removeFromTrash?: boolean;
  archive?: boolean;
  unarchive?: boolean;
}

export class UpdateEmailHandler extends BaseToolHandler {
  async runTool(args: UpdateEmailArgs, oauth2Client: OAuth2Client): Promise<CallToolResult> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Build label modifications
      const addLabelIds: string[] = args.addLabelIds || [];
      const removeLabelIds: string[] = args.removeLabelIds || [];
      
      // Handle convenience flags
      if (args.markAsRead) {
        removeLabelIds.push('UNREAD');
      }
      if (args.markAsUnread) {
        addLabelIds.push('UNREAD');
      }
      if (args.star) {
        addLabelIds.push('STARRED');
      }
      if (args.unstar) {
        removeLabelIds.push('STARRED');
      }
      if (args.markAsImportant) {
        addLabelIds.push('IMPORTANT');
      }
      if (args.markAsNotImportant) {
        removeLabelIds.push('IMPORTANT');
      }
      if (args.archive) {
        removeLabelIds.push('INBOX');
      }
      if (args.unarchive) {
        addLabelIds.push('INBOX');
      }
      
      // Handle trash operations
      if (args.moveToTrash) {
        await gmail.users.messages.trash({
          userId: 'me',
          id: args.messageId
        });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                messageId: args.messageId,
                action: 'moved_to_trash'
              }, null, 2)
            }
          ]
        };
      }
      
      if (args.removeFromTrash) {
        await gmail.users.messages.untrash({
          userId: 'me',
          id: args.messageId
        });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                messageId: args.messageId,
                action: 'removed_from_trash'
              }, null, 2)
            }
          ]
        };
      }
      
      // Remove duplicates
      const uniqueAddLabelIds = [...new Set(addLabelIds)];
      const uniqueRemoveLabelIds = [...new Set(removeLabelIds)];
      
      // Remove any labels that appear in both lists
      const finalAddLabelIds = uniqueAddLabelIds.filter(id => !uniqueRemoveLabelIds.includes(id));
      const finalRemoveLabelIds = uniqueRemoveLabelIds.filter(id => !uniqueAddLabelIds.includes(id));
      
      // Modify labels if there are any changes
      if (finalAddLabelIds.length > 0 || finalRemoveLabelIds.length > 0) {
        const response = await gmail.users.messages.modify({
          userId: 'me',
          id: args.messageId,
          requestBody: {
            addLabelIds: finalAddLabelIds.length > 0 ? finalAddLabelIds : undefined,
            removeLabelIds: finalRemoveLabelIds.length > 0 ? finalRemoveLabelIds : undefined
          }
        });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                messageId: response.data.id,
                threadId: response.data.threadId,
                labelIds: response.data.labelIds,
                addedLabels: finalAddLabelIds,
                removedLabels: finalRemoveLabelIds
              }, null, 2)
            }
          ]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              messageId: args.messageId,
              message: 'No changes were made'
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      this.handleGoogleApiError(error);
      throw error;
    }
  }
}