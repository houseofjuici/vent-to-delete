/**
 * Keyboard Shortcuts Utility
 * Manages global keyboard shortcuts and command palette
 */

export const KeyboardShortcuts = {
  shortcuts: new Map(),
  
  /**
   * Register a keyboard shortcut
   * @param {string} key - Key combination (e.g., 'mod+k', 'ctrl+shift+n')
   * @param {Function} handler - Callback function
   * @param {string} description - Human-readable description
   */
  register(key, handler, description = '') {
    this.shortcuts.set(key.toLowerCase(), { handler, description });
  },
  
  /**
   * Unregister a keyboard shortcut
   * @param {string} key - Key combination to unregister
   */
  unregister(key) {
    this.shortcuts.delete(key.toLowerCase());
  },
  
  /**
   * Initialize keyboard shortcuts listener
   */
  init() {
    document.addEventListener('keydown', (e) => {
      const combo = this.getKeyCombo(e);
      const shortcut = this.shortcuts.get(combo);
      
      if (shortcut) {
        e.preventDefault();
        shortcut.handler(e);
      }
    });
  },
  
  /**
   * Get key combination from keyboard event
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {string} Key combination string
   */
  getKeyCombo(e) {
    const parts = [];
    
    if (e.metaKey) parts.push('mod');
    if (e.ctrlKey && !e.metaKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    
    parts.push(e.key.toLowerCase());
    
    return parts.join('+');
  },
  
  /**
   * Format key combination for display
   * @param {string} combo - Key combination string
   * @returns {string} Formatted display string
   */
  formatForDisplay(combo) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    return combo
      .split('+')
      .map(key => {
        if (key === 'mod') return isMac ? '⌘' : 'Ctrl';
        if (key === 'ctrl') return 'Ctrl';
        if (key === 'alt') return isMac ? '⌥' : 'Alt';
        if (key === 'shift') return '⇧';
        return key.charAt(0).toUpperCase() + key.slice(1);
      })
      .join(isMac ? '' : ' + ');
  },
  
  /**
   * Get all registered shortcuts
   * @returns {Array} Array of shortcut objects
   */
  getAll() {
    return Array.from(this.shortcuts.entries()).map(([key, { description }]) => ({
      key,
      description,
      display: this.formatForDisplay(key)
    }));
  }
};

export default KeyboardShortcuts;
