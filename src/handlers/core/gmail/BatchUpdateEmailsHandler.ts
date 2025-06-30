import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { google, gmail_v1 } from "googleapis";
import { BaseToolHandler } from "../BaseToolHandler.js";

interface BatchUpdateEmailsArgs {
  messageIds: string[];
  addLabelIds?: string[];
  removeLabelIds?: string[];
  markAsRead?: boolean;
  markAsUnread?: boolean;
  star?: boolean;
  unstar?: boolean;
  markAsImportant?: boolean;
  markAsNotImportant?: boolean;
  archive?: boolean;
  unarchive?: boolean;
  moveToTrash?: boolean;
}

export class BatchUpdateEmailsHandler extends BaseToolHandler {
  async runTool(args: BatchUpdateEmailsArgs, oauth2Client: OAuth2Client): Promise<CallToolResult> {
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
      
      // Handle trash operation separately
      if (args.moveToTrash) {
        // Batch delete (move to trash)
        await gmail.users.messages.batchDelete({
          userId: 'me',
          requestBody: {
            ids: args.messageIds
          }
        });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                action: 'batch_moved_to_trash',
                messageCount: args.messageIds.length,
                messageIds: args.messageIds
              }, null, 2)
            }
          ]
        };
      }
      
      // Remove duplicates and conflicts
      const uniqueAddLabelIds = [...new Set(addLabelIds)];
      const uniqueRemoveLabelIds = [...new Set(removeLabelIds)];
      
      // Remove any labels that appear in both lists
      const finalAddLabelIds = uniqueAddLabelIds.filter(id => !uniqueRemoveLabelIds.includes(id));
      const finalRemoveLabelIds = uniqueRemoveLabelIds.filter(id => !uniqueAddLabelIds.includes(id));
      
      // Batch modify labels
      if (finalAddLabelIds.length > 0 || finalRemoveLabelIds.length > 0) {
        console.log('BatchUpdateEmails - Calling batchModify with:', {
          messageIds: args.messageIds,
          addLabelIds: finalAddLabelIds,
          removeLabelIds: finalRemoveLabelIds
        });
        
        const response = await gmail.users.messages.batchModify({
          userId: 'me',
          requestBody: {
            ids: args.messageIds,
            addLabelIds: finalAddLabelIds.length > 0 ? finalAddLabelIds : undefined,
            removeLabelIds: finalRemoveLabelIds.length > 0 ? finalRemoveLabelIds : undefined
          }
        });
        
        console.log('BatchUpdateEmails - API response:', response.status, response.statusText);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                action: 'batch_modified',
                messageCount: args.messageIds.length,
                messageIds: args.messageIds,
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
              message: 'No changes were made',
              messageCount: args.messageIds.length
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error('BatchUpdateEmails - Error details:', {
        message: error.message,
        code: error.code,
        errors: error.errors,
        response: error.response?.data
      });
      this.handleGoogleApiError(error);
      throw error;
    }
  }
}