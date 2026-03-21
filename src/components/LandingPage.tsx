import React from 'react';
import { Shield, Building2, User, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingPageProps {
  onSelectUserType: (userType: 'admin' | 'citizen') => void;
}

export function LandingPage({ onSelectUserType }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0F1419] relative overflow-hidden" style={{ perspective: '1000px' }}>
      {/* 3D Background Layers */}
      <div className="absolute inset-0">
        {/* Base Image Layer */}
        <div className="absolute inset-0 transform-gpu" style={{ transform: 'translateZ(-100px) scale(1.1)' }}>
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1759933633339-2382db138c2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodCUyMGNpdHklMjBzZWN1cml0eSUyMHN1cnZlaWxsYW5jZXxlbnwxfHx8fDE3NjE2MjY3MDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Night city surveillance"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        
        {/* Gradient Overlay with Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F1419]/98 via-[#1A1F2E]/95 to-[#0F1419]"></div>
        
        {/* Animated 3D Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: 'perspective(500px) rotateX(60deg) scale(2)',
          transformOrigin: 'center bottom'
        }}></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
              }}
            />
          ))}
        </div>
        
        {/* Animated Gradient Waves */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-orange-500/5 animate-pulse"></div>
      </div>

      {/* Floating Animation Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.2), 0 0 40px rgba(16, 185, 129, 0.1); }
          50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.2); }
        }
        
        @keyframes card-float {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          50% { transform: translateY(-10px) rotateX(2deg); }
        }
      `}</style>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo and Title with 3D Effect */}
        <div className="text-center mb-12 transform-gpu" style={{ 
          animation: 'card-float 6s ease-in-out infinite',
          transformStyle: 'preserve-3d'
        }}>
          <div className="flex items-center justify-center mb-6">
            {/* 3D Shield Icon with Layers */}
            <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
              {/* Shadow Layer */}
              <div className="absolute inset-0 p-6 bg-emerald-500/10 rounded-3xl blur-2xl" style={{ transform: 'translateZ(-20px)' }}></div>
              
              {/* Main Icon Container */}
              <div 
                className="relative p-6 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl backdrop-blur-sm border border-emerald-400/30 shadow-2xl"
                style={{
                  transform: 'translateZ(20px)',
                  boxShadow: `
                    0 20px 40px rgba(16, 185, 129, 0.3),
                    0 10px 20px rgba(6, 182, 212, 0.2),
                    inset 0 1px 2px rgba(255, 255, 255, 0.1)
                  `,
                  animation: 'glow-pulse 3s ease-in-out infinite'
                }}
              >
                <Shield className="w-20 h-20 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                
                {/* Floating Sparkles */}
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-cyan-400 animate-pulse" />
                <Zap className="absolute -bottom-1 -left-1 w-5 h-5 text-emerald-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>
          
          {/* Title with 3D Text Effect */}
          <h1 
            className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(16, 185, 129, 0.3))',
              textShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
            }}
          >
            CrimeShield AI
          </h1>
          
          <p className="text-xl text-gray-300 mb-2 drop-shadow-lg">
            Advanced Crime Prevention & Monitoring System
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Leveraging cutting-edge AI technology to protect communities, monitor threats in real-time, 
            and provide actionable intelligence for law enforcement and citizens.
          </p>
        </div>

        {/* User Type Selection Cards with 3D */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Admin/Organization Card - 3D Enhanced */}
          <button
            onClick={() => onSelectUserType('admin')}
            className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-8 transition-all duration-500 group cursor-pointer text-center w-full transform-gpu hover:scale-105"
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: `
                0 20px 60px rgba(0, 0, 0, 0.4),
                0 10px 30px rgba(249, 115, 22, 0.1),
                inset 0 1px 2px rgba(255, 255, 255, 0.05)
              `
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left - rect.width / 2;
              const y = e.clientY - rect.top - rect.height / 2;
              e.currentTarget.style.transform = `perspective(1000px) rotateY(${x / 20}deg) rotateX(${-y / 20}deg) scale(1.05) translateZ(20px)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1) translateZ(0px)';
            }}
          >
            {/* 3D Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-red-500/0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" style={{ transform: 'translateZ(-10px)' }}></div>
            
            <div className="flex flex-col items-center relative" style={{ transform: 'translateZ(10px)' }}>
              {/* 3D Icon Container */}
              <div 
                className="p-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl mb-6 group-hover:scale-110 transition-all duration-300 relative"
                style={{
                  transform: 'translateZ(30px)',
                  boxShadow: `
                    0 15px 35px rgba(249, 115, 22, 0.3),
                    0 5px 15px rgba(239, 68, 68, 0.2),
                    inset 0 1px 2px rgba(255, 255, 255, 0.1)
                  `
                }}
              >
                <Building2 className="w-16 h-16 text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                
                {/* Orbiting Dots */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
                  <div className="absolute top-0 left-1/2 w-2 h-2 bg-orange-400 rounded-full -translate-x-1/2 shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">
                Organization
              </h2>
              <p className="text-gray-400 mb-6">
                For government agencies, law enforcement, and authorized organizations 
                to access comprehensive crime data and management tools.
              </p>
              <ul className="text-left space-y-2 mb-8 text-gray-300 mx-auto max-w-sm">
                <li className="flex items-start gap-2 transform hover:translate-x-2 transition-transform">
                  <Shield className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Full dashboard access with analytics</span>
                </li>
                <li className="flex items-start gap-2 transform hover:translate-x-2 transition-transform">
                  <Shield className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Real-time CCTV monitoring</span>
                </li>
                <li className="flex items-start gap-2 transform hover:translate-x-2 transition-transform">
                  <Shield className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Crime hotspot mapping</span>
                </li>
                <li className="flex items-start gap-2 transform hover:translate-x-2 transition-transform">
                  <Shield className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Evidence management system</span>
                </li>
              </ul>
              <div 
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 group-hover:from-orange-600 group-hover:to-red-600 text-white rounded-md px-4 py-2 flex items-center justify-center gap-2 transition-all duration-300"
                style={{
                  boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3), 0 5px 10px rgba(239, 68, 68, 0.2)',
                  transform: 'translateZ(20px)'
                }}
              >
                <span>Continue as Organization</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Citizen/Individual Card - 3D Enhanced */}
          <button
            onClick={() => onSelectUserType('citizen')}
            className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg border border-emerald-500/20 rounded-2xl p-8 transition-all duration-500 group cursor-pointer text-center w-full transform-gpu hover:scale-105"
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: `
                0 20px 60px rgba(0, 0, 0, 0.4),
                0 10px 30px rgba(16, 185, 129, 0.1),
                inset 0 1px 2px rgba(255, 255, 255, 0.05)
              `
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left - rect.width / 2;
              const y = e.clientY - rect.top - rect.height / 2;
              e.currentTarget.style.transform = `perspective(1000px) rotateY(${x / 20}deg) rotateX(${-y / 20}deg) scale(1.05) translateZ(20px)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1) translateZ(0px)';
            }}
          >
            {/* 3D Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-cyan-500/0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" style={{ transform: 'translateZ(-10px)' }}></div>
            
            <div className="flex flex-col items-center relative" style={{ transform: 'translateZ(10px)' }}>
              {/* 3D Icon Container */}
              <div 
                className="p-6 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl mb-6 group-hover:scale-110 transition-all duration-300 relative"
                style={{
                  transform: 'translateZ(30px)',
                  boxShadow: `
                    0 15px 35px rgba(16, 185, 129, 0.3),
                    0 5px 15px rgba(6, 182, 212, 0.2),
                    inset 0 1px 2px rgba(255, 255, 255, 0.1)
                  `
                }}
              >
                <User className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                
                {/* Orbiting Dots */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '6s' }}>
                  <div className="absolute top-0 left-1/2 w-2 h-2 bg-emerald-400 rounded-full -translate-x-1/2 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">
                Citizen
              </h2>
              <p className="text-gray-400 mb-6">
                For individual citizens to report incidents, view safety information, 
                and stay informed about crime trends in their area.
              </p>
              <ul className="text-left space-y-2 mb-8 text-gray-300 mx-auto max-w-sm">
                <li className="flex items-start gap-2 transform hover:translate-x-2 transition-transform">
                  <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>View crime statistics and alerts</span>
                </li>
                <li className="flex items-start gap-2 transform hover:translate-x-2 transition-transform">
                  <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Report suspicious activities</span>
                </li>
                <li className="flex items-start gap-2 transform hover:translate-x-2 transition-transform">
                  <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Safety zone notifications</span>
                </li>
                <li className="flex items-start gap-2 transform hover:translate-x-2 transition-transform">
                  <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Community safety updates</span>
                </li>
              </ul>
              <div 
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 group-hover:from-emerald-600 group-hover:to-cyan-600 text-white rounded-md px-4 py-2 flex items-center justify-center gap-2 transition-all duration-300"
                style={{
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3), 0 5px 10px rgba(6, 182, 212, 0.2)',
                  transform: 'translateZ(20px)'
                }}
              >
                <span>Continue as Citizen</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Footer Info with 3D Effect */}
        <div className="mt-12 text-center transform-gpu" style={{ transform: 'translateZ(10px)' }}>
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            Secured with end-to-end encryption • Your data is protected
          </p>
        </div>
      </div>
    </div>
  );
}
