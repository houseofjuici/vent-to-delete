/**
 * Vent to Delete - Premium Application
 * Main Entry Point with Enhanced Features
 */

import { KeyboardShortcuts } from './lib/keyboard.js';
import { ExportUtility } from './lib/export.js';
import { MessageHistory } from './lib/history.js';
import { SettingsManager } from './lib/settings.js';
import { ServiceWorkerManager } from './lib/service-worker.js';
import { CommandPalette } from './lib/components/CommandPalette.js';
import { KeyboardShortcutsModal } from './lib/components/KeyboardShortcutsModal.js';
import { SettingsModal } from './lib/components/SettingsModal.js';

// ============================================
// GLOBAL APP STATE
// ============================================
window.AppState = {
  currentThreadId: null,
  currentThreadKey: null,
  userId: 'user_' + Math.random().toString(36).substr(2, 9),
  socket: null,
  currentThread: null,
  settings: SettingsManager,
  history: new MessageHistory(),
  export: ExportUtility,
  connectionStatus: 'connected'
};

// ============================================
// COMPONENTS
// ============================================
let commandPalette = null;
let shortcutsModal = null;
let settingsModal = null;

// ============================================
// ENCRYPTION UTILITIES
// ============================================
const Encryption = {
  generateKey() {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  },

  encrypt(message, key) {
    try {
      return CryptoJS.AES.encrypt(message, key).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  },

  decrypt(encryptedMessage, key) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new Error('Decryption failed - invalid key or corrupted message');
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return '🔒 [Encrypted Message]';
    }
  }
};

// ============================================
// AUDIO NOTIFICATIONS
// ============================================
const AudioNotifications = {
  playSound(type) {
    if (!window.AppState.settings.get('notificationSounds')) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
      case 'message':
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'sent':
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
    }
  }
};

// ============================================
// UI MANIPULATION
// ============================================
const UI = {
  showView(viewId) {
    document.querySelectorAll('[id$="-view"]')
      .forEach(el => el.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
  },
  
  getCurrentView() {
    for (const el of document.querySelectorAll('[id$="-view"]')) {
      if (!el.classList.contains('hidden')) {
        return el.id;
      }
    }
    return null;
  },
  
  showHome() {
    window.AppState.currentThreadId = null;
    window.AppState.currentThreadKey = null;
    window.AppState.currentThread = null;
    if (window.AppState.socket) {
      window.AppState.socket.disconnect();
      window.AppState.socket = null;
    }
    this.showView('home-view');
  },
  
  showCreateThread() {
    this.showView('create-view');
    const timerSelect = document.getElementById('thread-timer');
    if (timerSelect) {
      timerSelect.value = window.AppState.settings.get('timerPreset');
    }
  },
  
  showAlert(message, type = 'info') {
    const alertClasses = {
      success: 'alert-success',
      error: 'alert-error',
      info: 'alert-info'
    };
    
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ'
    };
    
    const alertHTML = `
      <div class="alert ${alertClasses[type]}" role="alert">
        <span style="font-size: 18px;">${icons[type]}</span>
        <span>${message}</span>
        <button class="btn-icon alert-close" aria-label="Close alert" style="margin-left: auto;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
    
    const header = document.querySelector('.header');
    header.insertAdjacentHTML('afterend', alertHTML);
    
    const alert = document.querySelector('.alert');
    alert.querySelector('.alert-close')?.addEventListener('click', () => alert.remove());
    
    setTimeout(() => alert?.remove(), 5000);
  },
  
  updateConnectionStatus(status) {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;
    
    const statusConfig = {
      connected: { text: 'Connected', class: 'connected' },
      reconnecting: { text: 'Reconnecting...', class: 'reconnecting' },
      disconnected: { text: 'Disconnected', class: 'disconnected' }
    };
    
    const config = statusConfig[status] || statusConfig.disconnected;
    statusEl.innerHTML = `
      <div class="status-dot"></div>
      <span>${config.text}</span>
    `;
    statusEl.className = `connection-status ${config.class}`;
    
    window.AppState.connectionStatus = status;
  },
  
  openCommandPalette() {
    commandPalette?.toggle();
  },
  
  openShortcutsModal() {
    shortcutsModal?.open();
  },
  
  openSettingsModal() {
    settingsModal?.open();
  }
};

// ============================================
// CHAT FUNCTIONALITY
// ============================================
const Chat = {
  async createThread() {
    const timerHours = document.getElementById('thread-timer').value;
    
    try {
      const response = await fetch('/api/thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timerHours })
      });
      
      const data = await response.json();
      
      if (data.success) {
        window.AppState.currentThreadId = data.threadId;
        window.AppState.currentThreadKey = Encryption.generateKey();
        
        const baseUrl = window.location.origin + '/thread/' + data.threadId;
        const inviteUrl = baseUrl + '#key=' + encodeURIComponent(window.AppState.currentThreadKey);
        
        document.getElementById('invite-link').textContent = inviteUrl;
        document.getElementById('timer-display').textContent = this.formatHours(data.expiresIn / 3600000);
        
        UI.showView('created-view');
        UI.showAlert('Thread created successfully!', 'success');
      } else {
        UI.showAlert('Failed to create thread: ' + data.error, 'error');
      }
    } catch (error) {
      UI.showAlert('Error creating thread: ' + error.message, 'error');
    }
  },
  
  async joinThread() {
    const threadId = document.getElementById('join-thread-id').value.trim();
    if (!threadId) {
      UI.showAlert('Please enter a thread ID', 'error');
      return;
    }
    
    if (!window.AppState.currentThreadKey) {
      window.AppState.currentThreadKey = prompt('Enter encryption key:');
      if (!window.AppState.currentThreadKey) return;
    }
    
    window.AppState.currentThreadId = threadId;
    await this.loadThread(threadId);
  },
  
  async loadThread(threadId) {
    try {
      const response = await fetch(`/api/thread/${threadId}`);
      const data = await response.json();
      
      if (data.success) {
        window.AppState.currentThread = data.thread;
        this.setupChat(threadId);
        UI.showView('chat-view');
        this.renderMessages();
        this.updateStatus();
        this.initPullToRefresh();
        this.initSearch();
      } else {
        UI.showAlert('Thread not found or expired', 'error');
        UI.showHome();
      }
    } catch (error) {
      UI.showAlert('Error loading thread: ' + error.message, 'error');
      UI.showHome();
    }
  },
  
  setupChat(threadId) {
    if (window.AppState.socket) window.AppState.socket.disconnect();
    
    window.AppState.socket = io();
    
    window.AppState.socket.on('connect', () => {
      window.AppState.socket.emit('join-thread', threadId);
      window.AppState.socket.emit('register-participant', { 
        threadId, 
        userId: window.AppState.userId 
      });
      UI.updateConnectionStatus('connected');
    });
    
    window.AppState.socket.on('disconnect', () => {
      UI.updateConnectionStatus('reconnecting');
    });
    
    window.AppState.socket.on('reconnect', () => {
      UI.updateConnectionStatus('connected');
      UI.showAlert('Reconnected to server', 'success');
    });
    
    window.AppState.socket.on('new-message', (message) => {
      window.AppState.currentThread.messages.push(message);
      this.renderMessages();
      AudioNotifications.playSound('message');
      
      if (message.senderId !== window.AppState.userId) {
        this.markMessageRead(message.id);
      }
    });
    
    window.AppState.socket.on('thread-update', (thread) => {
      window.AppState.currentThread = thread;
      this.updateStatus();
      this.renderMessages();
    });
    
    window.AppState.socket.on('message-read', (data) => {
      const message = window.AppState.currentThread.messages.find(m => m.id === data.messageId);
      if (message && !message.readBy.includes(data.userId)) {
        message.readBy.push(data.userId);
        this.renderMessages();
      }
    });
    
    window.AppState.socket.on('user-typing', (data) => {
      if (data.userId !== window.AppState.userId) {
        this.showTypingIndicator(data.userId);
      }
    });
    
    window.AppState.socket.on('message-reaction', (data) => {
      const message = window.AppState.currentThread.messages.find(m => m.id === data.messageId);
      if (message) {
        if (!message.reactions) message.reactions = [];
        const existing = message.reactions.find(r => r.emoji === data.emoji && r.userId === data.userId);
        if (existing) {
          message.reactions = message.reactions.filter(r => r !== existing);
        } else {
          message.reactions.push({ emoji: data.emoji, userId: data.userId });
        }
        this.renderMessages();
      }
    });
    
    window.AppState.socket.on('thread-deleted', (data) => {
      UI.showView('deleted-view');
      UI.showAlert(`Thread deleted: ${data.reason}`, 'info');
    });
    
    window.AppState.socket.on('error', (data) => {
      UI.showAlert('Error: ' + data.message, 'error');
    });
  },
  
  sendMessage() {
    const textarea = document.getElementById('message-input');
    const message = textarea.value.trim();
    
    if (!message) return;
    
    try {
      const encrypted = Encryption.encrypt(message, window.AppState.currentThreadKey);
      
      window.AppState.socket.emit('send-message', {
        threadId: window.AppState.currentThreadId,
        message: encrypted,
        senderId: window.AppState.userId
      });
      
      textarea.value = '';
      textarea.style.height = 'auto';
      AudioNotifications.playSound('sent');
    } catch (error) {
      UI.showAlert('Failed to send message: ' + error.message, 'error');
    }
  },
  
  markMessageRead(messageId) {
    window.AppState.socket.emit('mark-read', {
      threadId: window.AppState.currentThreadId,
      userId: window.AppState.userId,
      messageId: messageId
    });
  },
  
  addReaction(messageId, emoji) {
    window.AppState.socket.emit('add-reaction', {
      threadId: window.AppState.currentThreadId,
      messageId: messageId,
      emoji: emoji,
      userId: window.AppState.userId
    });
  },
  
  showTypingIndicator(userId) {
    let indicator = document.getElementById('typing-indicator');
    if (!indicator) {
      const chatContainer = document.getElementById('chat-container');
      indicator = document.createElement('div');
      indicator.id = 'typing-indicator';
      indicator.className = 'typing-indicator';
      indicator.innerHTML = `
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span>Someone is typing...</span>
      `;
      chatContainer.appendChild(indicator);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    setTimeout(() => indicator?.remove(), 3000);
  },
  
  renderMessages() {
    const container = document.getElementById('chat-container');
    const typingIndicator = document.getElementById('typing-indicator');
    
    if (!window.AppState.currentThread || window.AppState.currentThread.messages.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <h3>No messages yet</h3>
          <p>Start the conversation by sending a message below.</p>
        </div>
      `;
      return;
    }
    
    const messagesToRender = window.AppState.currentThread.messages;
    
    container.innerHTML = messagesToRender.map(msg => {
      const isSent = msg.senderId === window.AppState.userId;
      const decrypted = Encryption.decrypt(msg.content, window.AppState.currentThreadKey);
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const readCount = msg.readBy?.length || 0;
      const totalParticipants = window.AppState.currentThread.participants?.length || 0;
      
      return `
        <div class="message ${isSent ? 'sent' : 'received'}" role="article">
          <div class="message-content">${decrypted}</div>
          <div class="message-meta">
            <span class="message-time">${time}</span>
            ${isSent ? `<span class="message-read ${readCount === totalParticipants && totalParticipants > 1 ? 'read-yes' : 'read-no'}">
              ✓ ${readCount === totalParticipants && totalParticipants > 1 ? 'Read' : `Sent (${readCount}/${totalParticipants})`}
            </span>` : ''}
          </div>
          ${msg.reactions && msg.reactions.length > 0 ? `
            <div class="message-reactions" role="group">
              ${msg.reactions.map(r => `
                <button class="reaction" onclick="Chat.addReaction('${msg.id}', '${r.emoji}')" aria-label="React with ${r.emoji}">
                  ${r.emoji} 1
                </button>
              `).join('')}
            </div>
          ` : `
            <div class="message-reactions" role="group">
              ${['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => `
                <button class="reaction" onclick="Chat.addReaction('${msg.id}', '${emoji}')" aria-label="React with ${emoji}">
                  ${emoji}
                </button>
              `).join('')}
            </div>
          `}
        </div>
      `;
    }).join('');
    
    if (typingIndicator) {
      container.appendChild(typingIndicator);
    }
    
    container.scrollTop = container.scrollHeight;
  },
  
  updateStatus() {
    const statusEl = document.getElementById('thread-status');
    
    if (!window.AppState.currentThread) return;
    
    const timeLeft = window.AppState.currentThread.timeLeft;
    const hours = Math.floor(timeLeft / 3600000);
    const minutes = Math.floor((timeLeft % 3600000) / 60000);
    const participants = window.AppState.currentThread.participants?.length || 0;
    
    let status = `⏱️ ${hours}h ${minutes}m remaining | 👥 ${participants}/2 participants`;
    
    statusEl.className = 'status-bar';
    if (timeLeft < 3600000) {
      statusEl.className += ' danger';
    } else if (timeLeft < 7200000) {
      statusEl.className += ' warning';
    }
    
    statusEl.textContent = status;
    
    if (timeLeft > 0) {
      setTimeout(() => {
        if (window.AppState.currentThread) {
          window.AppState.currentThread.timeLeft -= 1000;
          this.updateStatus();
        }
      }, 1000);
    }
  },
  
  initPullToRefresh() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;
    
    let startY = 0;
    let pulling = false;
    
    chatContainer.addEventListener('touchstart', (e) => {
      if (chatContainer.scrollTop === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    });
    
    chatContainer.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 0 && chatContainer.scrollTop === 0) {
        e.preventDefault();
        const pullIndicator = document.getElementById('pull-to-refresh');
        if (pullIndicator) {
          pullIndicator.style.height = Math.min(diff, 60) + 'px';
          if (diff > 50) {
            pullIndicator.classList.add('active');
            pullIndicator.querySelector('span').textContent = 'Release to refresh';
          }
        }
      }
    });
    
    chatContainer.addEventListener('touchend', () => {
      if (!pulling) return;
      pulling = false;
      
      const pullIndicator = document.getElementById('pull-to-refresh');
      if (pullIndicator && pullIndicator.classList.contains('active')) {
        this.loadThread(window.AppState.currentThreadId);
        pullIndicator.classList.remove('active');
        pullIndicator.querySelector('span').textContent = 'Pull to refresh';
      }
      
      if (pullIndicator) {
        pullIndicator.style.height = '0';
      }
    });
  },
  
  initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const container = document.getElementById('chat-container');
      
      if (!query) {
        this.renderMessages();
        return;
      }
      
      const filteredMessages = window.AppState.currentThread.messages.filter(msg => {
        const decrypted = Encryption.decrypt(msg.content, window.AppState.currentThreadKey);
        return decrypted.toLowerCase().includes(query);
      });
      
      // Render filtered
      if (filteredMessages.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No matches found</h3>
            <p>Try a different search term</p>
          </div>
        `;
      } else {
        // Reuse renderMessages with filtered
        const original = window.AppState.currentThread.messages;
        window.AppState.currentThread.messages = filteredMessages;
        this.renderMessages();
        window.AppState.currentThread.messages = original;
      }
    });
  },
  
  formatHours(hours) {
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
  },
  
  exportMessages(format) {
    if (!window.AppState.currentThread) return;
    
    const decryptFn = (msg) => Encryption.decrypt(msg, window.AppState.currentThreadKey);
    
    switch (format) {
      case 'json':
        window.AppState.export.exportToJSON(
          window.AppState.currentThread.messages,
          window.AppState.currentThreadId,
          decryptFn
        );
        break;
      case 'csv':
        window.AppState.export.exportToCSV(
          window.AppState.currentThread.messages,
          window.AppState.currentThreadId,
          decryptFn
        );
        break;
      case 'text':
        window.AppState.export.exportToText(
          window.AppState.currentThread.messages,
          window.AppState.currentThreadId,
          decryptFn
        );
        break;
    }
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function copyInviteLink() {
  const link = document.getElementById('invite-link').textContent;
  navigator.clipboard.writeText(link).then(() => {
    UI.showAlert('Link copied! Share it with your chat partner.', 'success');
  }).catch(() => {
    UI.showAlert('Failed to copy. Please copy manually.', 'error');
  });
}

function openThread() {
  if (window.AppState.currentThreadId) {
    Chat.loadThread(window.AppState.currentThreadId);
  }
}

// ============================================
// INITIALIZATION
// ============================================
function initializeApp() {
  console.log('🚀 Vent to Delete - Premium Edition');
  
  // Initialize settings
  SettingsManager.init();
  
  // Initialize keyboard shortcuts
  KeyboardShortcuts.init();
  
  // Register global shortcuts
  KeyboardShortcuts.register('mod+k', () => UI.openCommandPalette(), 'Open command palette');
  KeyboardShortcuts.register('mod+/', () => UI.openShortcutsModal(), 'Show keyboard shortcuts');
  KeyboardShortcuts.register('mod+,', () => UI.openSettingsModal(), 'Open settings');
  KeyboardShortcuts.register('escape', () => {
    commandPalette?.close();
    shortcutsModal?.close();
    settingsModal?.close();
  }, 'Close modal');
  
  // Initialize components
  const commands = [
    { 
      id: 'new-thread', 
      icon: '✨', 
      label: 'New Thread', 
      description: 'Create a new ephemeral thread',
      shortcut: 'mod+n',
      category: 'Thread',
      action: () => { UI.showHome(); setTimeout(() => UI.showCreateThread(), 100); }
    },
    { 
      id: 'export-json', 
      icon: '📄', 
      label: 'Export as JSON', 
      description: 'Download chat history as JSON',
      category: 'Export',
      action: () => Chat.exportMessages('json')
    },
    { 
      id: 'export-csv', 
      icon: '📊', 
      label: 'Export as CSV', 
      description: 'Download chat history as CSV',
      category: 'Export',
      action: () => Chat.exportMessages('csv')
    },
    { 
      id: 'export-text', 
      icon: '📝', 
      label: 'Export as Text', 
      description: 'Download chat history as plain text',
      category: 'Export',
      action: () => Chat.exportMessages('text')
    },
    { 
      id: 'settings', 
      icon: '⚙️', 
      label: 'Settings', 
      description: 'Open settings panel',
      shortcut: 'mod+,',
      category: 'General',
      action: () => UI.openSettingsModal()
    },
    { 
      id: 'shortcuts', 
      icon: '⌨️', 
      label: 'Keyboard Shortcuts', 
      description: 'View all keyboard shortcuts',
      shortcut: 'mod+/',
      category: 'General',
      action: () => UI.openShortcutsModal()
    },
    { 
      id: 'home', 
      icon: '🏠', 
      label: 'Go Home', 
      description: 'Return to home screen',
      shortcut: 'mod+shift+h',
      category: 'Navigation',
      action: () => UI.showHome()
    }
  ];
  
  commandPalette = new CommandPalette({
    commands,
    onExecute: (command) => command.action()
  });
  
  shortcutsModal = new KeyboardShortcutsModal({
    shortcuts: commands,
    onClose: () => {}
  });
  
  settingsModal = new SettingsModal({
    onSave: (settings) => {
      console.log('Settings saved:', settings);
    }
  });
  
  // Auto-grow textarea
  const textarea = document.getElementById('message-input');
  if (textarea) {
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
  }
  
  // Check URL for thread on load
  const path = window.location.pathname;
  const match = path.match(/\/thread\/([a-f0-9]+)/);
  
  if (match) {
    const threadId = match[1];
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const key = params.get('key');
    
    if (key) {
      window.AppState.currentThreadId = threadId;
      window.AppState.currentThreadKey = key;
      Chat.loadThread(threadId);
    }
  }
  
  // Register service worker for offline support
  if (ServiceWorkerManager.isSupported) {
    ServiceWorkerManager.register().then(success => {
      if (success) {
        console.log('✅ Service Worker registered');
      }
    });
  }
  
  // Screenshot prevention
  if (SettingsManager.get('screenshotPrevention')) {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        UI.showAlert('Screenshots are disabled for your privacy.', 'info');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        UI.showAlert('Printing is disabled in this app.', 'info');
      }
    });
  }
  
  console.log('✅ App initialized successfully');
  console.log('⌨️ Press ⌘+K to open command palette');
  console.log('⌨️ Press ⌘+/ to view keyboard shortcuts');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Expose to global scope for inline HTML handlers
window.UI = UI;
window.Chat = Chat;
window.copyInviteLink = copyInviteLink;
window.openThread = openThread;
