/**
 * Settings Manager
 * Handles application settings with localStorage persistence
 */

export const SettingsManager = {
  // Default settings
  defaults: {
    // Thread settings
    timerPreset: 24,
    autoExpireBehavior: 'both-read', // 'both-read' or 'timer-only'
    
    // Notifications
    notificationSounds: true,
    notificationPermission: 'default',
    
    // Appearance
    theme: 'dark', // 'dark', 'light', or 'auto'
    fontSize: 'medium', // 'small', 'medium', 'large'
    
    // Privacy
    screenshotPrevention: true,
    autoDeleteOnLeave: false,
    
    // Chat
    sendMessageOnEnter: true,
    showTimestamps: true,
    showReadReceipts: true,
    showTypingIndicators: true,
    
    // Accessibility
    reducedMotion: false,
    highContrast: false,
    screenReaderOptimized: false,
    
    // Advanced
    debugMode: false,
    exportFormat: 'json' // 'json', 'csv', or 'text'
  },
  
  // Current settings (loaded from localStorage or defaults)
  current: {},
  
  /**
   * Initialize settings manager
   */
  init() {
    this.load();
    this.applyTheme();
    this.applyAccessibilitySettings();
    this.detectSystemPreferences();
  },
  
  /**
   * Load settings from localStorage
   */
  load() {
    try {
      const saved = localStorage.getItem('vent-settings');
      if (saved) {
        this.current = { ...this.defaults, ...JSON.parse(saved) };
      } else {
        this.current = { ...this.defaults };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.current = { ...this.defaults };
    }
  },
  
  /**
   * Save settings to localStorage
   */
  save() {
    try {
      localStorage.setItem('vent-settings', JSON.stringify(this.current));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  },
  
  /**
   * Get a setting value
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  get(key) {
    return this.current[key];
  },
  
  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {*} value - New value
   */
  set(key, value) {
    this.current[key] = value;
    this.save();
    this.applySetting(key, value);
  },
  
  /**
   * Set multiple settings at once
   * @param {Object} settings - Object with key-value pairs
   */
  setMultiple(settings) {
    Object.assign(this.current, settings);
    this.save();
    Object.keys(settings).forEach(key => {
      this.applySetting(key, settings[key]);
    });
  },
  
  /**
   * Reset all settings to defaults
   */
  reset() {
    this.current = { ...this.defaults };
    this.save();
    this.applyTheme();
    this.applyAccessibilitySettings();
  },
  
  /**
   * Apply a specific setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  applySetting(key, value) {
    switch (key) {
      case 'theme':
        this.applyTheme();
        break;
      case 'fontSize':
        this.applyFontSize();
        break;
      case 'reducedMotion':
      case 'highContrast':
        this.applyAccessibilitySettings();
        break;
    }
  },
  
  /**
   * Apply theme
   */
  applyTheme() {
    const theme = this.get('theme');
    const root = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  },
  
  /**
   * Apply font size
   */
  applyFontSize() {
    const fontSize = this.get('fontSize');
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    document.body.style.fontSize = sizes[fontSize] || sizes.medium;
  },
  
  /**
   * Apply accessibility settings
   */
  applyAccessibilitySettings() {
    const root = document.documentElement;
    
    if (this.get('reducedMotion')) {
      root.setAttribute('data-reduced-motion', 'true');
    } else {
      root.removeAttribute('data-reduced-motion');
    }
    
    if (this.get('highContrast')) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }
  },
  
  /**
   * Detect system preferences
   */
  detectSystemPreferences() {
    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !this.get('reducedMotion')) {
      this.set('reducedMotion', true);
    }
    
    // Detect high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    if (prefersHighContrast && !this.get('highContrast')) {
      this.set('highContrast', true);
    }
    
    // Listen for changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.get('theme') === 'auto') {
        this.applyTheme();
      }
    });
  },
  
  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.set('notificationPermission', permission);
      return permission;
    }
    return 'unsupported';
  },
  
  /**
   * Get all settings as object
   * @returns {Object} All settings
   */
  getAll() {
    return { ...this.current };
  },
  
  /**
   * Export settings as JSON
   * @returns {string} JSON string
   */
  export() {
    return JSON.stringify(this.current, null, 2);
  },
  
  /**
   * Import settings from JSON
   * @param {string} json - JSON string
   */
  import(json) {
    try {
      const settings = JSON.parse(json);
      this.current = { ...this.defaults, ...settings };
      this.save();
      this.applyTheme();
      this.applyFontSize();
      this.applyAccessibilitySettings();
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }
};

export default SettingsManager;
