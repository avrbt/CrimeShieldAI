import React, { useState, useEffect } from 'react';
import { Shield, User, Building2, Phone, MapPin, FileText, CheckCircle, Upload } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { authAPI } from '../utils/supabase/client';
import { AshokaChakra } from './AshokaChakra';

interface ProfileBuilderProps {
  onComplete: () => void;
}

export function ProfileBuilder({ onComplete }: ProfileBuilderProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idProof, setIdProof] = useState('');
  
  // Admin-specific fields
  const [organizationName, setOrganizationName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [department, setDepartment] = useState('');

  // Load current user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        const profile = response?.profile || response?.user;
        
        if (profile) {
          setCurrentUser(profile);
          
          // Pre-fill existing data
          if (profile.name) setName(profile.name);
          if (profile.phone) setPhone(profile.phone);
          if (profile.aadhaar) setIdProof(profile.aadhaar);
          if (profile.organization) setOrganizationName(profile.organization);
          
          // If user is already verified, skip profile building
          if (profile.verified) {
            onComplete();
          }
        }
      } catch (error) {
        console.error('Profile load error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!currentUser || loading) return null;

  const isAdmin = currentUser.role === 'organization';
  const themeColor = isAdmin ? '#FF6EC7' : '#3BE39C';
  const textColor = isAdmin ? 'text-[#FF6EC7]' : 'text-[#3BE39C]';
  const bgColor = isAdmin ? 'bg-[#FF6EC7]' : 'bg-[#3BE39C]';

  const handleNext = () => {
    if (step === 1) {
      if (!name || !phone || !address) {
        alert('Please fill in all required fields');
        return;
      }
    } else if (step === 2 && isAdmin) {
      if (!organizationName || !organizationId || !department) {
        alert('Please fill in all organization details');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      const updates: any = {
        name,
        phone,
        address,
        aadhaar: idProof,
        verified: true
      };

      if (isAdmin) {
        updates.organization = organizationName;
        updates.organizationId = organizationId;
        updates.department = department;
      }

      await authAPI.updateProfile(updates);

      setTimeout(() => {
        setLoading(false);
        onComplete();
      }, 1500);
    } catch (error: any) {
      setLoading(false);
      alert(error.message || 'Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1D3A] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-4 ${bgColor}/20 rounded-2xl`}>
              {isAdmin ? (
                <AshokaChakra className="w-12 h-12" />
              ) : (
                <User className={`w-12 h-12 ${textColor}`} />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">
            {isAdmin 
              ? 'Verify your identity and organization details' 
              : 'Help us verify your identity for security purposes'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? textColor : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? bgColor : 'bg-gray-700'} ${step >= 1 && !isAdmin ? 'text-[#0B1D3A]' : 'text-white'}`}>
                1
              </div>
              <span className="text-sm">Personal Info</span>
            </div>
            <div className="w-12 h-px bg-gray-700"></div>
            {isAdmin && (
              <>
                <div className={`flex items-center gap-2 ${step >= 2 ? textColor : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? bgColor : 'bg-gray-700'} text-white`}>
                    2
                  </div>
                  <span className="text-sm">Organization</span>
                </div>
                <div className="w-12 h-px bg-gray-700"></div>
              </>
            )}
            <div className={`flex items-center gap-2 ${step >= (isAdmin ? 3 : 2) ? textColor : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= (isAdmin ? 3 : 2) ? bgColor : 'bg-gray-700'} ${step >= (isAdmin ? 3 : 2) && !isAdmin ? 'text-[#0B1D3A]' : 'text-white'}`}>
                {isAdmin ? '3' : '2'}
              </div>
              <span className="text-sm">Verification</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Personal Information</h2>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Textarea
                    placeholder="Enter your complete address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-10 min-h-[100px]"
                    required
                  />
                </div>
              </div>

              <Button
                onClick={handleNext}
                className={`w-full ${bgColor} hover:opacity-80 ${isAdmin ? 'text-white' : 'text-[#0B1D3A]'}`}
              >
                Next Step →
              </Button>
            </div>
          )}

          {/* Step 2: Organization Details (Admin only) */}
          {step === 2 && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Organization Details</h2>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="e.g., Mumbai Police Department"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Organization ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Official Organization ID"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Cyber Crime, Intelligence"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleNext}
                  className={`flex-1 ${bgColor} hover:opacity-80 text-white`}
                >
                  Next Step →
                </Button>
              </div>
            </div>
          )}

          {/* Final Step: Verification */}
          {((step === 2 && !isAdmin) || (step === 3 && isAdmin)) && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Identity Verification</h2>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {isAdmin ? 'Official ID Number' : 'Government ID (Aadhaar/PAN/Driving License)'}
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={isAdmin ? "Enter official ID number" : "Enter ID number"}
                    value={idProof}
                    onChange={(e) => setIdProof(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-10"
                  />
                </div>
              </div>

              <div className={`${bgColor}/10 border ${isAdmin ? 'border-[#FF6EC7]/20' : 'border-[#3BE39C]/20'} rounded-lg p-4`}>
                <div className="flex items-start gap-3">
                  <Shield className={`w-5 h-5 ${textColor} flex-shrink-0 mt-1`} />
                  <div>
                    <p className={`${textColor} font-medium mb-2`}>Verification Notice</p>
                    <p className="text-gray-400 text-sm">
                      {isAdmin 
                        ? 'Your organization details will be verified by our admin team within 24-48 hours. You will receive a confirmation email once approved.'
                        : 'Your identity information is encrypted and securely stored. This helps us maintain a safe community and prevent misuse of the platform.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <p className="text-white font-medium mb-3">Profile Summary</p>
                <div className="text-sm space-y-1">
                  <p className="text-gray-400">Name: <span className="text-white">{name}</span></p>
                  <p className="text-gray-400">Phone: <span className="text-white">{phone}</span></p>
                  <p className="text-gray-400">Email: <span className="text-white">{currentUser.email}</span></p>
                  {isAdmin && (
                    <>
                      <p className="text-gray-400">Organization: <span className="text-white">{organizationName}</span></p>
                      <p className="text-gray-400">Department: <span className="text-white">{department}</span></p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className={`flex-1 ${bgColor} hover:opacity-80 ${isAdmin ? 'text-white' : 'text-[#0B1D3A]'} flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    'Completing...'
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Complete Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
