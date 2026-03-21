import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Create a singleton Supabase client
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!supabaseClient) {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    supabaseClient = createSupabaseClient(supabaseUrl, publicAnonKey);
  }
  return supabaseClient;
}

// API Base URL - Note: Edge function name in URL, but endpoints don't repeat it
const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cfc8313f`;

// MOCK MODE: Set to true to use mock data while Edge Function is being deployed
// Change to false once you've deployed the Edge Function
const USE_MOCK_MODE = true;

// Mock delay to simulate API calls
const mockDelay = () => new Promise(resolve => setTimeout(resolve, 500));

// Track if we've already shown the mock mode warning
let mockModeWarningShown = false;

// Helper function to make API calls (can be public or authenticated)
async function apiCall(endpoint: string, options: RequestInit = {}, requireAuth: boolean = true) {
  // MOCK MODE: Return mock data if Edge Function not deployed yet
  if (USE_MOCK_MODE) {
    // Only show warning once per session
    if (!mockModeWarningShown) {
      console.info('%c🔶 MOCK MODE ACTIVE', 'color: #f97316; font-weight: bold; font-size: 14px;', '\nUsing test data. See README.md to deploy backend.');
      mockModeWarningShown = true;
    }
    return mockApiCall(endpoint, options);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requireAuth) {
    // For authenticated endpoints, try to get session token
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      console.log('Using session token for authenticated request');
    } else {
      // If no session but auth required, use anon key as fallback
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
      console.log('Using anon key for authenticated request (no session)');
    }
  } else {
    // For public endpoints (like signup), use anon key
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
    console.log('Using anon key for public endpoint');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making ${options.method || 'GET'} request to:`, url);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    console.error('API Error Response:', error);
    console.error('Full error details:', {
      status: response.status,
      statusText: response.statusText,
      url,
      method: options.method || 'GET',
    });
    
    // If we get 500 error, suggest enabling mock mode
    if (response.status === 500) {
      console.error('❌ 500 ERROR: Edge Function not deployed or missing environment variables');
      console.error('📖 SOLUTION: Follow deployment guide in /⚡-DO-THIS-NOW.md');
      console.error('⚡ TEMPORARY FIX: Set USE_MOCK_MODE=true in /utils/supabase/client.ts to use app with mock data');
    }
    
    throw new Error(error.error || `Request failed with status ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Mock API responses for development/testing
async function mockApiCall(endpoint: string, options: RequestInit = {}) {
  await mockDelay();
  
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};
  
  console.log(`🔶 MOCK API: ${method} ${endpoint}`, body);
  
  // Mock signup
  if (endpoint === '/auth/signup' && method === 'POST') {
    // Get existing users from localStorage
    const existingUsers = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
    
    // Check if email already exists
    const emailExists = existingUsers.some((u: any) => u.email === body.email);
    if (emailExists) {
      throw new Error('Account already exists with this email');
    }
    
    const mockUser = {
      id: `mock-user-${Date.now()}`,
      email: body.email,
      password: body.password, // In real app, this would be hashed
      name: body.name,
      role: body.role,
      aadhaar: body.aadhaar || '',
      phone: body.phone || '',
      organization: body.organization || '',
      address: body.address || '',
      department: body.department || '',
      organizationId: body.organizationId || '',
      verified: true, // Mark as verified since all profile info is collected at signup
      created_at: new Date().toISOString(),
    };
    
    // Add to users database
    existingUsers.push(mockUser);
    localStorage.setItem('mock_users_db', JSON.stringify(existingUsers));
    
    // Set the user as logged in immediately
    const userWithoutPassword = { ...mockUser, password: undefined };
    localStorage.setItem('mock_user', JSON.stringify(userWithoutPassword));
    
    console.log('✅ MOCK MODE: User registered successfully!');
    console.log(`   Email: ${mockUser.email}`);
    console.log(`   Your credentials are saved in browser storage.`);
    console.log(`   You can logout and login again with these credentials.`);
    
    return {
      success: true,
      user: { ...mockUser, password: undefined }, // Don't return password
      message: '✅ Account created! Logging you in...',
    };
  }
  
  // Mock profile
  if (endpoint === '/auth/profile' && method === 'GET') {
    const mockUser = localStorage.getItem('mock_user');
    if (mockUser) {
      return {
        success: true,
        profile: JSON.parse(mockUser),
      };
    }
    throw new Error('No mock user found');
  }
  
  // Mock alerts list
  if (endpoint.startsWith('/alerts') && method === 'GET') {
    return {
      success: true,
      alerts: [
        {
          id: '1',
          type: 'Suspicious Activity',
          severity: 'high',
          description: 'Mock alert - unusual activity detected',
          location: 'Mumbai, Maharashtra',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'Weapon Detection',
          severity: 'high',
          description: 'Mock alert - potential weapon detected',
          location: 'Delhi NCR',
          created_at: new Date().toISOString(),
        },
      ],
    };
  }
  
  // Mock alert creation
  if (endpoint === '/alerts' && method === 'POST') {
    return {
      success: true,
      alert: { id: `mock-${Date.now()}`, ...body },
      message: 'Mock alert created',
    };
  }
  
  // Mock evidence list
  if (endpoint.startsWith('/evidence') && method === 'GET') {
    return {
      success: true,
      evidence: [
        {
          id: '1',
          title: 'Mock Evidence Item',
          type: 'Image',
          category: 'Suspicious Activity',
          description: 'Mock evidence description',
          location: 'Mumbai',
          created_at: new Date().toISOString(),
        },
      ],
    };
  }
  
  // Mock CCTV feeds
  if (endpoint === '/cctv/feeds' && method === 'GET') {
    return {
      success: true,
      feeds: [
        {
          id: '1',
          name: 'Mock CCTV Feed 1',
          location: 'Mumbai Central',
          status: 'active',
        },
        {
          id: '2',
          name: 'Mock CCTV Feed 2',
          location: 'Delhi Station',
          status: 'active',
        },
      ],
    };
  }
  
  // Mock stats
  if (endpoint === '/stats' && method === 'GET') {
    return {
      success: true,
      stats: {
        totalAlerts: 156,
        activeFeeds: 24,
        evidenceItems: 89,
        detectionRate: 94.2,
      },
    };
  }
  
  // Default mock response
  return {
    success: true,
    message: `Mock response for ${endpoint}`,
    data: body,
  };
}

// ==================== AUTHENTICATION API ====================

export const authAPI = {
  // Sign up new user
  async signUp(data: {
    email: string;
    password: string;
    name: string;
    role: 'citizen' | 'organization';
    aadhaar?: string;
    phone?: string;
    organization?: string;
  }) {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false); // false = public endpoint, doesn't require auth
  },

  // Sign in user (using Supabase client directly)
  async signIn(email: string, password: string) {
    // MOCK MODE: Return mock session
    if (USE_MOCK_MODE) {
      await mockDelay();
      
      // Get all registered users
      const existingUsers = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
      
      // Find user by email
      const user = existingUsers.find((u: any) => u.email === email);
      
      if (!user) {
        throw new Error('No account found with this email. Please sign up first.');
      }
      
      // Check password
      if (user.password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }
      
      // Set current user session
      const userWithoutPassword = { ...user, password: undefined };
      localStorage.setItem('mock_user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('mock_session', 'true');
      
      console.log('✅ MOCK MODE: Login successful!');
      console.log(`   Welcome back, ${user.email}!`);
      console.log(`   Role: ${user.role}`);
      
      return {
        user: userWithoutPassword,
        session: { access_token: 'mock-token' },
      };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Sign out user
  async signOut() {
    // MOCK MODE: Clear mock session
    if (USE_MOCK_MODE) {
      localStorage.removeItem('mock_user');
      localStorage.removeItem('mock_session');
      console.log('🔶 MOCK MODE: Sign out successful');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Get current session
  async getSession() {
    // MOCK MODE: Return mock session
    if (USE_MOCK_MODE) {
      const hasMockSession = localStorage.getItem('mock_session');
      const mockUser = localStorage.getItem('mock_user');
      if (hasMockSession && mockUser) {
        return {
          access_token: 'mock-token',
          user: JSON.parse(mockUser),
        };
      }
      return null;
    }

    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error(error.message);
    }

    return session;
  },

  // Get user profile
  async getProfile() {
    return apiCall('/auth/profile');
  },

  // Update user profile
  async updateProfile(data: any) {
    return apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ==================== ALERTS API ====================

export const alertsAPI = {
  // Create new alert
  async create(data: {
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    location: string;
    latitude?: number;
    longitude?: number;
    state?: string;
    district?: string;
  }) {
    return apiCall('/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all alerts (with optional filters)
  async getAll(filters?: {
    state?: string;
    district?: string;
    severity?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.state) params.append('state', filters.state);
    if (filters?.district) params.append('district', filters.district);
    if (filters?.severity) params.append('severity', filters.severity);
    
    const query = params.toString();
    return apiCall(`/alerts${query ? `?${query}` : ''}`);
  },

  // Update alert
  async update(id: string, data: any) {
    return apiCall(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ==================== EVIDENCE API ====================

export const evidenceAPI = {
  // Store evidence
  async create(data: {
    title: string;
    type: string;
    category: string;
    description: string;
    location: string;
    imageUrl: string;
    tags?: string[];
  }) {
    return apiCall('/evidence', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all evidence
  async getAll(filters?: {
    category?: string;
    type?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.type) params.append('type', filters.type);
    
    const query = params.toString();
    return apiCall(`/evidence${query ? `?${query}` : ''}`);
  },
};

// ==================== CCTV API ====================

export const cctvAPI = {
  // Register new CCTV feed
  async registerFeed(data: {
    name: string;
    location: string;
    latitude?: number;
    longitude?: number;
    status?: string;
    streamUrl?: string;
  }) {
    return apiCall('/cctv/feeds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all CCTV feeds
  async getFeeds() {
    return apiCall('/cctv/feeds');
  },

  // Record detection event
  async recordDetection(data: {
    feedId: string;
    detectionType: string;
    confidence: number;
    timestamp?: string;
    metadata?: any;
  }) {
    return apiCall('/cctv/detections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ==================== THREAT INTELLIGENCE API ====================

export const threatAPI = {
  // Check IP address
  async checkIP(ip: string) {
    return apiCall('/threat/check-ip', {
      method: 'POST',
      body: JSON.stringify({ ip }),
    });
  },

  // Check file hash
  async checkHash(hash: string) {
    return apiCall('/threat/check-hash', {
      method: 'POST',
      body: JSON.stringify({ hash }),
    });
  },
};

// ==================== STATISTICS API ====================

export const statsAPI = {
  // Get dashboard statistics
  async getStats() {
    return apiCall('/stats');
  },
};
