/**
 * Vent to Delete - Premium Application
 * Enhanced with keyboard shortcuts, reactions, typing indicators, search, and settings
 */

// ============================================
// APP STATE
// ============================================
const AppState = {
  currentThreadId: null,
  currentThreadKey: null,
  userId: 'user_' + Math.random().toString(36).substr(2, 9),
  socket: null,
  currentThread: null,
  settings: {
    timerPreset: 24,
    notificationSounds: true,
    autoExpireBehavior: 'both-read',
    theme: 'dark'
  },
  typing: {
    isTyping: false,
    timeout: null
  },
  searchQuery: '',
  connectionStatus: 'connected'
};

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
    if (!AppState.settings.notificationSounds) return;
    
    // Create audio context for notification sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different sounds for different events
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
// KEYBOARD SHORTCUTS
// ============================================
const KeyboardShortcuts = {
  init() {
    document.addEventListener('keydown', (e) => {
      // Escape - Close modal or return to home
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeModal();
        return;
      }
      
      // Cmd/Ctrl + K - Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.openCommandPalette();
        return;
      }
      
      // Cmd/Ctrl + / - Show keyboard shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        this.showShortcutsHelp();
        return;
      }
      
      // Only in chat view
      if (UI.getCurrentView() === 'chat-view') {
        // Enter - Send message (if not in textarea with shift)
        if (e.key === 'Enter' && !e.shiftKey && document.activeElement.tagName === 'TEXTAREA') {
          e.preventDefault();
          Chat.sendMessage();
          return;
        }
        
        // Cmd/Ctrl + N - New thread
        if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
          e.preventDefault();
          UI.showHome();
          setTimeout(() => UI.showCreateThread(), 100);
          return;
        }
        
        // Cmd/Ctrl + F - Focus search
        if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
          e.preventDefault();
          document.getElementById('search-input')?.focus();
          return;
        }
      }
    });
  },
  
  closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.remove();
    }
  },
  
  openCommandPalette() {
    const commands = [
      { label: 'New Thread', shortcut: '⌘N', action: () => { this.closeModal(); UI.showHome(); setTimeout(() => UI.showCreateThread(), 100); }},
      { label: 'Search Messages', shortcut: '⌘F', action: () => { this.closeModal(); document.getElementById('search-input')?.focus(); }},
      { label: 'Open Settings', shortcut: '⌘,', action: () => { this.closeModal(); UI.openSettings(); }},
      { label: 'Show Shortcuts', shortcut: '⌘/', action: () => { this.closeModal(); this.showShortcutsHelp(); }}
    ];
    
    const modalHTML = `
      <div class="modal-overlay" role="dialog" aria-labelledby="command-palette-title">
        <div class="modal">
          <div class="modal-header">
            <h2 id="command-palette-title">Command Palette</h2>
            <button class="btn-icon" onclick="KeyboardShortcuts.closeModal()" aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="input-group">
              <input type="text" id="command-search" placeholder="Type a command..." autofocus oninput="KeyboardShortcuts.filterCommands(this.value)">
            </div>
            <div id="command-list">
              ${commands.map((cmd, i) => `
                <button class="btn btn-secondary" style="width: 100%; margin-bottom: 8px; text-align: left;" onclick="commands[${i}].action()" data-command="${cmd.label.toLowerCase()}">
                  <span style="flex: 1">${cmd.label}</span>
                  <span style="opacity: 0.6">${cmd.shortcut}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('command-search').focus();
  },
  
  filterCommands(query) {
    const buttons = document.querySelectorAll('#command-list button');
    buttons.forEach(btn => {
      const command = btn.dataset.command;
      btn.style.display = command.includes(query.toLowerCase()) ? 'flex' : 'none';
    });
  },
  
  showShortcutsHelp() {
    const shortcutsHTML = `
      <div class="modal-overlay" role="dialog" aria-labelledby="shortcuts-title">
        <div class="modal">
          <div class="modal-header">
            <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
            <button class="btn-icon" onclick="KeyboardShortcuts.closeModal()" aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="shortcuts-list">
              <div class="shortcut-item">
                <span>Send message</span>
                <div class="shortcut-keys"><kbd>Enter</kbd></div>
              </div>
              <div class="shortcut-item">
                <span>New line in message</span>
                <div class="shortcut-keys"><kbd>Shift</kbd> + <kbd>Enter</kbd></div>
              </div>
              <div class="shortcut-item">
                <span>Close modal / dialog</span>
                <div class="shortcut-keys"><kbd>Esc</kbd></div>
              </div>
              <div class="shortcut-item">
                <span>Command palette</span>
                <div class="shortcut-keys"><kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd></div>
              </div>
              <div class="shortcut-item">
                <span>New thread</span>
                <div class="shortcut-keys"><kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>N</kbd></div>
              </div>
              <div class="shortcut-item">
                <span>Search messages</span>
                <div class="shortcut-keys"><kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>F</kbd></div>
              </div>
              <div class="shortcut-item">
                <span>Show shortcuts</span>
                <div class="shortcut-keys"><kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>/</kbd></div>
              </div>
              <div class="shortcut-item">
                <span>Open settings</span>
                <div class="shortcut-keys"><kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>,</kbd></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', shortcutsHTML);
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
    AppState.currentThreadId = null;
    AppState.currentThreadKey = null;
    AppState.currentThread = null;
    if (AppState.socket) {
      AppState.socket.disconnect();
      AppState.socket = null;
    }
    this.showView('home-view');
  },
  
  showCreateThread() {
    this.showView('create-view');
    document.getElementById('thread-timer').value = AppState.settings.timerPreset;
  },
  
  showLoading(message = 'Loading...') {
    const loadingHTML = `
      <div class="loading" role="status" aria-live="polite">
        <div class="loading-spinner"></div>
        <p>${message}</p>
      </div>
    `;
    return loadingHTML;
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
      </div>
    `;
    
    // Insert after header
    const header = document.querySelector('.header');
    header.insertAdjacentHTML('afterend', alertHTML);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      document.querySelector('.alert')?.remove();
    }, 5000);
  },
  
  openSettings() {
    const settingsHTML = `
      <div class="modal-overlay" role="dialog" aria-labelledby="settings-title">
        <div class="modal">
          <div class="modal-header">
            <h2 id="settings-title">Settings</h2>
            <button class="btn-icon" onclick="KeyboardShortcuts.closeModal()" aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="settings-panel">
              <h3>Thread Timer Preset</h3>
              <div class="settings-group">
                <div class="timer-presets">
                  ${[1, 6, 12, 24, 48, 72, 168].map(hours => `
                    <button class="timer-preset ${AppState.settings.timerPreset === hours ? 'active' : ''}" 
                            onclick="Settings.setTimerPreset(${hours})" 
                            aria-pressed="${AppState.settings.timerPreset === hours}">
                      ${hours < 24 ? `${hours}h` : hours === 24 ? '1 day' : `${hours/24} days`}
                    </button>
                  `).join('')}
                </div>
              </div>
              
              <h3>Notifications</h3>
              <div class="settings-group">
                <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                  <input type="checkbox" 
                         ${AppState.settings.notificationSounds ? 'checked' : ''} 
                         onchange="Settings.toggleNotificationSounds()"
                         style="width: 20px; height: 20px;">
                  <span>Play notification sounds</span>
                </label>
                <p class="description">Play subtle sounds when messages are sent or received</p>
              </div>
              
              <h3>Auto-Expire Behavior</h3>
              <div class="settings-group">
                <select onchange="Settings.setAutoExpireBehavior(this.value)" style="width: 100%;">
                  <option value="both-read" ${AppState.settings.autoExpireBehavior === 'both-read' ? 'selected' : ''}>
                    Delete when both read all messages
                  </option>
                  <option value="timer-only" ${AppState.settings.autoExpireBehavior === 'timer-only' ? 'selected' : ''}>
                    Delete only when timer expires
                  </option>
                </select>
                <p class="description">Choose when threads should be automatically deleted</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="KeyboardShortcuts.closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', settingsHTML);
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
    
    AppState.connectionStatus = status;
  }
};

// ============================================
// SETTINGS
// ============================================
const Settings = {
  setTimerPreset(hours) {
    AppState.settings.timerPreset = hours;
    document.querySelectorAll('.timer-preset').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    event.target.classList.add('active');
    event.target.setAttribute('aria-pressed', 'true');
    
    // Save to localStorage
    localStorage.setItem('vent-settings', JSON.stringify(AppState.settings));
  },
  
  toggleNotificationSounds() {
    AppState.settings.notificationSounds = !AppState.settings.notificationSounds;
    localStorage.setItem('vent-settings', JSON.stringify(AppState.settings));
  },
  
  setAutoExpireBehavior(behavior) {
    AppState.settings.autoExpireBehavior = behavior;
    localStorage.setItem('vent-settings', JSON.stringify(AppState.settings));
  },
  
  load() {
    const saved = localStorage.getItem('vent-settings');
    if (saved) {
      try {
        AppState.settings = { ...AppState.settings, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
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
        AppState.currentThreadId = data.threadId;
        AppState.currentThreadKey = Encryption.generateKey();
        
        const baseUrl = window.location.origin + '/thread/' + data.threadId;
        const inviteUrl = baseUrl + '#key=' + encodeURIComponent(AppState.currentThreadKey);
        
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
    
    if (!AppState.currentThreadKey) {
      AppState.currentThreadKey = prompt('Enter encryption key:');
      if (!AppState.currentThreadKey) return;
    }
    
    AppState.currentThreadId = threadId;
    await this.loadThread(threadId);
  },
  
  async loadThread(threadId) {
    try {
      const response = await fetch(`/api/thread/${threadId}`);
      const data = await response.json();
      
      if (data.success) {
        AppState.currentThread = data.thread;
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
    if (AppState.socket) AppState.socket.disconnect();
    
    AppState.socket = io();
    
    AppState.socket.on('connect', () => {
      AppState.socket.emit('join-thread', threadId);
      AppState.socket.emit('register-participant', { threadId, userId: AppState.userId });
      UI.updateConnectionStatus('connected');
    });
    
    AppState.socket.on('disconnect', () => {
      UI.updateConnectionStatus('reconnecting');
    });
    
    AppState.socket.on('reconnect', () => {
      UI.updateConnectionStatus('connected');
      UI.showAlert('Reconnected to server', 'success');
    });
    
    AppState.socket.on('new-message', (message) => {
      AppState.currentThread.messages.push(message);
      this.renderMessages();
      AudioNotifications.playSound('message');
      
      // Auto-mark received messages as read
      if (message.senderId !== AppState.userId) {
        this.markMessageRead(message.id);
      }
    });
    
    AppState.socket.on('thread-update', (thread) => {
      AppState.currentThread = thread;
      this.updateStatus();
      this.renderMessages();
    });
    
    AppState.socket.on('message-read', (data) => {
      const message = AppState.currentThread.messages.find(m => m.id === data.messageId);
      if (message && !message.readBy.includes(data.userId)) {
        message.readBy.push(data.userId);
        this.renderMessages();
      }
    });
    
    AppState.socket.on('user-typing', (data) => {
      if (data.userId !== AppState.userId) {
        this.showTypingIndicator(data.userId);
      }
    });
    
    AppState.socket.on('message-reaction', (data) => {
      const message = AppState.currentThread.messages.find(m => m.id === data.messageId);
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
    
    AppState.socket.on('thread-deleted', (data) => {
      UI.showView('deleted-view');
      UI.showAlert(`Thread deleted: ${data.reason}`, 'info');
    });
    
    AppState.socket.on('error', (data) => {
      UI.showAlert('Error: ' + data.message, 'error');
    });
  },
  
  sendMessage() {
    const textarea = document.getElementById('message-input');
    const message = textarea.value.trim();
    
    if (!message) return;
    
    try {
      const encrypted = Encryption.encrypt(message, AppState.currentThreadKey);
      
      AppState.socket.emit('send-message', {
        threadId: AppState.currentThreadId,
        message: encrypted,
        senderId: AppState.userId
      });
      
      textarea.value = '';
      textarea.style.height = 'auto'; // Reset height
      AudioNotifications.playSound('sent');
      
      // Clear typing indicator
      this.stopTyping();
    } catch (error) {
      UI.showAlert('Failed to send message: ' + error.message, 'error');
    }
  },
  
  markMessageRead(messageId) {
    AppState.socket.emit('mark-read', {
      threadId: AppState.currentThreadId,
      userId: AppState.userId,
      messageId: messageId
    });
  },
  
  addReaction(messageId, emoji) {
    AppState.socket.emit('add-reaction', {
      threadId: AppState.currentThreadId,
      messageId: messageId,
      emoji: emoji,
      userId: AppState.userId
    });
  },
  
  startTyping() {
    if (AppState.typing.isTyping) return;
    
    AppState.typing.isTyping = true;
    AppState.socket?.emit('user-typing', {
      threadId: AppState.currentThreadId,
      userId: AppState.userId
    });
    
    clearTimeout(AppState.typing.timeout);
    AppState.typing.timeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  },
  
  stopTyping() {
    AppState.typing.isTyping = false;
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
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      indicator?.remove();
    }, 3000);
  },
  
  renderMessages() {
    const container = document.getElementById('chat-container');
    const typingIndicator = document.getElementById('typing-indicator');
    
    if (!AppState.currentThread || AppState.currentThread.messages.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <h3>No messages yet</h3>
          <p>Start the conversation by sending a message below.</p>
        </div>
      `;
      return;
    }
    
    // Filter messages if search is active
    let messagesToRender = AppState.currentThread.messages;
    if (AppState.searchQuery) {
      const query = AppState.searchQuery.toLowerCase();
      messagesToRender = messagesToRender.filter(msg => {
        const decrypted = Encryption.decrypt(msg.content, AppState.currentThreadKey);
        return decrypted.toLowerCase().includes(query);
      });
    }
    
    container.innerHTML = messagesToRender.map(msg => {
      const isSent = msg.senderId === AppState.userId;
      const decrypted = Encryption.decrypt(msg.content, AppState.currentThreadKey);
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const readCount = msg.readBy?.length || 0;
      const totalParticipants = AppState.currentThread.participants?.length || 0;
      
      // Highlight search matches
      let content = decrypted;
      if (AppState.searchQuery) {
        const regex = new RegExp(`(${AppState.searchQuery})`, 'gi');
        content = content.replace(regex, '<mark>$1</mark>');
      }
      
      return `
        <div class="message ${isSent ? 'sent' : 'received'}" role="article" aria-label="${isSent ? 'Your message' : 'Received message'}">
          <div class="message-content">${content}</div>
          <div class="message-meta">
            <span class="message-time">${time}</span>
            ${isSent ? `<span class="message-read ${readCount === totalParticipants && totalParticipants > 1 ? 'read-yes' : 'read-no'}" aria-label="${readCount} of ${totalParticipants} have read">
              ✓ ${readCount === totalParticipants && totalParticipants > 1 ? 'Read' : `Sent (${readCount}/${totalParticipants})`}
            </span>` : ''}
          </div>
          ${msg.reactions && msg.reactions.length > 0 ? `
            <div class="message-reactions" role="group" aria-label="Reactions">
              ${msg.reactions.map(r => `
                <button class="reaction" onclick="Chat.addReaction('${msg.id}', '${r.emoji}')" aria-label="React with ${r.emoji}">
                  ${r.emoji} ${r.count || 1}
                </button>
              `).join('')}
            </div>
          ` : `
            <div class="message-reactions" role="group" aria-label="Add reaction">
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
    
    // Re-add typing indicator if it was present
    if (typingIndicator) {
      container.appendChild(typingIndicator);
    }
    
    container.scrollTop = container.scrollHeight;
  },
  
  updateStatus() {
    const statusEl = document.getElementById('thread-status');
    
    if (!AppState.currentThread) return;
    
    const timeLeft = AppState.currentThread.timeLeft;
    const hours = Math.floor(timeLeft / 3600000);
    const minutes = Math.floor((timeLeft % 3600000) / 60000);
    const participants = AppState.currentThread.participants?.length || 0;
    
    let status = `⏱️ ${hours}h ${minutes}m remaining | 👥 ${participants}/2 participants`;
    
    statusEl.className = 'status-bar';
    if (timeLeft < 3600000) {
      statusEl.className += ' danger';
    } else if (timeLeft < 7200000) {
      statusEl.className += ' warning';
    }
    
    statusEl.textContent = status;
    
    // Update countdown every second
    if (timeLeft > 0) {
      setTimeout(() => {
        if (AppState.currentThread) {
          AppState.currentThread.timeLeft -= 1000;
          this.updateStatus();
        }
      }, 1000);
    }
  },
  
  initPullToRefresh() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;
    
    let startY = 0;
    let currentY = 0;
    let pulling = false;
    
    chatContainer.addEventListener('touchstart', (e) => {
      if (chatContainer.scrollTop === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    });
    
    chatContainer.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      currentY = e.touches[0].clientY;
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
        // Refresh messages
        this.loadThread(AppState.currentThreadId);
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
      AppState.searchQuery = e.target.value;
      this.renderMessages();
    });
  },
  
  formatHours(hours) {
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
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
  if (AppState.currentThreadId) {
    Chat.loadThread(AppState.currentThreadId);
  }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Load settings
  Settings.load();
  
  // Initialize keyboard shortcuts
  KeyboardShortcuts.init();
  
  // Auto-grow textarea
  const textarea = document.getElementById('message-input');
  if (textarea) {
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 200) + 'px';
      
      // Send typing indicator
      Chat.startTyping();
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
      AppState.currentThreadId = threadId;
      AppState.currentThreadKey = key;
      Chat.loadThread(threadId);
    }
  }
});

// Screenshot prevention
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

// Visibility change detection
let lastVisibility = document.visibilityState;
document.addEventListener('visibilitychange', function() {
  if (lastVisibility === 'visible' && document.visibilityState === 'hidden') {
    console.log('App hidden - screen recording may be active');
  }
  lastVisibility = document.visibilityState;
});
