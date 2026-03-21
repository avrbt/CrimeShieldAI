/**
 * Utility to suppress Google Maps API errors when API key is not configured
 * This prevents console errors from appearing when using the fallback custom map
 */

export function suppressGoogleMapsErrors() {
  // Override console.error to filter out Google Maps errors
  const originalConsoleError = console.error;
  
  console.error = function(...args: any[]) {
    // Check if this is a Google Maps related error
    const errorString = args.join(' ');
    
    // List of Google Maps error patterns to suppress
    const googleMapsErrorPatterns = [
      'Google Maps JavaScript API',
      'ApiProjectMapError',
      'maps.googleapis.com',
      'InvalidKeyMapError',
      'RefererNotAllowedMapError',
      'ApiNotActivatedMapError',
      'ApiTargetBlockedMapError',
      'BillingNotEnabledMapError'
    ];
    
    // Check if any of the error patterns match
    const isGoogleMapsError = googleMapsErrorPatterns.some(pattern => 
      errorString.includes(pattern)
    );
    
    // If it's a Google Maps error, silently ignore it
    // (We're already handling this with a fallback to custom map)
    if (isGoogleMapsError) {
      // Silently ignore - we have a fallback map
      return;
    }
    
    // For all other errors, call the original console.error
    originalConsoleError.apply(console, args);
  };
  
  // Also suppress window-level errors for Google Maps
  const originalWindowError = window.onerror;
  
  window.onerror = function(message, source, lineno, colno, error) {
    const messageStr = String(message);
    
    // Check if this is a Google Maps error
    if (
      messageStr.includes('Google Maps') ||
      messageStr.includes('maps.googleapis.com') ||
      (source && String(source).includes('maps.googleapis.com'))
    ) {
      // Silently ignore Google Maps errors
      return true; // Prevents default error handling
    }
    
    // For other errors, call the original handler if it exists
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    
    return false;
  };
  
  // Suppress unhandled promise rejections from Google Maps
  const originalUnhandledRejection = window.onunhandledrejection;
  
  window.onunhandledrejection = function(event) {
    const reason = event.reason;
    const reasonStr = String(reason);
    
    // Check if this is a Google Maps related rejection
    if (
      reasonStr.includes('Google Maps') ||
      reasonStr.includes('maps.googleapis.com') ||
      reasonStr.includes('ApiProjectMapError')
    ) {
      // Silently ignore Google Maps promise rejections
      event.preventDefault();
      return;
    }
    
    // For other rejections, call the original handler if it exists
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(window, event);
    }
  };
}

/**
 * Initialize error suppression on app startup
 */
export function initializeErrorSuppression() {
  suppressGoogleMapsErrors();
  
  console.log('🛡️ Google Maps error suppression initialized');
  console.log('📍 Using custom map fallback (Google Maps API not configured)');
}
