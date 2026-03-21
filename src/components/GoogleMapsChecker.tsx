import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, MapPin } from 'lucide-react';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../utils/googleMapsLoader';

export function GoogleMapsChecker() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    const checkGoogleMaps = async () => {
      try {
        setStatus('checking');
        setDetails(['🔍 Starting Google Maps API verification...']);
        
        // Check if already loaded
        if (isGoogleMapsLoaded()) {
          setDetails(prev => [...prev, '✅ Google Maps API already loaded']);
          setStatus('success');
          return;
        }

        setDetails(prev => [...prev, '📡 Loading Google Maps API...']);
        
        // Try to load Google Maps
        const loaded = await loadGoogleMapsAPI();
        
        if (loaded) {
          setDetails(prev => [...prev, '✅ Google Maps API loaded successfully']);
          
          // Verify specific APIs
          const checks = [];
          
          if (typeof google !== 'undefined' && google.maps) {
            checks.push('✅ google.maps object available');
          } else {
            checks.push('❌ google.maps object NOT available');
          }
          
          if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
            checks.push('✅ google.maps.Map constructor available');
          } else {
            checks.push('❌ google.maps.Map constructor NOT available');
          }
          
          if (typeof google !== 'undefined' && google.maps && google.maps.Marker) {
            checks.push('✅ google.maps.Marker constructor available');
          } else {
            checks.push('❌ google.maps.Marker constructor NOT available');
          }

          if (typeof google !== 'undefined' && google.maps && google.maps.places) {
            checks.push('✅ google.maps.places library loaded');
          } else {
            checks.push('⚠️ google.maps.places library NOT loaded');
          }
          
          setDetails(prev => [...prev, ...checks]);
          setStatus('success');
        } else {
          setDetails(prev => [...prev, '❌ Failed to load Google Maps API']);
          setErrorMessage('Google Maps API failed to load. Check console for errors.');
          setStatus('error');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setDetails(prev => [...prev, `❌ Error: ${errorMsg}`]);
        setErrorMessage(errorMsg);
        setStatus('error');
      }
    };

    checkGoogleMaps();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'border-blue-500/50 bg-blue-500/10';
      case 'success':
        return 'border-green-500/50 bg-green-500/10';
      case 'error':
        return 'border-red-500/50 bg-red-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className={`bg-gray-900 border-2 rounded-xl p-8 ${getStatusColor()} transition-all`}>
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-[#FF6EC7]/20 rounded-lg">
              <MapPin className="w-6 h-6 text-[#FF6EC7]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Google Maps API Checker</h1>
              <p className="text-gray-400">Verifying Crime Hotspot & Threat Map integration</p>
            </div>
          </div>

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>

          {/* Status Message */}
          <div className="text-center mb-6">
            {status === 'checking' && (
              <p className="text-blue-400">Checking Google Maps API...</p>
            )}
            {status === 'success' && (
              <div>
                <p className="text-green-400 font-bold mb-2">✅ Google Maps Integration Working!</p>
                <p className="text-gray-400 text-sm">All systems operational for Crime Hotspot & Threat Map</p>
              </div>
            )}
            {status === 'error' && (
              <div>
                <p className="text-red-400 font-bold mb-2">❌ Google Maps Integration Failed</p>
                <p className="text-gray-400 text-sm">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-bold mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span>Diagnostic Details</span>
            </h3>
            <div className="space-y-2 font-mono text-sm">
              {details.map((detail, index) => (
                <div key={index} className="text-gray-300">
                  {detail}
                </div>
              ))}
            </div>
          </div>

          {/* API Key Info */}
          <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h4 className="text-sm font-bold text-gray-300 mb-2">API Configuration</h4>
            <div className="space-y-1 text-xs text-gray-400 font-mono">
              <div>API Key: AIzaSyAFaMjdVr5vmalZOe59FkYllrUXbOB0U0c</div>
              <div>Libraries: places</div>
              <div>Loading: async</div>
            </div>
          </div>

          {/* Troubleshooting Tips */}
          {status === 'error' && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <h4 className="text-sm font-bold text-red-400 mb-2">Troubleshooting Tips:</h4>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Verify API key is valid in Google Cloud Console</li>
                <li>• Check if Maps JavaScript API is enabled</li>
                <li>• Verify domain restrictions allow your current domain</li>
                <li>• Check browser console for specific error messages</li>
                <li>• Ensure billing is enabled for the project</li>
                <li>• Check API usage quotas haven't been exceeded</li>
              </ul>
            </div>
          )}

          {/* Success Tips */}
          {status === 'success' && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <h4 className="text-sm font-bold text-green-400 mb-2">✅ Next Steps:</h4>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Navigate to Crime Hotspot & Threat Map section</li>
                <li>• Select a state from the location dropdown</li>
                <li>• Google Maps should load with crime markers</li>
                <li>• Toggle between Google Maps and Custom Map views</li>
              </ul>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#FF6EC7] hover:bg-[#FF6EC7]/80 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>🔄 Recheck</span>
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 text-center text-gray-500 text-sm">
          <p>This diagnostic tool verifies Google Maps API integration</p>
          <p className="mt-1">Used in: Crime Hotspot Section, Threat Map Section</p>
        </div>
      </div>
    </div>
  );
}
