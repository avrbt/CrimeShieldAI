/**
 * Geocoding utilities using OpenStreetMap Nominatim API
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  displayName: string;
}

/**
 * Reverse geocode coordinates to location details using OpenStreetMap Nominatim
 * @param lat Latitude
 * @param lon Longitude
 * @returns Promise with location details
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodingResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&zoom=10`,
      {
        headers: {
          'User-Agent': 'CrimeShieldAI/1.0', // Required by Nominatim usage policy
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.address) {
      throw new Error('No address data received from Nominatim');
    }

    const address = data.address;

    return {
      latitude: lat,
      longitude: lon,
      city: address.city || address.town || address.village || address.suburb || 'Unknown',
      state: address.state || address.region || 'Unknown',
      country: address.country || 'India',
      displayName: data.display_name || `${lat}, ${lon}`
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

/**
 * Forward geocode location name to coordinates using OpenStreetMap Nominatim
 * @param locationQuery Location search query (e.g., "Mumbai, Maharashtra, India")
 * @returns Promise with location details
 */
export async function forwardGeocode(
  locationQuery: string
): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&addressdetails=1&limit=1`,
      {
        headers: {
          'User-Agent': 'CrimeShieldAI/1.0',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    const address = result.address || {};

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      city: address.city || address.town || address.village || address.suburb || 'Unknown',
      state: address.state || address.region || 'Unknown',
      country: address.country || 'India',
      displayName: result.display_name || locationQuery
    };
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return null;
  }
}

/**
 * Get user's current position using browser geolocation API
 * @param options Geolocation options
 * @returns Promise with coordinates and accuracy
 */
export function getCurrentPosition(
  options?: PositionOptions
): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout';
            break;
        }
        reject(new Error(errorMessage));
      },
      options || {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Watch user's position for changes
 * @param callback Callback function called with updated position
 * @param errorCallback Callback function called on error
 * @param options Geolocation options
 * @returns Watch ID that can be used to clear the watch
 */
export function watchPosition(
  callback: (position: { latitude: number; longitude: number; accuracy: number }) => void,
  errorCallback?: (error: Error) => void,
  options?: PositionOptions
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    },
    (error) => {
      if (errorCallback) {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location timeout';
            break;
        }
        errorCallback(new Error(errorMessage));
      }
    },
    options || {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

/**
 * Clear position watch
 * @param watchId Watch ID returned from watchPosition
 */
export function clearWatch(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}
