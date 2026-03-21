// Cookie-based authentication utilities using localStorage

export interface UserProfile {
  id: string;
  email: string;
  userType: 'admin' | 'citizen';
  name: string;
  phone?: string;
  address?: string;
  idProof?: string;
  organizationName?: string;
  organizationId?: string;
  department?: string;
  verified: boolean;
  createdAt: string;
}

export interface AuthCookie {
  userId: string;
  userType: 'admin' | 'citizen';
  sessionToken: string;
  expiresAt: string;
}

// Simulated database using localStorage
const USERS_KEY = 'crimeshield_users';
const AUTH_COOKIE_KEY = 'crimeshield_auth';
const CURRENT_USER_KEY = 'crimeshield_current_user';

export const authUtils = {
  // Get all users
  getAllUsers: (): Map<string, UserProfile> => {
    const usersJson = localStorage.getItem(USERS_KEY);
    if (!usersJson) return new Map();
    const usersArray = JSON.parse(usersJson);
    return new Map(usersArray);
  },

  // Save users
  saveUsers: (users: Map<string, UserProfile>) => {
    const usersArray = Array.from(users.entries());
    localStorage.setItem(USERS_KEY, JSON.stringify(usersArray));
  },

  // Register new user
  register: (email: string, password: string, userType: 'admin' | 'citizen'): { success: boolean; error?: string; userId?: string } => {
    const users = authUtils.getAllUsers();
    
    if (users.has(email)) {
      return { success: false, error: 'Account already exists with this email' };
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const profile: UserProfile = {
      id: userId,
      email,
      userType,
      name: '',
      verified: false,
      createdAt: new Date().toISOString()
    };

    users.set(email, profile);
    
    // Store password separately (in real app, this would be hashed)
    const passwords = JSON.parse(localStorage.getItem('crimeshield_passwords') || '{}');
    passwords[email] = password;
    localStorage.setItem('crimeshield_passwords', JSON.stringify(passwords));
    
    authUtils.saveUsers(users);
    return { success: true, userId };
  },

  // Login user
  login: (email: string, password: string): { success: boolean; error?: string; user?: UserProfile } => {
    const users = authUtils.getAllUsers();
    const user = users.get(email);

    if (!user) {
      return { success: false, error: 'No account found. Please sign up first.' };
    }

    const passwords = JSON.parse(localStorage.getItem('crimeshield_passwords') || '{}');
    if (passwords[email] !== password) {
      return { success: false, error: 'Incorrect password' };
    }

    // Create session
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const authCookie: AuthCookie = {
      userId: user.id,
      userType: user.userType,
      sessionToken,
      expiresAt
    };

    localStorage.setItem(AUTH_COOKIE_KEY, JSON.stringify(authCookie));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    return { success: true, user };
  },

  // Get current session
  getSession: (): AuthCookie | null => {
    const cookieJson = localStorage.getItem(AUTH_COOKIE_KEY);
    if (!cookieJson) return null;

    const cookie: AuthCookie = JSON.parse(cookieJson);
    
    // Check if expired
    if (new Date(cookie.expiresAt) < new Date()) {
      authUtils.logout();
      return null;
    }

    return cookie;
  },

  // Get current user
  getCurrentUser: (): UserProfile | null => {
    // Check new mock_user first (from Supabase mock mode)
    const mockUserJson = localStorage.getItem('mock_user');
    if (mockUserJson) {
      const mockUser = JSON.parse(mockUserJson);
      // Convert mock user format to UserProfile format
      return {
        id: mockUser.id,
        email: mockUser.email,
        userType: mockUser.role === 'organization' ? 'admin' : 'citizen',
        name: mockUser.name || mockUser.email.split('@')[0],
        verified: true,
        createdAt: mockUser.created_at || new Date().toISOString()
      };
    }
    
    // Fall back to old format
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) return null;
    return JSON.parse(userJson);
  },

  // Update user profile
  updateProfile: (email: string, updates: Partial<UserProfile>): boolean => {
    const users = authUtils.getAllUsers();
    const user = users.get(email);
    
    if (!user) return false;

    const updatedUser = { ...user, ...updates };
    users.set(email, updatedUser);
    authUtils.saveUsers(users);
    
    // Update current user cache
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    
    return true;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(AUTH_COOKIE_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    // Check for mock session first
    const mockSession = localStorage.getItem('mock_session');
    if (mockSession === 'true') return true;
    
    // Fall back to regular session
    const session = authUtils.getSession();
    return session !== null;
  }
};
