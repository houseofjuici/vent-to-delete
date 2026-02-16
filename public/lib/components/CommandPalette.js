/**
 * Command Palette Component
 * Vanilla JS implementation of command palette (like Cmd+K in VS Code)
 */

import { KeyboardShortcuts } from '../keyboard.js';

export class CommandPalette {
  constructor(options = {}) {
    this.commands = options.commands || [];
    this.onExecute = options.onExecute || (() => {});
    this.isOpen = false;
    this.selectedIndex = 0;
    this.filterQuery = '';
    
    this.init();
  }
  
  init() {
    this.createOverlay();
    this.bindEvents();
  }
  
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'command-palette-overlay';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-labelledby', 'command-palette-title');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.display = 'none';
    
    overlay.innerHTML = `
      <div class="command-palette" id="command-palette">
        <div class="command-palette-header">
          <h2 id="command-palette-title">Command Palette</h2>
          <button class="btn-icon command-palette-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="command-palette-search">
          <input 
            type="text" 
            id="command-palette-input" 
            placeholder="Type a command or search..." 
            aria-label="Search commands"
            autocomplete="off"
          />
          <div class="search-shortcut" aria-hidden="true">
            <kbd>ESC</kbd> to close
          </div>
        </div>
        <div class="command-list" id="command-list" role="listbox" aria-label="Commands">
          <!-- Commands will be rendered here -->
        </div>
        <div class="command-palette-footer">
          <span class="hint">Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.input = overlay.querySelector('#command-palette-input');
    this.commandList = overlay.querySelector('#command-list');
  }
  
  bindEvents() {
    // Close button
    this.overlay.querySelector('.command-palette-close').addEventListener('click', () => {
      this.close();
    });
    
    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
    
    // Input handling
    this.input.addEventListener('input', (e) => {
      this.filterQuery = e.target.value.toLowerCase();
      this.selectedIndex = 0;
      this.renderCommands();
    });
    
    // Keyboard navigation
    this.input.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          this.executeSelected();
          break;
        case 'Escape':
          e.preventDefault();
          this.close();
          break;
      }
    });
    
    // Focus trap
    this.overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.input.focus();
      }
    });
  }
  
  setCommands(commands) {
    this.commands = commands;
    if (this.isOpen) {
      this.renderCommands();
    }
  }
  
  renderCommands() {
    const filteredCommands = this.getFilteredCommands();
    
    if (filteredCommands.length === 0) {
      this.commandList.innerHTML = `
        <div class="command-list-empty">
          <span class="empty-icon">🔍</span>
          <p>No commands found</p>
        </div>
      `;
      return;
    }
    
    this.commandList.innerHTML = filteredCommands.map((cmd, index) => `
      <button 
        class="command-item ${index === this.selectedIndex ? 'selected' : ''}"
        role="option"
        aria-selected="${index === this.selectedIndex}"
        data-index="${index}"
        data-id="${cmd.id}"
      >
        <div class="command-item-left">
          ${cmd.icon ? `<span class="command-icon">${cmd.icon}</span>` : ''}
          <div class="command-text">
            <div class="command-label">${cmd.label}</div>
            ${cmd.description ? `<div class="command-description">${cmd.description}</div>` : ''}
          </div>
        </div>
        ${cmd.shortcut ? `<div class="command-shortcut">${KeyboardShortcuts.formatForDisplay(cmd.shortcut)}</div>` : ''}
      </button>
    `).join('');
    
    // Add click handlers
    this.commandList.querySelectorAll('.command-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.executeCommand(index);
      });
      
      item.addEventListener('mouseenter', () => {
        this.selectedIndex = parseInt(item.dataset.index);
        this.updateSelection();
      });
    });
  }
  
  getFilteredCommands() {
    if (!this.filterQuery) {
      return this.commands;
    }
    
    return this.commands.filter(cmd => {
      const searchStr = `${cmd.label} ${cmd.description || ''} ${cmd.category || ''}`.toLowerCase();
      return searchStr.includes(this.filterQuery);
    });
  }
  
  selectNext() {
    const filteredCommands = this.getFilteredCommands();
    if (filteredCommands.length === 0) return;
    
    this.selectedIndex = (this.selectedIndex + 1) % filteredCommands.length;
    this.updateSelection();
  }
  
  selectPrevious() {
    const filteredCommands = this.getFilteredCommands();
    if (filteredCommands.length === 0) return;
    
    this.selectedIndex = (this.selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
    this.updateSelection();
  }
  
  updateSelection() {
    const items = this.commandList.querySelectorAll('.command-item');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        item.classList.remove('selected');
      }
    });
  }
  
  executeSelected() {
    const filteredCommands = this.getFilteredCommands();
    if (filteredCommands.length === 0) return;
    
    this.executeCommand(this.selectedIndex);
  }
  
  executeCommand(index) {
    const filteredCommands = this.getFilteredCommands();
    const command = filteredCommands[index];
    
    if (command) {
      this.close();
      this.onExecute(command);
    }
  }
  
  open() {
    this.isOpen = true;
    this.overlay.style.display = 'flex';
    this.input.value = '';
    this.filterQuery = '';
    this.selectedIndex = 0;
    
    // Focus input after animation
    setTimeout(() => {
      this.input.focus();
      this.renderCommands();
    }, 50);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    this.isOpen = false;
    this.overlay.style.display = 'none';
    document.body.style.overflow = '';
    
    // Return focus to trigger element if exists
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.previousActiveElement = document.activeElement;
      this.open();
    }
  }
  
  destroy() {
    this.overlay.remove();
  }
}

export default CommandPalette;
