// Sentry Error Tracking for Vent to Delete (Client-side)

// Load Sentry dynamically
;(function() {
  if (!window.SENTRY_DSN) return

  // Inject Sentry script
  const script = document.createElement('script')
  script.src = 'https://browser.sentry-cdn.com/7.108.0/bundle.min.js'
  script.integrity = 'sha384-3WjBKL2HnO6YH3kxe5VUPN+qNhOMwL+oIJ8HvPSh8xBMi/gwO7kGhX5v3jv3zq3'
  script.crossOrigin = 'anonymous'
  script.onload = initSentry
  document.head.appendChild(script)

  function initSentry() {
    if (!window.Sentry) return

    window.Sentry.init({
      dsn: window.SENTRY_DSN,

      environment: window.location.hostname === 'localhost' ? 'development' : 'production',

      tracesSampleRate: window.location.hostname === 'localhost' ? 1.0 : 0.1,

      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,

      integrations: [
        new window.Sentry.BrowserTracing(),
        new window.Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      beforeSend(event, hint) {
        if (window.location.hostname === 'localhost') {
          return null
        }

        const error = hint.originalException

        if (error?.message?.includes('ResizeObserver')) {
          return null
        }

        return event
      },

      beforeBreadcrumb(crumb) {
        if (crumb.category === 'xhr' && crumb.data?.url?.includes('/api/')) {
          delete crumb.data.requestBody
          delete crumb.data.responseBody
        }
        return crumb
      },

      initialScope: {
        tags: {
          app: 'vent-to-delete',
        },
      },
    })

    // Track unhandled errors
    window.addEventListener('error', (event) => {
      window.Sentry.captureException(event.error)
    })

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      window.Sentry.captureException(event.reason)
    })
  }
})()
