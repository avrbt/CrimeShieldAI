import React, { useState } from 'react';
import { X, User, Scan, Shield, Activity, Brain, Eye, AlertTriangle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { alarmSystem } from '../utils/alarmSystem';
import { toast } from 'sonner@2.0.3';

interface DetectionTabProps {
  onClose: () => void;
  isOverlay?: boolean;
}

export function DetectionTab({ onClose, isOverlay = false }: DetectionTabProps) {
  const [activeDetection, setActiveDetection] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulate weapon detection
  const simulateWeaponDetection = () => {
    setIsSimulating(true);
    
    // Show initial detection toast
    toast.warning('Weapon Detection Initiated', {
      description: 'AI model analyzing video feed...',
      duration: 2000,
    });

    // Simulate processing time
    setTimeout(() => {
      // Trigger the alarm
      alarmSystem.triggerAlarm('weapon', { duration: 5000, pattern: 'continuous' });
      
      // Show detection complete toast
      toast.error('WEAPON DETECTED!', {
        description: 'High confidence detection at Camera CAM-001. Alert dispatched to security team.',
        duration: 5000,
      });

      // Broadcast event to trigger alert panel update
      window.dispatchEvent(new CustomEvent('weaponDetected', {
        detail: {
          type: 'Weapon Detection',
          location: 'Simulated CCTV Feed',
          cameraId: 'CAM-001',
          confidence: 0.95,
          severity: 'high',
          timestamp: 'Just now',
          status: 'pending',
          description: 'AI detected weapon in live video feed - immediate response required'
        }
      }));

      setIsSimulating(false);
    }, 2000);
  };

  const detectionFeatures = [
    {
      id: 'person',
      name: 'Person Detection',
      icon: User,
      description: 'Advanced human detection and tracking across multiple camera feeds',
      color: 'text-[#3BE39C] bg-[#3BE39C]/20',
      status: 'active',
      detectedCount: 1429,
      mockFeed: 'https://images.unsplash.com/photo-1665848383782-1ea74efde68f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWN1cml0eSUyMGNhbWVyYSUyMHN1cnZlaWxsYW5jZXxlbnwxfHx8fDE3NTk3NDExMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 'face',
      name: 'Face Detection',
      icon: Scan,
      description: 'Real-time facial recognition and identity verification',
      color: 'text-blue-400 bg-blue-400/20',
      status: 'active',
      detectedCount: 892,
      mockFeed: 'https://images.unsplash.com/photo-1604632839300-971a9adb06c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHhjaXR5JTIwbmlnaHQlMjBzdXJ2ZWlsbGFuY2V8ZW58MXx8fHwxNzU5ODEwOTY2fDA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 'weapon',
      name: 'Weapon Detection',
      icon: Shield,
      description: 'Automatic identification of weapons and dangerous objects',
      color: 'text-[#FF6EC7] bg-[#FF6EC7]/20',
      status: 'active',
      detectedCount: 23,
      mockFeed: 'https://images.unsplash.com/photo-1585216274151-e3debff99c0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWN1cml0eSUyMG1vbml0b3JpbmclMjByb29tfGVufDF8fHx8MTc1OTgxMDk2OXww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 'gait',
      name: 'Gait Detection',
      icon: Activity,
      description: 'Behavioral pattern analysis through walking gait recognition',
      color: 'text-orange-400 bg-orange-400/20',
      status: 'active',
      detectedCount: 567,
      mockFeed: 'https://images.unsplash.com/photo-1680275697928-93bb2fe183d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHN1cmJhbiUyMHN0cmVldCUyMGNhbWVyYXxlbnwxfHx8fDE3NTk4MTA5NzF8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 'skeleton',
      name: 'Skeleton Detection',
      icon: Brain,
      description: 'Advanced pose estimation and movement analysis',
      color: 'text-purple-400 bg-purple-400/20',
      status: 'active',
      detectedCount: 1203,
      mockFeed: 'https://images.unsplash.com/photo-1665848383782-1ea74efde68f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWN1cml0eSUyMGNhbWVyYSUyMHN1cnZlaWxsYW5jZXxlbnwxfHx8fDE3NTk3NDExMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 'behavior',
      name: 'Behavior Analysis',
      icon: Eye,
      description: 'AI-powered behavioral anomaly detection and threat assessment',
      color: 'text-yellow-400 bg-yellow-400/20',
      status: 'active',
      detectedCount: 156,
      mockFeed: 'https://images.unsplash.com/photo-1604632839300-971a9adb06c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHhjaXR5JTIwbmlnaHQlMjBzdXJ2ZWlsbGFuY2V8ZW58MXx8fHwxNzU5ODEwOTY2fDA&ixlib=rb-4.1.0&q=80&w=1080'
    }
  ];

  const containerClass = isOverlay
    ? "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    : "bg-gray-900 py-12";

  const contentClass = isOverlay
    ? "bg-[#0B1D3A] rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FF6EC7]/20 rounded-lg">
              <Brain className="w-6 h-6 text-[#FF6EC7]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Detection Systems</h2>
              <p className="text-gray-400">Advanced machine learning detection capabilities</p>
            </div>
          </div>
          
          {isOverlay && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Detection Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {detectionFeatures.map((feature) => (
              <div 
                key={feature.id}
                className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:bg-gray-700 transition-all duration-300 cursor-pointer"
                onClick={() => setActiveDetection(activeDetection === feature.id ? null : feature.id)}
              >
                {/* Feature Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${feature.color}`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      feature.status === 'active' ? 'bg-[#3BE39C]/20 text-[#3BE39C]' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {feature.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <h3 className="text-white font-medium mb-2">{feature.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{feature.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Detected today:</span>
                    <span className="text-white font-medium">{feature.detectedCount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Expandable Content */}
                {activeDetection === feature.id && (
                  <div className="border-t border-gray-700 bg-gray-900">
                    {/* Mock Video Feed */}
                    <div className="relative aspect-video bg-black">
                      <ImageWithFallback 
                        src={feature.mockFeed}
                        alt={`${feature.name} feed`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Detection Overlay Simulation */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/70 text-white px-4 py-2 rounded-lg">
                          <div className="text-center">
                            <feature.icon className="w-8 h-8 mx-auto mb-2 text-[#3BE39C]" />
                            <div className="text-sm">AI Detection Active</div>
                            <div className="text-xs text-gray-300">Live Analysis</div>
                          </div>
                        </div>
                      </div>

                      {/* Live Indicator */}
                      <div className="absolute top-3 left-3 flex items-center space-x-1 bg-red-600 text-white px-2 py-1 rounded text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </div>

                      {/* Detection Stats */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
                          <div className="flex items-center justify-between text-white text-sm">
                            <span>Processing:</span>
                            <span className="text-[#3BE39C]">Real-time</span>
                          </div>
                          <div className="flex items-center justify-between text-white text-sm mt-1">
                            <span>Model:</span>
                            <span className="text-gray-300">Neural Network v3.2</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Feature Details */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className="text-[#3BE39C]">Online</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Cameras:</span>
                            <span className="text-white">247</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Model:</span>
                            <span className="text-white">v3.2</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Updated:</span>
                            <span className="text-white">Live</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Simulate Weapon Detection Button - Only for Weapon Detection */}
                      {feature.id === 'weapon' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            simulateWeaponDetection();
                          }}
                          disabled={isSimulating}
                          className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <AlertTriangle className="w-5 h-5" />
                          {isSimulating ? 'Detecting Weapon...' : 'Simulate Weapon Detection'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* System Overview */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">System Performance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#3BE39C] mb-1">98.7%</div>
                <div className="text-gray-400 text-sm">Overall Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">247</div>
                <div className="text-gray-400 text-sm">Active Cameras</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400 mb-1">15ms</div>
                <div className="text-gray-400 text-sm">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FF6EC7] mb-1">6</div>
                <div className="text-gray-400 text-sm">AI Models Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}