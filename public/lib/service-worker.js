/**
 * Service Worker Registration
 * Enables offline support and PWA features
 */

export const ServiceWorkerManager = {
  registration: null,
  isSupported: 'serviceWorker' in navigator,
  
  /**
   * Register service worker
   */
  async register() {
    if (!this.isSupported) {
      console.log('Service Worker not supported');
      return false;
    }
    
    try {
      // Create inline service worker for offline support
      const swCode = this.getServiceWorkerCode();
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);
      
      this.registration = await navigator.serviceWorker.register(swUrl);
      
      console.log('Service Worker registered:', this.registration);
      
      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            this.onUpdateAvailable();
          }
        });
      });
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  },
  
  /**
   * Get service worker code
   * @returns {string} Service worker JavaScript code
   */
  getServiceWorkerCode() {
    return `
      const CACHE_NAME = 'vent-to-delete-v1';
      const urlsToCache = [
        '/',
        '/css/styles.css',
        '/js/app.js',
        '/lib/keyboard.js',
        '/lib/export.js',
        '/lib/history.js',
        '/lib/settings.js',
        '/lib/service-worker.js',
        '/socket.io/socket.io.js'
      ];
      
      // Install event - cache resources
      self.addEventListener('install', (event) => {
        event.waitUntil(
          caches.open(CACHE_NAME)
            .then((cache) => {
              console.log('Opened cache');
              return cache.addAll(urlsToCache.filter(url => {
                // Only cache same-origin URLs
                try {
                  return new URL(url, self.location.href).origin === self.location.origin;
                } catch {
                  return false;
                }
              }));
            })
            .catch((error) => {
              console.log('Cache registration failed:', error);
            })
        );
        self.skipWaiting();
      });
      
      // Fetch event - serve from cache when offline
      self.addEventListener('fetch', (event) => {
        event.respondWith(
          caches.match(event.request)
            .then((response) => {
              // Cache hit - return response
              if (response) {
                return response;
              }
              
              // Clone the request
              const fetchRequest = event.request.clone();
              
              return fetch(fetchRequest).then((response) => {
                // Check if valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }
                
                // Clone the response
                const responseToCache = response.clone();
                
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
                
                return response;
              }).catch(() => {
                // Return a custom offline page
                return caches.match('/offline.html');
              });
            })
        );
      });
      
      // Activate event - clean up old caches
      self.addEventListener('activate', (event) => {
        const cacheWhitelist = [CACHE_NAME];
        
        event.waitUntil(
          caches.keys().then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => {
                if (cacheWhitelist.indexOf(cacheName) === -1) {
                  console.log('Deleting old cache:', cacheName);
                  return caches.delete(cacheName);
                }
              })
            );
          })
        );
        
        self.clients.claim();
      });
      
      // Message event - handle messages from clients
      self.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          self.skipWaiting();
        }
      });
    `;
  },
  
  /**
   * Check for updates
   */
  async checkForUpdate() {
    if (!this.registration) return false;
    
    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('Update check failed:', error);
      return false;
    }
  },
  
  /**
   * Skip waiting and activate new service worker
   */
  skipWaiting() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  },
  
  /**
   * Get current update status
   * @returns {Object} Update status
   */
  getUpdateStatus() {
    if (!this.registration) {
      return { registered: false };
    }
    
    return {
      registered: true,
      updating: !!this.registration.installing,
      waiting: !!this.registration.waiting,
      active: !!this.registration.active
    };
  },
  
  /**
   * Clear all caches
   */
  async clearCache() {
    if (!this.isSupported) return false;
    
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      return true;
    } catch (error) {
      console.error('Cache clear failed:', error);
      return false;
    }
  },
  
  /**
   * Callback for when update is available
   */
  onUpdateAvailable() {
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('sw-update-available'));
  },
  
  /**
   * Unregister service worker
   */
  async unregister() {
    if (!this.registration) return true;
    
    try {
      await this.registration.unregister();
      this.registration = null;
      return true;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }
};

export default ServiceWorkerManager;
