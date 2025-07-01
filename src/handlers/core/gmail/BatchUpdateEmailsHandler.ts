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

interface MessageVerification {
  id: string;
  success: boolean;
  preLabels?: string[];
  postLabels?: string[];
  error?: string;
  skippedReason?: string;
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
        console.log('BatchUpdateEmails - Starting operation:', {
          totalMessages: args.messageIds.length,
          addLabelIds: finalAddLabelIds,
          removeLabelIds: finalRemoveLabelIds
        });
        
        // Pre-fetch message states to filter out invalid/inaccessible messages
        console.log('BatchUpdateEmails - Pre-fetching message states...');
        const validMessages: string[] = [];
        const invalidMessages: MessageVerification[] = [];
        
        // Check each message before attempting batch update
        for (const messageId of args.messageIds) {
          try {
            const message = await gmail.users.messages.get({
              userId: 'me',
              id: messageId,
              format: 'minimal'
            });
            
            // Skip messages in SPAM or TRASH for certain operations
            const labels = message.data.labelIds || [];
            if ((labels.includes('SPAM') || labels.includes('TRASH')) && 
                (removeLabelIds.includes('UNREAD') || addLabelIds.includes('INBOX'))) {
              invalidMessages.push({
                id: messageId,
                success: false,
                skippedReason: 'Message in SPAM/TRASH - cannot modify UNREAD/INBOX labels',
                preLabels: labels
              });
            } else {
              validMessages.push(messageId);
            }
          } catch (error: any) {
            invalidMessages.push({
              id: messageId,
              success: false,
              error: error.message || 'Message not accessible',
              skippedReason: 'Failed to access message'
            });
          }
        }
        
        console.log(`BatchUpdateEmails - ${validMessages.length} valid messages, ${invalidMessages.length} invalid/skipped`);
        
        // Process valid messages in sequential chunks to avoid rate limits
        const chunkSize = 100;
        const results: MessageVerification[] = [...invalidMessages];
        
        for (let i = 0; i < validMessages.length; i += chunkSize) {
          const chunk = validMessages.slice(i, i + chunkSize);
          const chunkIndex = Math.floor(i / chunkSize) + 1;
          const totalChunks = Math.ceil(validMessages.length / chunkSize);
          
          console.log(`BatchUpdateEmails - Processing chunk ${chunkIndex}/${totalChunks} (${chunk.length} messages)`);
          
          // Add delay between chunks to avoid rate limits
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          try {
            // Log the exact request
            const batchRequest = {
              ids: chunk,
              addLabelIds: finalAddLabelIds,
              removeLabelIds: finalRemoveLabelIds
            };
            console.log('BatchUpdateEmails - Request body:', JSON.stringify(batchRequest));
            
            // Execute batch modify
            const response = await gmail.users.messages.batchModify({
              userId: 'me',
              requestBody: batchRequest
            });
            
            // Log response headers for rate limit info
            if (response.headers) {
              console.log('BatchUpdateEmails - Response headers:', {
                'x-ratelimit-limit': response.headers['x-ratelimit-limit'],
                'x-ratelimit-remaining': response.headers['x-ratelimit-remaining'],
                'status': response.status
              });
            }
            
            // Verify each message was actually updated
            console.log(`BatchUpdateEmails - Verifying chunk ${chunkIndex} results...`);
            const verificationPromises = chunk.map(async (messageId) => {
              try {
                const postMessage = await gmail.users.messages.get({
                  userId: 'me',
                  id: messageId,
                  format: 'minimal'
                });
                
                const postLabels = postMessage.data.labelIds || [];
                
                // Check if expected changes were applied
                const expectedAdded = finalAddLabelIds.every(label => postLabels.includes(label));
                const expectedRemoved = finalRemoveLabelIds.every(label => !postLabels.includes(label));
                const success = expectedAdded && expectedRemoved;
                
                return {
                  id: messageId,
                  success,
                  postLabels,
                  error: success ? undefined : 'Labels not updated as expected'
                } as MessageVerification;
              } catch (error: any) {
                return {
                  id: messageId,
                  success: false,
                  error: `Verification failed: ${error.message}`
                } as MessageVerification;
              }
            });
            
            const chunkResults = await Promise.all(verificationPromises);
            results.push(...chunkResults);
            
            const successCount = chunkResults.filter(r => r.success).length;
            console.log(`BatchUpdateEmails - Chunk ${chunkIndex}: ${successCount}/${chunk.length} verified as updated`);
            
            // If some failed in this chunk, retry individually
            const failedInChunk = chunkResults.filter(r => !r.success);
            if (failedInChunk.length > 0) {
              console.log(`BatchUpdateEmails - Retrying ${failedInChunk.length} failed messages individually...`);
              
              for (const failed of failedInChunk) {
                try {
                  await gmail.users.messages.modify({
                    userId: 'me',
                    id: failed.id,
                    requestBody: {
                      addLabelIds: finalAddLabelIds,
                      removeLabelIds: finalRemoveLabelIds
                    }
                  });
                  
                  // Update result
                  const resultIndex = results.findIndex(r => r.id === failed.id);
                  if (resultIndex !== -1) {
                    results[resultIndex] = {
                      id: failed.id,
                      success: true,
                      error: undefined
                    };
                  }
                } catch (individualError: any) {
                  console.error(`BatchUpdateEmails - Individual retry failed for ${failed.id}:`, individualError.message);
                }
              }
            }
            
          } catch (chunkError: any) {
            console.error(`BatchUpdateEmails - Chunk ${chunkIndex} failed entirely:`, chunkError);
            
            // Mark all messages in chunk as failed
            chunk.forEach(id => {
              results.push({
                id,
                success: false,
                error: chunkError.message || 'Batch operation failed'
              });
            });
          }
        }
        
        // Calculate final statistics
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        console.log('BatchUpdateEmails - Final summary:', {
          total: args.messageIds.length,
          successful: successful.length,
          failed: failed.length,
          skipped: invalidMessages.length
        });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: failed.length === 0,
                action: 'batch_modified',
                summary: {
                  total: args.messageIds.length,
                  successful: successful.length,
                  failed: failed.length,
                  skipped: invalidMessages.length
                },
                details: {
                  successfulIds: successful.map(r => r.id),
                  failedOperations: failed.map(r => ({
                    id: r.id,
                    reason: r.error || r.skippedReason || 'Unknown error'
                  })),
                  addedLabels: finalAddLabelIds,
                  removedLabels: finalRemoveLabelIds
                }
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
      console.error('BatchUpdateEmails - Fatal error:', {
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