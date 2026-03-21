import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Loader2, AlertCircle, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { digiLockerService, DigiLockerUser } from '../utils/digilocker';

interface DigiLockerAuthProps {
  onSuccess: (userData: DigiLockerUser) => void;
  onCancel: () => void;
  userType: 'admin' | 'citizen';
}

export function DigiLockerAuth({ onSuccess, onCancel, userType }: DigiLockerAuthProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<DigiLockerUser | null>(null);

  const themeColor = userType === 'admin' ? '#FF6EC7' : '#3BE39C';
  const bgColor = userType === 'admin' ? 'bg-[#FF6EC7]' : 'bg-[#3BE39C]';
  const textColor = userType === 'admin' ? 'text-[#FF6EC7]' : 'text-[#3BE39C]';

  const handleDigiLockerLogin = async () => {
    setStatus('loading');
    setError('');

    try {
      console.log('🚀 Starting DigiLocker authentication...');
      
      // Initiate DigiLocker OAuth flow
      const result = await digiLockerService.initiateLogin();
      
      if (!result || !result.code || !result.state) {
        throw new Error('Failed to initiate DigiLocker authentication');
      }
      
      console.log('✅ DigiLocker authentication initiated');
      
      // Handle callback (in production, this happens on redirect)
      const user = await digiLockerService.handleCallback(result.code, result.state);
      
      if (user) {
        console.log('✅ User data received:', user.name);
        setUserData(user);
        setStatus('success');
        
        // Auto-proceed after showing success
        setTimeout(() => {
          console.log('✅ Proceeding with authentication...');
          onSuccess(user);
        }, 2000);
      } else {
        throw new Error('Failed to retrieve user data from DigiLocker');
      }
    } catch (err) {
      console.error('❌ DigiLocker authentication error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0B1D3A] border border-white/10 rounded-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${bgColor}/20 rounded-2xl mb-4`}>
            <Shield className={`w-8 h-8 ${textColor}`} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            DigiLocker Authentication
          </h2>
          <p className="text-gray-400 text-sm">
            Secure identity verification powered by Government of India
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-400">Demo Mode - Simulated Auth</span>
          </div>
        </div>

        {/* Status Display */}
        {status === 'idle' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <FileText className={`w-5 h-5 ${textColor} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className="text-white font-medium mb-1">What you'll share:</p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Full Name</li>
                    <li>• Date of Birth</li>
                    <li>• Address</li>
                    <li>• Aadhaar (last 4 digits only)</li>
                    <li>• Profile Photo</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={`${bgColor}/10 border ${userType === 'admin' ? 'border-[#FF6EC7]/20' : 'border-[#3BE39C]/20'} rounded-lg p-4`}>
              <div className="flex items-start gap-3">
                <Shield className={`w-5 h-5 ${textColor} flex-shrink-0 mt-0.5`} />
                <p className="text-sm text-gray-400">
                  Your data is fetched directly from DigiLocker and verified by the government. 
                  We only store necessary information for your profile.
                </p>
              </div>
            </div>

            <Button
              onClick={handleDigiLockerLogin}
              className={`w-full ${bgColor} hover:opacity-80 ${userType === 'admin' ? 'text-white' : 'text-[#0B1D3A]'} flex items-center justify-center gap-2`}
            >
              <Shield className="w-4 h-4" />
              Continue with DigiLocker
            </Button>

            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>

            <p className="text-center text-xs text-gray-500">
              By continuing, you agree to share your DigiLocker information
            </p>
          </div>
        )}

        {status === 'loading' && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <Loader2 className={`w-12 h-12 ${textColor} animate-spin`} />
            </div>
            <div>
              <p className="text-white font-medium mb-2">Connecting to DigiLocker...</p>
              <p className="text-gray-400 text-sm">
                Please complete the authentication on DigiLocker portal
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className={`w-2 h-2 ${bgColor} rounded-full animate-pulse`}></div>
                <span>Redirecting to DigiLocker</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className={`w-2 h-2 ${bgColor} rounded-full animate-pulse`} style={{ animationDelay: '0.3s' }}></div>
                <span>Fetching your verified documents</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className={`w-2 h-2 ${bgColor} rounded-full animate-pulse`} style={{ animationDelay: '0.6s' }}></div>
                <span>Verifying identity</span>
              </div>
            </div>
          </div>
        )}

        {status === 'success' && userData && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className={`w-16 h-16 ${bgColor}/20 rounded-full flex items-center justify-center`}>
                <CheckCircle className={`w-8 h-8 ${textColor}`} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-medium mb-2">Verification Successful!</p>
              <p className="text-gray-400 text-sm">
                Your identity has been verified through DigiLocker
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <p className="text-white font-medium mb-3">Verified Information:</p>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{userData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date of Birth:</span>
                  <span className="text-white">{userData.dob}</span>
                </div>
                {userData.aadhaarNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Aadhaar:</span>
                    <span className="text-white">{userData.aadhaarNumber}</span>
                  </div>
                )}
                {userData.mobile && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mobile:</span>
                    <span className="text-white">{userData.mobile}</span>
                  </div>
                )}
              </div>
            </div>
            <p className={`text-center text-sm ${textColor}`}>
              Proceeding to profile creation...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-medium mb-2">Authentication Failed</p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleDigiLockerLogin}
                className={`w-full ${bgColor} hover:opacity-80 ${userType === 'admin' ? 'text-white' : 'text-[#0B1D3A]'}`}
              >
                Try Again
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                className="w-full bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
