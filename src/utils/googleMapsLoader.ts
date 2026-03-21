// Global singleton for Google Maps API loading
let isLoadingMaps = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

const GOOGLE_MAPS_API_KEY = 'AIzaSyAFaMjdVr5vmalZOe59FkYllrUXbOB0U0c';

export async function loadGoogleMapsAPI(): Promise<boolean> {
  // If already loaded, return immediately
  if (isLoaded && typeof google !== 'undefined' && google.maps) {
    return true;
  }

  // If currently loading, wait for that to finish
  if (isLoadingMaps && loadPromise) {
    await loadPromise;
    return isLoaded;
  }

  // Check if script already exists
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript && typeof google !== 'undefined' && google.maps) {
    isLoaded = true;
    return true;
  }

  // Start loading
  isLoadingMaps = true;
  
  loadPromise = new Promise<void>((resolve, reject) => {
    // Remove any existing scripts first to prevent conflicts
    const oldScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    oldScripts.forEach(script => script.remove());

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (typeof google !== 'undefined' && google.maps) {
        isLoaded = true;
        isLoadingMaps = false;
        console.log('✅ Google Maps API loaded successfully');
        resolve();
      } else {
        isLoadingMaps = false;
        console.error('❌ Google Maps API script loaded but google.maps is not available');
        reject(new Error('Google Maps API not available'));
      }
    };
    
    script.onerror = () => {
      isLoadingMaps = false;
      console.error('❌ Failed to load Google Maps API script');
      reject(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
  });

  try {
    await loadPromise;
    return true;
  } catch (error) {
    console.error('Error loading Google Maps:', error);
    return false;
  }
}

export function isGoogleMapsLoaded(): boolean {
  return isLoaded && typeof google !== 'undefined' && google.maps !== undefined;
}
