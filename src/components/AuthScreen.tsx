import React, { useState } from 'react';
import { Shield, User, Building2, Eye, EyeOff, AlertCircle, Phone, MapPin } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { AshokaChakra } from './AshokaChakra';
import { authAPI } from '../utils/supabase/client';

interface AuthScreenProps {
  onLogin: (userType: 'public' | 'government') => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [publicMode, setPublicMode] = useState<'login' | 'signup'>('login');
  const [govMode, setGovMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showGovPassword, setShowGovPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error states
  const [publicError, setPublicError] = useState('');
  const [govError, setGovError] = useState('');

  // Public form state
  const [publicEmail, setPublicEmail] = useState('');
  const [publicPassword, setPublicPassword] = useState('');
  const [publicName, setPublicName] = useState('');
  const [publicPhone, setPublicPhone] = useState('');
  const [publicAddress, setPublicAddress] = useState('');

  // Government form state
  const [govEmail, setGovEmail] = useState('');
  const [govPassword, setGovPassword] = useState('');
  const [govName, setGovName] = useState('');
  const [govPhone, setGovPhone] = useState('');
  const [govDepartment, setGovDepartment] = useState('');
  const [govOrganization, setGovOrganization] = useState('');
  const [govOrgId, setGovOrgId] = useState('');

  const handlePublicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublicError('');
    setLoading(true);

    try {
      if (publicMode === 'login') {
        // Login
        await authAPI.signIn(publicEmail, publicPassword);
        onLogin('public');
      } else if (publicMode === 'signup') {
        // Validate all fields
        if (!publicName || !publicEmail || !publicPassword || !publicPhone || !publicAddress) {
          setPublicError('Please fill in all required fields.');
          setLoading(false);
          return;
        }
        
        // Sign up with complete profile - all data stored at registration
        await authAPI.signUp({
          email: publicEmail,
          password: publicPassword,
          name: publicName,
          phone: publicPhone,
          role: 'citizen',
          aadhaar: '', // Optional for citizens
          address: publicAddress,
        } as any);
        
        // Auto-login after signup
        await authAPI.signIn(publicEmail, publicPassword);
        onLogin('public');
      }
    } catch (error: any) {
      setPublicError(error.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGovSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGovError('');
    setLoading(true);

    try {
      if (govMode === 'login') {
        // Login
        await authAPI.signIn(govEmail, govPassword);
        onLogin('government');
      } else if (govMode === 'signup') {
        // Validate all fields
        if (!govName || !govEmail || !govPassword || !govPhone || !govDepartment || !govOrganization || !govOrgId) {
          setGovError('Please fill in all required fields.');
          setLoading(false);
          return;
        }
        
        // Sign up with complete profile - all data stored at registration
        await authAPI.signUp({
          email: govEmail,
          password: govPassword,
          name: govName,
          phone: govPhone,
          role: 'organization',
          organization: govOrganization,
          department: govDepartment,
          organizationId: govOrgId,
        } as any);
        
        // Auto-login after signup
        await authAPI.signIn(govEmail, govPassword);
        onLogin('government');
      }
    } catch (error: any) {
      setGovError(error.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1D3A] flex">
      {/* Public Access Side */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #3BE39C 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-[#3BE39C]/20 rounded-2xl">
                <User className="w-12 h-12 text-[#3BE39C]" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Public Access</h1>
            <p className="text-gray-400">CrimeShield AI Dashboard</p>
          </div>

          {/* Toggle Login/Signup */}
          <div className="flex bg-white/5 rounded-lg p-1 mb-6">
            <button
              onClick={() => setPublicMode('login')}
              className={`flex-1 py-2 rounded-md transition-all ${
                publicMode === 'login'
                  ? 'bg-[#3BE39C] text-[#0B1D3A]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setPublicMode('signup')}
              className={`flex-1 py-2 rounded-md transition-all ${
                publicMode === 'signup'
                  ? 'bg-[#3BE39C] text-[#0B1D3A]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {publicError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{publicError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handlePublicSubmit} className="space-y-4">
            {publicMode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Full Name <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={publicName}
                    onChange={(e) => setPublicName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Phone Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={publicPhone}
                      onChange={(e) => setPublicPhone(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Textarea
                      placeholder="Enter your complete address"
                      value={publicAddress}
                      onChange={(e) => setPublicAddress(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-10 min-h-[80px]"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Email Address</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={publicEmail}
                onChange={(e) => setPublicEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={publicPassword}
                  onChange={(e) => setPublicPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3BE39C] hover:bg-[#3BE39C]/80 text-[#0B1D3A]"
            >
              {loading ? 'Please wait...' : (publicMode === 'login' ? 'Login' : 'Create Account')}
            </Button>
          </form>

          {publicMode === 'login' && (
            <p className="text-center text-sm text-gray-400 mt-4">
              Forgot password? <a href="#" className="text-[#3BE39C] hover:underline">Reset</a>
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

      {/* Government Access Side */}
      <div className="flex-1 flex items-center justify-center p-8 relative bg-gradient-to-br from-[#0B1D3A] to-[#0d2444]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #FF6EC7 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-[#FF6EC7]/20 rounded-2xl relative">
                <AshokaChakra className="w-12 h-12" />
                <Shield className="w-6 h-6 text-[#FF6EC7] absolute -top-1 -right-1" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Government Access</h1>
            <p className="text-gray-400">Authorized Personnel Only</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <AshokaChakra className="w-6 h-6" />
              <span className="text-xs text-gray-500">Secure Government Portal</span>
            </div>
          </div>

          {/* Toggle Login/Signup */}
          <div className="flex bg-white/5 rounded-lg p-1 mb-6">
            <button
              onClick={() => setGovMode('login')}
              className={`flex-1 py-2 rounded-md transition-all ${
                govMode === 'login'
                  ? 'bg-[#FF6EC7] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setGovMode('signup')}
              className={`flex-1 py-2 rounded-md transition-all ${
                govMode === 'signup'
                  ? 'bg-[#FF6EC7] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          {govError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{govError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleGovSubmit} className="space-y-4">
            {govMode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Full Name <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={govName}
                    onChange={(e) => setGovName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Phone Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={govPhone}
                      onChange={(e) => setGovPhone(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Organization Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="e.g., Mumbai Police Department"
                      value={govOrganization}
                      onChange={(e) => setGovOrganization(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Organization ID <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    placeholder="Official Organization ID"
                    value={govOrgId}
                    onChange={(e) => setGovOrgId(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Department <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    placeholder="e.g., Cyber Crime, Intelligence"
                    value={govDepartment}
                    onChange={(e) => setGovDepartment(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Email Address</label>
              <Input
                type="email"
                placeholder="Enter your official email"
                value={govEmail}
                onChange={(e) => setGovEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Secure Password</label>
              <div className="relative">
                <Input
                  type={showGovPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={govPassword}
                  onChange={(e) => setGovPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowGovPassword(!showGovPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showGovPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-[#FF6EC7]/10 border border-[#FF6EC7]/20 rounded-lg p-3">
              <p className="text-xs text-gray-400 flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#FF6EC7] flex-shrink-0 mt-0.5" />
                <span>This portal is restricted to authorized government personnel only. Unauthorized access is prohibited and monitored.</span>
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6EC7] hover:bg-[#FF6EC7]/80 text-white"
            >
              {loading ? 'Please wait...' : (govMode === 'login' ? 'Secure Login' : 'Register Account')}
            </Button>
          </form>

          {govMode === 'login' && (
            <p className="text-center text-sm text-gray-400 mt-4">
              Need access? <a href="#" className="text-[#FF6EC7] hover:underline">Contact Admin</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
