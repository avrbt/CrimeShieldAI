import React from 'react';
import { Shield, MapPin, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { authUtils } from '../utils/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';

// Remove unused locationMetrics interface since we removed the metrics cards
export function CitizenDashboard() {
  const currentUser = authUtils.getCurrentUser();

  return (
    <section className="bg-[#0F1419] text-white py-12 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-5">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1513563326940-e76e4641069e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc2t5bGluZSUyMG5pZ2h0fGVufDF8fHx8MTc2MTU1Mzk2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="City skyline"
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
            <span className="text-emerald-400 font-medium">Community Safety Portal</span>
          </div>
          {currentUser && (
            <p className="text-gray-400 mb-2">
              Welcome, <span className="text-white font-medium">{currentUser.name}</span>
            </p>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
            Stay Safe, Stay Informed
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            View crime alerts and safety information in your area
          </p>
        </div>

        {/* Information Box */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-6 shadow-lg shadow-emerald-500/5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">Your Safety Tools</h3>
              <p className="text-gray-400 text-sm mb-4">
                As a citizen, you have access to real-time threat alerts and crime hotspot maps to help you stay safe. 
                Select your location on the map below to view personalized safety metrics for your area.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white text-sm font-medium">Real-Time Alerts</p>
                    <p className="text-gray-500 text-xs">Get notified about incidents near you</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white text-sm font-medium">Safety Maps</p>
                    <p className="text-gray-500 text-xs">View crime hotspots and safe zones</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white text-sm font-medium">Crime Trends</p>
                    <p className="text-gray-500 text-xs">Understand safety patterns</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white text-sm font-medium">24/7 Monitoring</p>
                    <p className="text-gray-500 text-xs">Always up-to-date information</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}