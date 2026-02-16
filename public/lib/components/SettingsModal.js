/**
 * Settings Modal Component
 * Comprehensive settings interface
 */

import { SettingsManager } from '../settings.js';

export class SettingsModal {
  constructor(options = {}) {
    this.onSave = options.onSave || (() => {});
    this.currentSection = 'general';
    
    this.init();
  }
  
  init() {
    this.createModal();
    this.bindEvents();
    this.loadSettings();
  }
  
  createModal() {
    const overlay = document.createElement('div');
    overlay.id = 'settings-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-labelledby', 'settings-modal-title');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.display = 'none';
    
    overlay.innerHTML = `
      <div class="modal settings-modal">
        <div class="modal-header">
          <h2 id="settings-modal-title">⚙️ Settings</h2>
          <button class="btn-icon settings-modal-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="settings-modal-content">
          <nav class="settings-nav" role="tablist" aria-label="Settings categories">
            <button class="settings-nav-item active" data-section="general" role="tab" aria-selected="true">
              <span class="nav-icon">🎯</span>
              <span>General</span>
            </button>
            <button class="settings-nav-item" data-section="notifications" role="tab" aria-selected="false">
              <span class="nav-icon">🔔</span>
              <span>Notifications</span>
            </button>
            <button class="settings-nav-item" data-section="appearance" role="tab" aria-selected="false">
              <span class="nav-icon">🎨</span>
              <span>Appearance</span>
            </button>
            <button class="settings-nav-item" data-section="privacy" role="tab" aria-selected="false">
              <span class="nav-icon">🔒</span>
              <span>Privacy</span>
            </button>
            <button class="settings-nav-item" data-section="chat" role="tab" aria-selected="false">
              <span class="nav-icon">💬</span>
              <span>Chat</span>
            </button>
            <button class="settings-nav-item" data-section="accessibility" role="tab" aria-selected="false">
              <span class="nav-icon">♿</span>
              <span>Accessibility</span>
            </button>
            <button class="settings-nav-item" data-section="advanced" role="tab" aria-selected="false">
              <span class="nav-icon">🔧</span>
              <span>Advanced</span>
            </button>
          </nav>
          
          <div class="settings-panel-container">
            ${this.renderSections()}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="settings-reset-btn">Reset to Defaults</button>
          <button class="btn btn-primary settings-modal-save-btn">Save & Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.overlay = overlay;
  }
  
  renderSections() {
    return `
      <div class="settings-section active" id="settings-section-general" role="tabpanel">
        ${this.renderGeneralSettings()}
      </div>
      <div class="settings-section" id="settings-section-notifications" role="tabpanel">
        ${this.renderNotificationSettings()}
      </div>
      <div class="settings-section" id="settings-section-appearance" role="tabpanel">
        ${this.renderAppearanceSettings()}
      </div>
      <div class="settings-section" id="settings-section-privacy" role="tabpanel">
        ${this.renderPrivacySettings()}
      </div>
      <div class="settings-section" id="settings-section-chat" role="tabpanel">
        ${this.renderChatSettings()}
      </div>
      <div class="settings-section" id="settings-section-accessibility" role="tabpanel">
        ${this.renderAccessibilitySettings()}
      </div>
      <div class="settings-section" id="settings-section-advanced" role="tabpanel">
        ${this.renderAdvancedSettings()}
      </div>
    `;
  }
  
  renderGeneralSettings() {
    return `
      <h3>Thread Settings</h3>
      <div class="settings-group">
        <label class="settings-label">Default Thread Timer</label>
        <div class="timer-presets">
          ${[1, 6, 12, 24, 48, 72, 168].map(hours => `
            <button class="timer-preset-btn" data-hours="${hours}" aria-pressed="false">
              ${hours < 24 ? `${hours}h` : hours === 24 ? '1 day' : `${hours/24} days`}
            </button>
          `).join('')}
        </div>
      </div>
      
      <div class="settings-group">
        <label class="settings-label">Auto-Expire Behavior</label>
        <select id="settings-auto-expire" class="settings-select">
          <option value="both-read">Delete when both read all messages</option>
          <option value="timer-only">Delete only when timer expires</option>
        </select>
        <p class="settings-description">Choose when threads should be automatically deleted</p>
      </div>
    `;
  }
  
  renderNotificationSettings() {
    return `
      <h3>Notifications</h3>
      <div class="settings-group">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-notification-sounds">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Play notification sounds</span>
        </label>
        <p class="settings-description">Play subtle sounds when messages are sent or received</p>
      </div>
      
      <div class="settings-group">
        <button class="btn btn-secondary" id="settings-request-permissions">
          Enable Browser Notifications
        </button>
        <p class="settings-description">
          Permission: <span id="notification-permission-status">Not requested</span>
        </p>
      </div>
    `;
  }
  
  renderAppearanceSettings() {
    return `
      <h3>Appearance</h3>
      <div class="settings-group">
        <label class="settings-label">Theme</label>
        <div class="theme-options">
          <button class="theme-btn" data-theme="dark">
            <span class="theme-preview dark"></span>
            <span>Dark</span>
          </button>
          <button class="theme-btn" data-theme="light">
            <span class="theme-preview light"></span>
            <span>Light</span>
          </button>
          <button class="theme-btn" data-theme="auto">
            <span class="theme-preview auto"></span>
            <span>Auto</span>
          </button>
        </div>
      </div>
      
      <div class="settings-group">
        <label class="settings-label">Font Size</label>
        <div class="font-size-options">
          <button class="font-size-btn" data-size="small">A-</button>
          <button class="font-size-btn" data-size="medium">A</button>
          <button class="font-size-btn" data-size="large">A+</button>
        </div>
      </div>
    `;
  }
  
  renderPrivacySettings() {
    return `
      <h3>Privacy</h3>
      <div class="settings-group">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-screenshot-prevention">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Screenshot prevention</span>
        </label>
        <p class="settings-description">Attempt to detect and prevent screenshots (best effort)</p>
      </div>
      
      <div class="settings-group">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-auto-delete-on-leave">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Auto-delete on page leave</span>
        </label>
        <p class="settings-description">Automatically delete threads when you close the tab</p>
      </div>
    `;
  }
  
  renderChatSettings() {
    return `
      <h3>Chat Experience</h3>
      <div class="settings-group">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-send-on-enter">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Send message with Enter</span>
        </label>
        <p class="settings-description">Press Enter to send, Shift+Enter for new line</p>
      </div>
      
      <div class="settings-group">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-show-timestamps">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Show timestamps</span>
        </label>
      </div>
      
      <div class="settings-group">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-show-read-receipts">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Show read receipts</span>
        </label>
      </div>
      
      <div class="settings-group">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-show-typing">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Show typing indicators</span>
        </label>
      </div>
    `;
  }
  
  renderAccessibilitySettings() {
    return `
      <h3>Accessibility</h3>
      <div class="settings-group">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-reduced-motion">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Reduced motion</span>
        </label>
        <p class="settings-description">Minimize animations and transitions</p>
      </div>
      
      <div class="settings-group">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-high-contrast">
          <span class="toggle-slider"></span>
          <span class="toggle-label">High contrast mode</span>
        </label>
        <p class="settings-description">Increase color contrast for better visibility</p>
      </div>
      
      <div class="settings-group">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-screen-reader">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Screen reader optimized</span>
        </label>
        <p class="settings-description">Additional ARIA labels and announcements</p>
      </div>
    `;
  }
  
  renderAdvancedSettings() {
    return `
      <h3>Export</h3>
      <div class="settings-group">
        <label class="settings-label">Default Export Format</label>
        <select id="settings-export-format" class="settings-select">
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="text">Plain Text</option>
        </select>
      </div>
      
      <h3>Debug</h3>
      <div class="settings-group">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-debug-mode">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Debug mode</span>
        </label>
        <p class="settings-description">Show detailed logs and error messages</p>
      </div>
      
      <div class="settings-group">
        <button class="btn btn-secondary" id="settings-export-config">
          Export Settings
        </button>
        <button class="btn btn-secondary" id="settings-import-config">
          Import Settings
        </button>
      </div>
    `;
  }
  
  bindEvents() {
    // Close button
    this.overlay.querySelector('.settings-modal-close').addEventListener('click', () => {
      this.close();
    });
    
    // Save button
    this.overlay.querySelector('.settings-modal-save-btn').addEventListener('click', () => {
      this.saveSettings();
      this.close();
    });
    
    // Reset button
    this.overlay.querySelector('#settings-reset-btn').addEventListener('click', () => {
      if (confirm('Reset all settings to defaults?')) {
        SettingsManager.reset();
        this.loadSettings();
      }
    });
    
    // Navigation
    this.overlay.querySelectorAll('.settings-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.switchSection(item.dataset.section);
      });
    });
    
    // Timer presets
    this.overlay.querySelectorAll('.timer-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectTimerPreset(parseInt(btn.dataset.hours));
      });
    });
    
    // Theme buttons
    this.overlay.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectTheme(btn.dataset.theme);
      });
    });
    
    // Font size buttons
    this.overlay.querySelectorAll('.font-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectFontSize(btn.dataset.size);
      });
    });
    
    // Request notification permission
    this.overlay.querySelector('#settings-request-permissions')?.addEventListener('click', async () => {
      const permission = await SettingsManager.requestNotificationPermission();
      this.updatePermissionStatus(permission);
    });
    
    // Export/Import settings
    this.overlay.querySelector('#settings-export-config')?.addEventListener('click', () => {
      this.exportSettings();
    });
    
    this.overlay.querySelector('#settings-import-config')?.addEventListener('click', () => {
      this.importSettings();
    });
    
    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
    
    // Close on ESC
    this.overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
  }
  
  switchSection(sectionId) {
    this.currentSection = sectionId;
    
    // Update nav
    this.overlay.querySelectorAll('.settings-nav-item').forEach(item => {
      const isActive = item.dataset.section === sectionId;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', isActive);
    });
    
    // Update sections
    this.overlay.querySelectorAll('.settings-section').forEach(section => {
      section.classList.toggle('active', section.id === `settings-section-${sectionId}`);
    });
  }
  
  loadSettings() {
    const settings = SettingsManager.getAll();
    
    // Load timer preset
    this.selectTimerPreset(settings.timerPreset);
    
    // Load select values
    this.overlay.querySelector('#settings-auto-expire').value = settings.autoExpireBehavior;
    this.overlay.querySelector('#settings-export-format').value = settings.exportFormat;
    
    // Load checkboxes
    this.loadCheckbox('settings-notification-sounds', settings.notificationSounds);
    this.loadCheckbox('settings-screenshot-prevention', settings.screenshotPrevention);
    this.loadCheckbox('settings-auto-delete-on-leave', settings.autoDeleteOnLeave);
    this.loadCheckbox('settings-send-on-enter', settings.sendMessageOnEnter);
    this.loadCheckbox('settings-show-timestamps', settings.showTimestamps);
    this.loadCheckbox('settings-show-read-receipts', settings.showReadReceipts);
    this.loadCheckbox('settings-show-typing', settings.showTypingIndicators);
    this.loadCheckbox('settings-reduced-motion', settings.reducedMotion);
    this.loadCheckbox('settings-high-contrast', settings.highContrast);
    this.loadCheckbox('settings-screen-reader', settings.screenReaderOptimized);
    this.loadCheckbox('settings-debug-mode', settings.debugMode);
    
    // Load theme
    this.selectTheme(settings.theme);
    
    // Load font size
    this.selectFontSize(settings.fontSize);
    
    // Update permission status
    this.updatePermissionStatus(settings.notificationPermission);
  }
  
  loadCheckbox(id, value) {
    const checkbox = this.overlay.querySelector(`#${id}`);
    if (checkbox) checkbox.checked = value;
  }
  
  selectTimerPreset(hours) {
    this.overlay.querySelectorAll('.timer-preset-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.hours) === hours);
      btn.setAttribute('aria-pressed', parseInt(btn.dataset.hours) === hours);
    });
  }
  
  selectTheme(theme) {
    this.overlay.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }
  
  selectFontSize(size) {
    this.overlay.querySelectorAll('.font-size-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });
  }
  
  updatePermissionStatus(permission) {
    const statusEl = this.overlay.querySelector('#notification-permission-status');
    if (statusEl) {
      const statusMap = {
        'granted': '✅ Granted',
        'denied': '❌ Denied',
        'default': '⏳ Not requested',
        'unsupported': '❌ Not supported'
      };
      statusEl.textContent = statusMap[permission] || permission;
    }
  }
  
  saveSettings() {
    const settings = {
      // Timer preset (get from active button)
      timerPreset: parseInt(this.overlay.querySelector('.timer-preset-btn.active')?.dataset.hours || 24),
      
      // Select values
      autoExpireBehavior: this.overlay.querySelector('#settings-auto-expire').value,
      exportFormat: this.overlay.querySelector('#settings-export-format').value,
      
      // Checkboxes
      notificationSounds: this.overlay.querySelector('#settings-notification-sounds')?.checked ?? true,
      screenshotPrevention: this.overlay.querySelector('#settings-screenshot-prevention')?.checked ?? true,
      autoDeleteOnLeave: this.overlay.querySelector('#settings-auto-delete-on-leave')?.checked ?? false,
      sendMessageOnEnter: this.overlay.querySelector('#settings-send-on-enter')?.checked ?? true,
      showTimestamps: this.overlay.querySelector('#settings-show-timestamps')?.checked ?? true,
      showReadReceipts: this.overlay.querySelector('#settings-show-read-receipts')?.checked ?? true,
      showTypingIndicators: this.overlay.querySelector('#settings-show-typing')?.checked ?? true,
      reducedMotion: this.overlay.querySelector('#settings-reduced-motion')?.checked ?? false,
      highContrast: this.overlay.querySelector('#settings-high-contrast')?.checked ?? false,
      screenReaderOptimized: this.overlay.querySelector('#settings-screen-reader')?.checked ?? false,
      debugMode: this.overlay.querySelector('#settings-debug-mode')?.checked ?? false,
      
      // Theme (get from active button)
      theme: this.overlay.querySelector('.theme-btn.active')?.dataset.theme || 'dark',
      
      // Font size
      fontSize: this.overlay.querySelector('.font-size-btn.active')?.dataset.size || 'medium'
    };
    
    SettingsManager.setMultiple(settings);
    this.onSave(settings);
  }
  
  exportSettings() {
    const settings = SettingsManager.export();
    const blob = new Blob([settings], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vent-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  }
  
  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (SettingsManager.import(event.target.result)) {
            this.loadSettings();
            alert('Settings imported successfully!');
          } else {
            alert('Failed to import settings. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }
  
  open() {
    this.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    this.overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  destroy() {
    this.overlay.remove();
  }
}

export default SettingsModal;
