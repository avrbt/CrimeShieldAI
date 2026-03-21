import React, { useState } from 'react';
import { Shield, User, Building2, Eye, EyeOff, AlertCircle, Phone, MapPin } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { AshokaChakra } from './AshokaChakra';
import { authAPI } from '../utils/supabase/client';
import { DigiLockerAuth } from './DigiLockerAuth';
import { DigiLockerUser } from '../utils/digilocker';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AuthPageProps {
  userType: 'admin' | 'citizen';
  onAuthSuccess: () => void;
  onBack: () => void;
}

export function AuthPage({ userType, onAuthSuccess, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDigiLocker, setShowDigiLocker] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Organization fields (for admin)
  const [organization, setOrganization] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [department, setDepartment] = useState('');

  const isAdmin = userType === 'admin';
  const themeColor = isAdmin ? '#F97316' : '#10B981';
  const textColor = isAdmin ? 'text-orange-400' : 'text-emerald-400';
  const bgColor = isAdmin ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500';
  const hoverBgColor = isAdmin ? 'hover:from-orange-600 hover:to-red-600' : 'hover:from-emerald-600 hover:to-cyan-600';
  const borderColor = isAdmin ? 'border-orange-500/20' : 'border-emerald-500/20';

  const handleDigiLockerSuccess = async (userData: DigiLockerUser) => {
    setShowDigiLocker(false);
    setLoading(true);
    setError('');
    
    try {
      console.log('📝 Processing DigiLocker user data:', userData.name);
      
      // Create account with DigiLocker data
      const email = userData.email || `${userData.mobile?.replace(/\s+/g, '')}@digilocker.temp`;
      const tempPassword = `DL_${Date.now()}_${Math.random().toString(36).substring(7)}`; // Secure auto-generated password
      
      // Build address string from DigiLocker address object
      const addressString = userData.address 
        ? `${userData.address.house}, ${userData.address.street}, ${userData.address.locality}, ${userData.address.district}, ${userData.address.state} - ${userData.address.pincode}`
        : '';
      
      console.log('🔐 Creating account with DigiLocker credentials...');
      
      await authAPI.signUp({
        email,
        password: tempPassword,
        name: userData.name,
        role: userType === 'admin' ? 'organization' : 'citizen',
        aadhaar: userData.aadhaarNumber || '',
        phone: userData.mobile || '',
        address: userType === 'citizen' ? addressString : undefined,
        organization: userType === 'admin' ? 'DigiLocker Verified Organization' : undefined,
        department: userType === 'admin' ? 'Security' : undefined,
        organizationId: userType === 'admin' ? `DL-${Date.now()}` : undefined,
      } as any);
      
      console.log('✅ Account created successfully');
      console.log('🔑 Auto-login with DigiLocker credentials...');
      
      // Auto-login after signup
      await authAPI.signIn(email, tempPassword);
      
      console.log('✅ DigiLocker authentication complete!');
      
      onAuthSuccess();
    } catch (err: any) {
      console.error('❌ DigiLocker signup error:', err);
      setError(err.message || 'Failed to create account with DigiLocker. Please try manual signup.');
      setLoading(false);
      setShowDigiLocker(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Validation
        if (!email || !password || !confirmPassword) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        
        if (!name || !phone) {
          setError('Please fill in your name and phone number');
          setLoading(false);
          return;
        }
        
        // Additional validation for citizen
        if (userType === 'citizen' && !address) {
          setError('Please fill in your address');
          setLoading(false);
          return;
        }
        
        // Additional validation for admin
        if (userType === 'admin' && (!organization || !organizationId || !department)) {
          setError('Please fill in all organization details');
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        // Sign up with complete profile
        console.log('Attempting signup with complete profile:', { 
          email, 
          name,
          phone,
          role: userType === 'admin' ? 'organization' : 'citizen' 
        });
        
        await authAPI.signUp({
          email,
          password,
          name,
          phone,
          role: userType === 'admin' ? 'organization' : 'citizen',
          aadhaar: '',
          address: userType === 'citizen' ? address : undefined,
          organization: userType === 'admin' ? organization : undefined,
          department: userType === 'admin' ? department : undefined,
          organizationId: userType === 'admin' ? organizationId : undefined,
        } as any);

        console.log('✅ Signup successful! Now logging in...');

        // Auto-login after signup
        await authAPI.signIn(email, password);
        console.log('✅ Login successful with complete profile');
        
        onAuthSuccess();
      } else {
        // Login
        if (!email || !password) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }

        // Sign in with Supabase
        await authAPI.signIn(email, password);
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      {showDigiLocker && (
        <DigiLockerAuth
          onSuccess={handleDigiLockerSuccess}
          onCancel={() => setShowDigiLocker(false)}
          userType={userType}
        />
      )}
      
      <div className="min-h-screen bg-[#0F1419] relative flex items-center justify-center px-4 py-8 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1639503547276-90230c4a4198?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwc2VjdXJpdHklMjBzaGllbGR8ZW58MXx8fHwxNzYxNTcxNjE4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Digital security"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F1419]/95 to-[#1A1F2E]/95"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          ← Back to selection
        </button>

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-4 ${isAdmin ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20' : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20'} rounded-2xl shadow-lg ${isAdmin ? 'shadow-orange-500/20' : 'shadow-emerald-500/20'}`}>
              {isAdmin ? (
                <AshokaChakra className="w-12 h-12" />
              ) : (
                <User className={`w-12 h-12 ${textColor}`} />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isAdmin ? 'Organization Portal' : 'Citizen Portal'}
          </h1>
          <p className="text-gray-400">
            {isAdmin ? 'Authorized Personnel Access' : 'Community Safety Access'}
          </p>
        </div>

        {/* Toggle Login/Signup */}
        <div className="flex bg-gray-800/50 rounded-lg p-1 mb-6 border border-gray-700">
          <button
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center ${
              mode === 'login'
                ? `${bgColor} text-white shadow-lg`
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setError('');
            }}
            className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center ${
              mode === 'signup'
                ? `${bgColor} text-white shadow-lg`
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pl-10 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {!isAdmin && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Textarea
                      placeholder="Enter your complete address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pl-10 min-h-[80px] focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              {isAdmin && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Organization Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="e.g., Mumbai Police Department"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pl-10 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Organization ID <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Official Organization ID"
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Department <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Cyber Crime, Intelligence"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {isAdmin ? 'Official Email' : 'Email Address'}
            </label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pr-10 focus:border-emerald-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
              <Input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500"
                required
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className={`${isAdmin ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-lg p-3`}>
              <p className="text-xs text-gray-400 flex items-start gap-2">
                <Shield className={`w-4 h-4 ${textColor} flex-shrink-0 mt-0.5`} />
                <span>
                  {isAdmin 
                    ? 'Your profile will be saved and you\'ll get instant access to the dashboard after signup.'
                    : 'Your information is encrypted and securely stored. Complete profile ensures better safety alerts.'
                  }
                </span>
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className={`w-full ${bgColor} ${hoverBgColor} text-white shadow-lg ${isAdmin ? 'shadow-orange-500/20' : 'shadow-emerald-500/20'}`}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0F1419] px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* DigiLocker Authentication */}
        <Button
          onClick={() => setShowDigiLocker(true)}
          className="w-full bg-gradient-to-r from-orange-500 via-white to-green-500 hover:opacity-90 text-gray-900 flex items-center justify-center gap-2 shadow-lg"
        >
          <Shield className="w-4 h-4" />
          <span>DigiLocker</span>
          <span className="text-xs opacity-80">(Instant Verification)</span>
        </Button>
        
        <p className="text-center text-xs text-gray-500 mt-2">
          Secure authentication powered by Government of India
        </p>

        {mode === 'login' && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Forgot password?{' '}
            <a href="#" className={`${textColor} hover:underline`}>
              Reset
            </a>
          </p>
        )}

        {mode === 'signup' && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Already have an account?{' '}
            <button
              onClick={() => setMode('login')}
              className={`${textColor} hover:underline`}
            >
              Login here
            </button>
          </p>
        )}
        </div>
      </div>
    </>
  );
}
