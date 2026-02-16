/**
 * Keyboard Shortcuts Modal Component
 * Displays all available keyboard shortcuts
 */

import { KeyboardShortcuts } from '../keyboard.js';

export class KeyboardShortcutsModal {
  constructor(options = {}) {
    this.shortcuts = options.shortcuts || [];
    this.onClose = options.onClose || (() => {});
    
    this.init();
  }
  
  init() {
    this.createModal();
    this.bindEvents();
  }
  
  createModal() {
    const overlay = document.createElement('div');
    overlay.id = 'shortcuts-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-labelledby', 'shortcuts-modal-title');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.display = 'none';
    
    overlay.innerHTML = `
      <div class="modal shortcuts-modal">
        <div class="modal-header">
          <h2 id="shortcuts-modal-title">⌨️ Keyboard Shortcuts</h2>
          <button class="btn-icon shortcuts-modal-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="shortcuts-intro">
            Power through your chats with these keyboard shortcuts. 
            Press <kbd>ESC</kbd> to close this modal.
          </p>
          
          <div class="shortcuts-categories">
            ${this.renderCategories()}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary shortcuts-modal-close-btn">Got it!</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.overlay = overlay;
  }
  
  bindEvents() {
    const closeButtons = this.overlay.querySelectorAll('.shortcuts-modal-close, .shortcuts-modal-close-btn');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
    
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
    
    this.overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
  }
  
  renderCategories() {
    const categories = this.groupByCategory();
    
    return Object.entries(categories).map(([category, shortcuts]) => `
      <div class="shortcut-category">
        <h3 class="category-title">${category}</h3>
        <div class="shortcuts-list">
          ${shortcuts.map(shortcut => `
            <div class="shortcut-item">
              <div class="shortcut-info">
                ${shortcut.icon ? `<span class="shortcut-icon">${shortcut.icon}</span>` : ''}
                <div class="shortcut-details">
                  <div class="shortcut-label">${shortcut.label}</div>
                  ${shortcut.description ? `<div class="shortcut-description">${shortcut.description}</div>` : ''}
                </div>
              </div>
              <div class="shortcut-keys">
                ${this.renderKeys(shortcut.key)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
  
  groupByCategory() {
    const categories = {};
    
    this.shortcuts.forEach(shortcut => {
      const category = shortcut.category || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(shortcut);
    });
    
    return categories;
  }
  
  renderKeys(keyCombo) {
    const keys = keyCombo.split('+');
    return `
      <div class="shortcut-keys">
        ${keys.map(key => `<kbd>${this.formatKey(key)}</kbd>`).join('')}
      </div>
    `;
  }
  
  formatKey(key) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    const keyMap = {
      'mod': isMac ? '⌘' : 'Ctrl',
      'ctrl': 'Ctrl',
      'alt': isMac ? '⌥' : 'Alt',
      'shift': isMac ? '⇧' : 'Shift',
      'enter': 'Enter',
      'escape': 'Esc',
      'tab': 'Tab',
      'backspace': '⌫',
      'delete': '⌦',
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→',
      ' ': 'Space'
    };
    
    return keyMap[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1);
  }
  
  setShortcuts(shortcuts) {
    this.shortcuts = shortcuts;
    this.updateContent();
  }
  
  updateContent() {
    const categoriesContainer = this.overlay.querySelector('.shortcuts-categories');
    if (categoriesContainer) {
      categoriesContainer.innerHTML = this.renderCategories();
    }
  }
  
  open() {
    this.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus close button
    const closeButton = this.overlay.querySelector('.shortcuts-modal-close');
    setTimeout(() => closeButton?.focus(), 50);
  }
  
  close() {
    this.overlay.style.display = 'none';
    document.body.style.overflow = '';
    this.onClose();
  }
  
  destroy() {
    this.overlay.remove();
  }
}

export default KeyboardShortcutsModal;
