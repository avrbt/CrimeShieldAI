import React, { useState } from 'react';
import { Shield, Activity, User, LogOut, ChevronDown, Volume2, BarChart3 } from 'lucide-react';
import { authUtils } from '../utils/auth';
import { alarmSystem } from '../utils/alarmSystem';
import { BehaviorAnalysisModal } from './BehaviorAnalysisModal';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
}

export function Header({ activeTab, onTabChange, onLogout }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBehaviorAnalysis, setShowBehaviorAnalysis] = useState(false);
  const currentUser = authUtils.getCurrentUser();
  
  // Different navigation items based on user type
  const getNavItems = () => {
    if (currentUser?.userType === 'citizen') {
      return [
        { id: 'dashboard', label: 'Home' },
        { id: 'alerts', label: 'Alerts' },
        { id: 'hotspot', label: 'Safety Map' },
      ];
    }
    
    // Admin/Organization gets full access
    return [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'cctv', label: 'Live CCTV' },
      { id: 'hotspot', label: 'Hotspot Map' },
      { id: 'alerts', label: 'Alerts' },
      { id: 'evidence', label: 'Evidence' },
    ];
  };

  const navItems = getNavItems();

  return (
    <header className="bg-[#1A1F2E] border-b border-gray-700 sticky top-0 z-40 backdrop-blur-lg bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Project Name */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">CrimeShield AI</h1>
              <div className="flex items-center space-x-1 text-emerald-400 text-sm">
                <Activity className="w-3 h-3" />
                <span>Live Monitoring</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Behavior Analysis Button - Admin/Organization Only */}
            {currentUser?.userType === 'admin' && (
              <button
                onClick={() => setShowBehaviorAnalysis(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-400/90 to-pink-400/90 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
                title="Behavior Analysis"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Behavior Analysis</span>
              </button>
            )}

            {/* Test Alarm Button - Admin Only */}
            {currentUser?.userType === 'admin' && (
              <button
                onClick={() => alarmSystem.testAlarm()}
                className="hidden md:flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-500/30"
                title="Test Weapon Detection Alarm"
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-xs">Test Alarm</span>
              </button>
            )}

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* User Menu */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentUser.userType === 'admin' 
                      ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                      : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                  } shadow-lg`}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm text-white">{currentUser.name || 'User'}</p>
                    <p className="text-xs text-gray-400 capitalize">{currentUser.userType}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-[#1A1F2E] border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="p-4 border-b border-gray-700">
                        <p className="text-white font-medium">{currentUser.name}</p>
                        <p className="text-sm text-gray-400">{currentUser.email}</p>
                        <p className={`text-xs mt-1 capitalize ${
                          currentUser.userType === 'admin' ? 'text-orange-400' : 'text-emerald-400'
                        }`}>
                          {currentUser.userType} Account
                        </p>
                      </div>
                      <div className="p-2">
                        {currentUser.userType === 'admin' && currentUser.organizationName && (
                          <div className="px-3 py-2 text-sm text-gray-400">
                            <p className="text-xs text-gray-500">Organization</p>
                            <p className="text-white">{currentUser.organizationName}</p>
                          </div>
                        )}
                        {onLogout && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onLogout();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Behavior Analysis Modal */}
      <BehaviorAnalysisModal
        isOpen={showBehaviorAnalysis}
        onClose={() => setShowBehaviorAnalysis(false)}
      />
    </header>
  );
}