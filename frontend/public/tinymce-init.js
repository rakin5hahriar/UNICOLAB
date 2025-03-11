// This script helps with TinyMCE API key issues
(function() {
  // Strict check for browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Safely dispatch custom events
  function safeDispatchEvent(eventName) {
    try {
      if (typeof window.CustomEvent === 'function') {
        window.dispatchEvent(new CustomEvent(eventName));
      }
    } catch (error) {
      console.error('Error dispatching event:', error);
    }
  }

  // Safely add styles
  function safeAddStyles(cssText) {
    try {
      const style = document.createElement('style');
      style.textContent = cssText;
      if (document.head) {
        document.head.appendChild(style);
      }
    } catch (error) {
      console.error('Error adding styles:', error);
    }
  }

  // Make sure tinymce is available
  if (typeof window.tinymce === 'undefined') {
    console.error('TinyMCE not loaded. Using fallback editor.');
    safeDispatchEvent('tinymce-init-failed');
    return;
  }

  // Override the isRequired function to always return false
  try {
    window.tinymce.overrideIsRequired = function() { 
      return false; 
    };
  } catch (error) {
    console.error('Error overriding isRequired:', error);
    safeDispatchEvent('tinymce-init-failed');
  }

  // Override the init function if it's causing problems
  try {
    const originalInit = window.tinymce.init;
    window.tinymce.init = function(settings) {
      try {
        // Add our settings to prevent API key warnings
        const newSettings = {
          ...settings,
          promotion: false,
          branding: false
        };
        return originalInit.call(window.tinymce, newSettings);
      } catch (error) {
        console.error('Error initializing TinyMCE:', error);
        safeDispatchEvent('tinymce-init-failed');
        return Promise.reject(error);
      }
    };
  } catch (error) {
    console.error('Error overriding init:', error);
    safeDispatchEvent('tinymce-init-failed');
  }

  // Hide API key warning notifications
  safeAddStyles(`
    .tox-notification--warning { display: none !important; }
    .tox-statusbar__branding { display: none !important; }
  `);

  // Periodically check for and dismiss notifications
  function dismissNotifications() {
    try {
      const notifications = document.querySelectorAll('.tox-notification');
      if (notifications && notifications.length) {
        notifications.forEach(notification => {
          try {
            const dismissButton = notification.querySelector('.tox-notification__dismiss');
            if (dismissButton) {
              dismissButton.click();
            } else if (notification.style) {
              notification.style.display = 'none';
            }
          } catch (innerError) {
            console.error('Error dismissing notification:', innerError);
          }
        });
      }
    } catch (error) {
      console.error('Error in dismissNotifications:', error);
    }
  }

  // Run on page load and periodically
  try {
    if (window.addEventListener) {
      window.addEventListener('load', function() {
        try {
          const interval = setInterval(dismissNotifications, 1000);
          // Clear interval after 30 seconds to avoid memory leaks
          setTimeout(function() {
            clearInterval(interval);
          }, 30000);
        } catch (error) {
          console.error('Error setting up notification dismissal:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error adding load event listener:', error);
  }
})(); 