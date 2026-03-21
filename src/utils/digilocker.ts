/**
 * DigiLocker Authentication Integration
 * 
 * IMPORTANT: This is a mock implementation for demonstration.
 * For production, you need to:
 * 1. Register at https://www.digilocker.gov.in/
 * 2. Get your Client ID and Client Secret
 * 3. Set up redirect URIs in DigiLocker console
 * 4. Implement backend OAuth flow for security
 */

export interface DigiLockerConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

export interface DigiLockerUser {
  name: string;
  dob: string;
  gender: string;
  photo?: string;
  email?: string;
  mobile?: string;
  aadhaarNumber?: string; // Last 4 digits only
  address?: {
    house: string;
    street: string;
    landmark: string;
    locality: string;
    vtc: string;
    district: string;
    state: string;
    pincode: string;
  };
}

// Mock configuration (Replace with real values in production)
const config: DigiLockerConfig = {
  clientId: 'YOUR_DIGILOCKER_CLIENT_ID',
  clientSecret: 'YOUR_DIGILOCKER_CLIENT_SECRET',
  redirectUri: `${window.location.origin}/auth/digilocker/callback`,
  environment: 'sandbox'
};

export const digiLockerService = {
  /**
   * Initiate DigiLocker OAuth flow
   * In production, this redirects to DigiLocker login page
   */
  initiateLogin: async () => {
    try {
      const baseUrl = config.environment === 'sandbox' 
        ? 'https://sandbox.digitallocker.gov.in/public/oauth2/1/authorize'
        : 'https://digilocker.gov.in/public/oauth2/1/authorize';

      const state = generateState();
      const codeChallenge = generateCodeChallenge();

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        state: state, // CSRF protection
        code_challenge: codeChallenge, // PKCE
        code_challenge_method: 'S256'
      });

      // Store state and code verifier in session
      sessionStorage.setItem('digilocker_state', state);
      sessionStorage.setItem('digilocker_timestamp', Date.now().toString());
      
      console.log('🔐 DigiLocker: Initiating authentication flow...');
      
      // In production, this would redirect to DigiLocker
      // window.location.href = `${baseUrl}?${params.toString()}`;
      
      // For demo, simulate the OAuth flow
      return await simulateDigiLockerAuth();
    } catch (error) {
      console.error('❌ DigiLocker initiation error:', error);
      throw error;
    }
  },

  /**
   * Handle OAuth callback and exchange code for tokens
   * This should be done on backend for security
   */
  handleCallback: async (code: string, state: string): Promise<DigiLockerUser | null> => {
    try {
      // Verify state for CSRF protection
      const savedState = sessionStorage.getItem('digilocker_state');
      if (!savedState) {
        throw new Error('Session expired. Please try again.');
      }
      
      if (state !== savedState) {
        throw new Error('Invalid state parameter. Security check failed.');
      }
      
      // Check timestamp to prevent old session reuse
      const timestamp = sessionStorage.getItem('digilocker_timestamp');
      if (timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age > 5 * 60 * 1000) { // 5 minutes
          throw new Error('Session expired. Please try again.');
        }
      }

      console.log('✅ DigiLocker: State verified successfully');
      console.log('🔄 DigiLocker: Exchanging authorization code for access token...');

      // In production, make backend API call to exchange code for access token
      // const response = await fetch('/api/digilocker/token', {
      //   method: 'POST',
      //   body: JSON.stringify({ code })
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📥 DigiLocker: Fetching user profile...');
      
      // For demo, return mock user data
      const userData = simulateDigiLockerUserData();
      
      console.log('✅ DigiLocker: User data fetched successfully:', userData.name);
      
      // Clear session data after successful auth
      sessionStorage.removeItem('digilocker_state');
      sessionStorage.removeItem('digilocker_timestamp');
      
      return userData;
    } catch (error) {
      console.error('❌ DigiLocker callback error:', error);
      // Clear session data on error
      sessionStorage.removeItem('digilocker_state');
      sessionStorage.removeItem('digilocker_timestamp');
      throw error;
    }
  },

  /**
   * Get user profile from DigiLocker
   * In production, this calls DigiLocker API with access token
   */
  getUserProfile: async (accessToken: string): Promise<DigiLockerUser | null> => {
    try {
      // In production:
      // const response = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/user', {
      //   headers: {
      //     'Authorization': `Bearer ${accessToken}`
      //   }
      // });
      // return await response.json();
      
      return simulateDigiLockerUserData();
    } catch (error) {
      console.error('Failed to fetch DigiLocker profile:', error);
      return null;
    }
  },

  /**
   * Fetch specific document from DigiLocker
   */
  getDocument: async (accessToken: string, uri: string): Promise<any> => {
    // In production, fetch document from DigiLocker
    // const response = await fetch(`https://api.digitallocker.gov.in/public/oauth2/1/file/${uri}`, {
    //   headers: { 'Authorization': `Bearer ${accessToken}` }
    // });
    return null;
  }
};

// Helper functions
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function generateCodeChallenge(): string {
  // In production, use proper PKCE implementation
  const codeVerifier = generateState();
  sessionStorage.setItem('code_verifier', codeVerifier);
  return codeVerifier; // Should be SHA256 hash in production
}

/**
 * Simulate DigiLocker OAuth flow for demonstration
 * In production, this entire function is replaced by real OAuth redirect
 */
function simulateDigiLockerAuth(): Promise<{ code: string; state: string }> {
  return new Promise((resolve, reject) => {
    // Simulate user going to DigiLocker, logging in, and returning
    setTimeout(() => {
      try {
        const code = 'mock_auth_code_' + Date.now();
        const state = sessionStorage.getItem('digilocker_state') || '';
        
        if (!state) {
          reject(new Error('Session state not found. Please try again.'));
          return;
        }
        
        resolve({ code, state });
      } catch (error) {
        reject(new Error('Failed to simulate DigiLocker authentication'));
      }
    }, 2000);
  });
}

/**
 * Simulate DigiLocker user data
 * In production, this data comes from real DigiLocker API
 */
function simulateDigiLockerUserData(): DigiLockerUser {
  // Generate random but realistic Indian names
  const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Kavya'];
  const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy', 'Iyer', 'Verma', 'Shah'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const middleName = Math.random() > 0.5 ? 'Kumar' : '';
  
  const name = middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;
  
  // Generate random phone number
  const phoneNumber = `+91 ${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 90000 + 10000)}`;
  
  // Generate random last 4 digits for Aadhaar
  const aadhaarLast4 = Math.floor(Math.random() * 9000 + 1000);
  
  return {
    name,
    dob: '1990-05-15',
    gender: Math.random() > 0.5 ? 'M' : 'F',
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@digilocker.gov.in`,
    mobile: phoneNumber,
    aadhaarNumber: `****-****-${aadhaarLast4}`, // Last 4 digits only
    photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`,
    address: {
      house: `House No. ${Math.floor(Math.random() * 500 + 1)}`,
      street: 'MG Road',
      landmark: 'Near City Mall',
      locality: 'Sector 17',
      vtc: 'Mumbai',
      district: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    }
  };
}

/**
 * Check if DigiLocker is properly configured
 */
export function isDigiLockerConfigured(): boolean {
  return config.clientId !== 'YOUR_DIGILOCKER_CLIENT_ID' && 
         config.clientSecret !== 'YOUR_DIGILOCKER_CLIENT_SECRET';
}

/**
 * Instructions for real DigiLocker integration:
 * 
 * 1. Register your application at DigiLocker Developer Portal
 * 2. Get Client ID and Client Secret
 * 3. Configure redirect URIs
 * 4. Implement backend OAuth flow (NEVER expose client secret on frontend)
 * 5. Store access tokens securely
 * 6. Handle token refresh
 * 7. Implement proper error handling
 * 8. Add rate limiting and security measures
 * 
 * DigiLocker API Documentation: https://www.digilocker.gov.in/assets/developers/documentation/
 */
