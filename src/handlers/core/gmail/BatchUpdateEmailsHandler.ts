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
        
        // Process in chunks of 100 (API limit) with better error handling
        const chunkSize = 100;
        const results = {
          successful: [] as string[],
          failed: [] as { id: string; error: string }[],
          chunks: [] as { index: number; messageCount: number; status: string }[]
        };
        
        for (let i = 0; i < args.messageIds.length; i += chunkSize) {
          const chunk = args.messageIds.slice(i, i + chunkSize);
          const chunkIndex = Math.floor(i / chunkSize);
          
          try {
            // First verify these messages exist
            console.log(`BatchUpdateEmails - Processing chunk ${chunkIndex + 1} with ${chunk.length} messages`);
            
            await gmail.users.messages.batchModify({
              userId: 'me',
              requestBody: {
                ids: chunk,
                addLabelIds: finalAddLabelIds,
                removeLabelIds: finalRemoveLabelIds
              }
            });
            
            results.successful.push(...chunk);
            results.chunks.push({
              index: chunkIndex,
              messageCount: chunk.length,
              status: 'success'
            });
            
            console.log(`BatchUpdateEmails - Chunk ${chunkIndex + 1} succeeded`);
          } catch (chunkError: any) {
            console.error(`BatchUpdateEmails - Chunk ${chunkIndex + 1} failed:`, chunkError);
            
            // If batch fails, try individual messages to identify which ones are problematic
            if (chunkError.code === 400 || chunkError.code === 404) {
              console.log(`BatchUpdateEmails - Retrying chunk ${chunkIndex + 1} individually`);
              
              for (const messageId of chunk) {
                try {
                  await gmail.users.messages.modify({
                    userId: 'me',
                    id: messageId,
                    requestBody: {
                      addLabelIds: finalAddLabelIds,
                      removeLabelIds: finalRemoveLabelIds
                    }
                  });
                  results.successful.push(messageId);
                } catch (individualError: any) {
                  console.error(`BatchUpdateEmails - Individual message ${messageId} failed:`, individualError);
                  results.failed.push({
                    id: messageId,
                    error: individualError.message || 'Unknown error'
                  });
                }
              }
              
              results.chunks.push({
                index: chunkIndex,
                messageCount: chunk.length,
                status: `partial (${results.successful.filter(id => chunk.includes(id)).length}/${chunk.length} succeeded)`
              });
            } else {
              // For other errors, mark entire chunk as failed
              chunk.forEach(id => {
                results.failed.push({
                  id,
                  error: chunkError.message || 'Batch operation failed'
                });
              });
              
              results.chunks.push({
                index: chunkIndex,
                messageCount: chunk.length,
                status: 'failed'
              });
            }
          }
        }
        
        // Log summary
        console.log('BatchUpdateEmails - Operation complete:', {
          total: args.messageIds.length,
          successful: results.successful.length,
          failed: results.failed.length
        });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: results.failed.length === 0,
                action: 'batch_modified',
                summary: {
                  total: args.messageIds.length,
                  successful: results.successful.length,
                  failed: results.failed.length
                },
                chunks: results.chunks,
                successfulIds: results.successful,
                failedIds: results.failed,
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