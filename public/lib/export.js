/**
 * Export Utility
 * Export chat data to JSON or CSV format
 */

export const ExportUtility = {
  /**
   * Export messages to JSON format
   * @param {Array} messages - Array of message objects
   * @param {string} threadId - Thread identifier
   * @param {Function} decryptFn - Function to decrypt messages
   */
  exportToJSON(messages, threadId, decryptFn) {
    try {
      const exportData = {
        threadId,
        exportDate: new Date().toISOString(),
        messageCount: messages.length,
        messages: messages.map(msg => ({
          id: msg.id,
          content: decryptFn ? decryptFn(msg.content) : msg.content,
          timestamp: new Date(msg.timestamp).toISOString(),
          senderId: msg.senderId,
          readBy: msg.readBy || [],
          reactions: msg.reactions || []
        }))
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      this.downloadBlob(blob, `vent-thread-${threadId.substring(0, 8)}.json`);
      
      return { success: true, count: messages.length };
    } catch (error) {
      console.error('JSON export error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Export messages to CSV format
   * @param {Array} messages - Array of message objects
   * @param {string} threadId - Thread identifier
   * @param {Function} decryptFn - Function to decrypt messages
   */
  exportToCSV(messages, threadId, decryptFn) {
    try {
      const headers = ['Timestamp', 'Message', 'Sender', 'Read Count', 'Reactions'];
      const rows = messages.map(msg => {
        const content = decryptFn ? decryptFn(msg.content) : msg.content;
        // Escape CSV special characters
        const escapedContent = `"${content.replace(/"/g, '""')}"`;
        const reactions = msg.reactions?.map(r => r.emoji).join(', ') || '';
        
        return [
          new Date(msg.timestamp).toISOString(),
          escapedContent,
          msg.senderId,
          msg.readBy?.length || 0,
          `"${reactions}"`
        ].join(',');
      });
      
      const csv = [headers.join(','), ...rows].join('\n');
      
      // Add UTF-8 BOM for Excel compatibility
      const blob = new Blob(['\ufeff' + csv], { 
        type: 'text/csv;charset=utf-8' 
      });
      
      this.downloadBlob(blob, `vent-thread-${threadId.substring(0, 8)}.csv`);
      
      return { success: true, count: messages.length };
    } catch (error) {
      console.error('CSV export error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Export messages to text format
   * @param {Array} messages - Array of message objects
   * @param {string} threadId - Thread identifier
   * @param {Function} decryptFn - Function to decrypt messages
   */
  exportToText(messages, threadId, decryptFn) {
    try {
      const lines = [
        `Vent to Delete - Thread Export`,
        `Thread ID: ${threadId}`,
        `Export Date: ${new Date().toISOString()}`,
        `Messages: ${messages.length}`,
        `${'='.repeat(50)}\n`
      ];
      
      messages.forEach((msg, index) => {
        const content = decryptFn ? decryptFn(msg.content) : msg.content;
        const timestamp = new Date(msg.timestamp).toLocaleString();
        const sender = msg.senderId === 'you' ? 'You' : 'Partner';
        
        lines.push(`[${index + 1}] ${timestamp} - ${sender}:`);
        lines.push(content);
        lines.push('');
      });
      
      const text = lines.join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      
      this.downloadBlob(blob, `vent-thread-${threadId.substring(0, 8)}.txt`);
      
      return { success: true, count: messages.length };
    } catch (error) {
      console.error('Text export error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Trigger download of a blob
   * @param {Blob} blob - Blob to download
   * @param {string} filename - Filename for download
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
  
  /**
   * Copy messages to clipboard
   * @param {Array} messages - Array of message objects
   * @param {Function} decryptFn - Function to decrypt messages
   */
  async copyToClipboard(messages, decryptFn) {
    try {
      const text = messages.map(msg => {
        const content = decryptFn ? decryptFn(msg.content) : msg.content;
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        return `[${timestamp}] ${content}`;
      }).join('\n\n');
      
      await navigator.clipboard.writeText(text);
      
      return { success: true, count: messages.length };
    } catch (error) {
      console.error('Clipboard copy error:', error);
      return { success: false, error: error.message };
    }
  }
};

export default ExportUtility;
