// PostHog Analytics Configuration for Vent to Delete

let isInitialized = false

export const initPostHog = () => {
  if (isInitialized) return

  // Check for DNT (Do Not Track)
  const doNotTrack = navigator.doNotTrack === '1' || window.doNotTrack === '1'

  // Initialize PostHog
  if (window.POSTHOG_KEY && !doNotTrack) {
    // Load PostHog script dynamically
    ;(function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlagPayload getFeatureFlagPayloads".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)})(document,window.posthog||[])

    window.posthog.init(window.POSTHOG_KEY, {
      api_host: window.POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false,
      disable_persistence: false,
      loaded: (ph) => {
        // Check for cookie consent
        const consent = localStorage.getItem('cookie_consent')
        if (consent === 'declined') {
          ph.opt_out_capturing()
        }
      },
    })

    // Track PWA install events
    trackPWAInstall()

    isInitialized = true
  }
}

// Track PWA installation
const trackPWAInstall = () => {
  // Listen for appinstalled event
  window.addEventListener('appinstalled', () => {
    trackEvent('pwa_installed', {
      app: 'vent-to-delete',
      method: 'pwa',
      userAgent: navigator.userAgent,
    })
  })

  // Track beforeinstallprompt
  window.addEventListener('beforeinstallprompt', () => {
    trackEvent('pwa_install_prompt_shown', {
      app: 'vent-to-delete',
    })
  })
}

// Track event helper
export const trackEvent = (event, properties = {}) => {
  if (window.posthog) {
    window.posthog.capture(event, {
      ...properties,
      app: 'vent-to-delete',
      timestamp: new Date().toISOString(),
    })
  }
}

// Track vent created
export const trackVentCreated = (wordCount) => {
  trackEvent('vent_created', {
    word_count: wordCount,
  })
}

// Track vent replied
export const trackVentReplied = (wordCount) => {
  trackEvent('vent_replied', {
    word_count: wordCount,
  })
}

// Track vent read
export const trackVentRead = (threadId) => {
  trackEvent('vent_read', {
    thread_id: threadId,
  })
}

// Track vent deleted
export const trackVentDeleted = (messageCount) => {
  trackEvent('vent_deleted', {
    message_count: messageCount,
  })
}

// Track settings change
export const trackSettingsChange = (setting, value) => {
  trackEvent('settings_changed', {
    setting,
    value_type: typeof value,
  })
}

// Track premium upgrade
export const trackPremiumUpgrade = (plan, price) => {
  trackEvent('premium_upgraded', {
    plan,
    price_usd: price,
    payment_method: 'stripe',
  })
}

// Export for global use
window.analytics = {
  track: trackEvent,
  init: initPostHog,
  trackVentCreated,
  trackVentReplied,
  trackVentRead,
  trackVentDeleted,
  trackSettingsChange,
  trackPremiumUpgrade,
}
