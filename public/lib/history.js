/**
 * History Utility
 * Manages undo/redo functionality with configurable state limit
 */

export class HistoryManager {
  constructor(options = {}) {
    this.maxStates = options.maxStates || 10;
    this.states = [];
    this.currentIndex = -1;
    this.isPerformingUndoRedo = false;
  }
  
  /**
   * Push a new state onto the history stack
   * @param {*} state - State to save
   */
  push(state) {
    // Don't push if we're in the middle of undoing/redoing
    if (this.isPerformingUndoRedo) {
      return;
    }
    
    // Remove any states after current index (new branch)
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }
    
    // Add new state
    this.states.push(JSON.parse(JSON.stringify(state))); // Deep clone
    this.currentIndex++;
    
    // Trim if exceeding max states
    if (this.states.length > this.maxStates) {
      this.states.shift();
      this.currentIndex--;
    }
    
    this.notifyChange();
  }
  
  /**
   * Undo to previous state
   * @returns {*} Previous state or null if at beginning
   */
  undo() {
    if (!this.canUndo()) {
      return null;
    }
    
    this.isPerformingUndoRedo = true;
    this.currentIndex--;
    const state = this.getCurrentState();
    this.isPerformingUndoRedo = false;
    
    this.notifyChange();
    return state;
  }
  
  /**
   * Redo to next state
   * @returns {*} Next state or null if at end
   */
  redo() {
    if (!this.canRedo()) {
      return null;
    }
    
    this.isPerformingUndoRedo = true;
    this.currentIndex++;
    const state = this.getCurrentState();
    this.isPerformingUndoRedo = false;
    
    this.notifyChange();
    return state;
  }
  
  /**
   * Get current state
   * @returns {*} Current state or null
   */
  getCurrentState() {
    if (this.currentIndex >= 0 && this.currentIndex < this.states.length) {
      return JSON.parse(JSON.stringify(this.states[this.currentIndex]));
    }
    return null;
  }
  
  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this.currentIndex > 0;
  }
  
  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this.currentIndex < this.states.length - 1;
  }
  
  /**
   * Clear all history
   */
  clear() {
    this.states = [];
    this.currentIndex = -1;
    this.notifyChange();
  }
  
  /**
   * Get history info for display
   * @returns {Object} History info
   */
  getInfo() {
    return {
      total: this.states.length,
      current: this.currentIndex + 1,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }
  
  /**
   * Register change callback
   * @param {Function} callback - Callback function
   */
  onChange(callback) {
    this.changeCallback = callback;
  }
  
  /**
   * Notify change listeners
   */
  notifyChange() {
    if (this.changeCallback) {
      this.changeCallback(this.getInfo());
    }
  }
}

/**
 * Message-specific history manager
 */
export class MessageHistory extends HistoryManager {
  constructor() {
    super({ maxStates: 20 }); // More states for messages
    
    // Track message-specific actions
    this.messageActions = new Map();
  }
  
  /**
   * Track a message action (send, edit, delete)
   * @param {string} action - Action type
   * @param {Object} message - Message object
   */
  trackAction(action, message) {
    const actionKey = `${action}_${message.id}`;
    this.messageActions.set(actionKey, {
      action,
      message: JSON.parse(JSON.stringify(message)),
      timestamp: Date.now()
    });
  }
  
  /**
   * Get message action history
   * @param {string} messageId - Message ID
   * @returns {Array} Array of actions for this message
   */
  getMessageHistory(messageId) {
    return Array.from(this.messageActions.values())
      .filter(a => a.message.id === messageId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }
}

export default HistoryManager;
