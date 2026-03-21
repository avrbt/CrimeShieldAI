import React from 'react';
import { Shield, Camera, AlertTriangle, Clock, Users, MapPin } from 'lucide-react';
import { authUtils } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function HeroSection() {
  const currentUser = authUtils.getCurrentUser();
  const stats = [
    { icon: Camera, label: 'Active Cameras', value: '247', status: 'online', color: 'text-emerald-400' },
    { icon: AlertTriangle, label: 'Active Alerts', value: '12', status: 'pending', color: 'text-orange-400' },
    { icon: Users, label: 'People Detected', value: '1,429', status: 'today', color: 'text-cyan-400' },
    { icon: MapPin, label: 'Threat Zones', value: '8', status: 'monitored', color: 'text-amber-400' },
  ];

  return (
    <section className="bg-[#0F1419] text-white py-12 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-5">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1760199789455-49098afd02f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWJlcnNlY3VyaXR5JTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjE1ODAzNDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Cybersecurity technology"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F1419] via-[#1A1F2E]/90 to-[#0F1419]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Welcome Banner */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-6 py-2 mb-6 shadow-lg shadow-emerald-500/10">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">AI-Powered Security System</span>
          </div>
          {currentUser && (
            <p className="text-gray-400 mb-2">
              Welcome back, <span className="text-white font-medium">{currentUser.name}</span>
              {currentUser.userType === 'admin' && currentUser.organizationName && (
                <span className="text-gray-500"> • {currentUser.organizationName}</span>
              )}
            </p>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
            Crime Detection & Prevention
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Advanced AI surveillance monitoring 247 cameras across the city with real-time threat detection and predictive analytics
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-500 cursor-pointer"
              style={{
                transform: 'translateZ(0)',
                transformStyle: 'preserve-3d',
                boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.1), 0 0 0 1px rgba(31, 41, 55, 0.5) inset'
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'translateY(-8px) translateZ(20px) rotateX(2deg)';
                el.style.boxShadow = '0 20px 60px -15px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.2) inset, 0 1px 0 0 rgba(255, 255, 255, 0.05) inset';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'translateZ(0)';
                el.style.boxShadow = '0 10px 40px -10px rgba(16, 185, 129, 0.1), 0 0 0 1px rgba(31, 41, 55, 0.5) inset';
              }}
            >
              {/* 3D Shine Effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ transform: 'translateZ(1px)' }}></div>
              
              <div className="flex items-center justify-between mb-5 relative" style={{ transform: 'translateZ(10px)' }}>
                <div 
                  className={`p-3 rounded-lg bg-gray-800/70 backdrop-blur-sm ${stat.color} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
                  style={{
                    boxShadow: `0 4px 14px -2px ${stat.color === 'text-emerald-400' ? 'rgba(52, 211, 153, 0.3)' : stat.color === 'text-orange-400' ? 'rgba(251, 146, 60, 0.3)' : stat.color === 'text-cyan-400' ? 'rgba(34, 211, 238, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                  }}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg transition-all duration-500 group-hover:scale-105 ${
                  stat.status === 'online' ? 'bg-emerald-400/30 text-emerald-300 border border-emerald-400/30' :
                  stat.status === 'pending' ? 'bg-orange-400/30 text-orange-300 border border-orange-400/30' :
                  'bg-gray-500/30 text-gray-300 border border-gray-500/30'
                }`}>
                  {stat.status}
                </div>
              </div>
              
              {/* Value - Enhanced Typography */}
              <div 
                className="text-5xl font-black mb-3 relative bg-gradient-to-br from-white via-gray-100 to-gray-300 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:via-emerald-200 group-hover:to-cyan-300 transition-all duration-500" 
                style={{ 
                  transform: 'translateZ(15px)', 
                  textShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                  letterSpacing: '-0.02em',
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", "Roboto", sans-serif'
                }}
              >
                {stat.value}
              </div>
              
              {/* Label - Enhanced Typography */}
              <div 
                className="uppercase tracking-wider font-semibold text-xs relative text-gray-400 group-hover:text-emerald-400 transition-colors duration-500" 
                style={{ 
                  transform: 'translateZ(8px)',
                  letterSpacing: '0.1em',
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", "Roboto", sans-serif'
                }}
              >
                {stat.label}
              </div>
              
              {/* 3D Border Glow */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 50%, rgba(16, 185, 129, 0.1) 100%)',
                transform: 'translateZ(-1px)'
              }}></div>
            </div>
          ))}
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-center mt-8 space-x-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Last updated: {new Date().toLocaleTimeString()} PST</span>
        </div>
      </div>
    </section>
  );
}
