import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface WebcamFeedProps {
  feedId: number;
  useDetectionStream?: boolean;
  detectionApiUrl?: string;
  className?: string;
}

export function WebcamFeed({ 
  feedId, 
  useDetectionStream = false, 
  detectionApiUrl = 'http://localhost:5000',
  className = ''
}: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Check camera permission status
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check if Permissions API is available
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
            console.log(`📹 Webcam Feed ${feedId}: Permission changed to ${result.state}`);
          });
        } else {
          // Permissions API not available, assume prompt state
          setPermissionState('prompt');
        }
      } catch (err) {
        console.log(`📹 Webcam Feed ${feedId}: Permissions API check failed, assuming prompt state`);
        setPermissionState('prompt');
      }
    };

    if (!useDetectionStream) {
      checkPermissions();
    }
  }, [feedId, useDetectionStream]);

  // Manual permission request function
  const handleRequestPermission = async () => {
    console.log(`🔐 Webcam Feed ${feedId}: User clicked to request camera access`);
    setHasUserInteracted(true);
    setError(null);
    setIsLoading(true);
    
    toast.info('Requesting camera access...', {
      description: 'Please click "Allow" when prompted by your browser',
      duration: 5000,
    });
  };

  // Manual retry function
  const handleManualRetry = () => {
    console.log(`🔄 Webcam Feed ${feedId}: Manual retry triggered`);
    setError(null);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    setHasUserInteracted(true);
    
    // Force re-render to trigger the useEffect
    toast.info('Retrying camera access...', {
      description: 'Please allow camera permissions if prompted',
      duration: 3000,
    });
  };

  // Effect for browser webcam (when detection is OFF)
  useEffect(() => {
    if (useDetectionStream) {
      // Stop browser webcam when detection is ON
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`🛑 Webcam Feed ${feedId}: Browser camera stopped for detection server`);
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsLoading(false);
      setError(null);
      return;
    }

    // Don't auto-request camera if user hasn't interacted yet and permission is not granted
    if (!hasUserInteracted && permissionState !== 'granted') {
      setIsLoading(false);
      return;
    }

    // Start browser webcam when detection is OFF
    let mounted = true;

    const startWebcam = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`📹 Webcam Feed ${feedId}: Requesting camera access (attempt ${retryCount + 1})...`);

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });

        if (!mounted) {
          // Component unmounted, stop the stream
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Store stream reference
        streamRef.current = stream;

        // Attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => {
              console.error('Error playing webcam:', err);
              setError('Failed to play webcam stream');
            });
          };
        }

        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
        setPermissionState('granted');
        console.log(`✅ Webcam Feed ${feedId}: Browser camera started successfully`);
        
        toast.success('Camera Connected', {
          description: `Webcam Feed ${feedId} is now live`,
          duration: 3000,
        });
      } catch (err: any) {
        console.error(`❌ Webcam Feed ${feedId}: Failed to start camera:`, err);
        
        if (!mounted) return;
        
        if (err.name === 'NotAllowedError') {
          const errorMsg = 'Camera access denied. Please allow camera permissions in your browser.';
          setError(errorMsg);
          setPermissionState('denied');
          toast.error('Camera Permission Denied', {
            description: 'Click the camera icon in your browser address bar to allow access',
            duration: 6000,
          });
        } else if (err.name === 'NotFoundError') {
          const errorMsg = 'No camera found on this device.';
          setError(errorMsg);
          toast.error('Camera Not Found', {
            description: 'Please connect a webcam to use this feature',
            duration: 5000,
          });
        } else if (err.name === 'NotReadableError') {
          const errorMsg = 'Camera is in use by another application. Please close other apps using the camera.';
          setError(errorMsg);
          toast.error('Camera In Use', {
            description: 'Close other applications that might be using the camera',
            duration: 5000,
          });
        } else {
          const errorMsg = 'Failed to access camera. Please check permissions and try again.';
          setError(errorMsg);
          toast.error('Camera Error', {
            description: err.message || 'Unknown error occurred',
            duration: 5000,
          });
        }
        
        setIsLoading(false);
      }
    };

    startWebcam();

    // Cleanup function
    return () => {
      mounted = false;
      
      // Clear any pending retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      // Stop all tracks when component unmounts or detection turns ON
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`🛑 Webcam Feed ${feedId}: Camera track stopped (cleanup)`);
        });
        streamRef.current = null;
      }
      
      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [feedId, useDetectionStream, retryCount, hasUserInteracted, permissionState]);

  // Show detection stream (MJPEG from Flask server)
  if (useDetectionStream) {
    return (
      <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
        <img
          ref={imgRef}
          src={`${detectionApiUrl}/video_feed/${feedId}?source=camera&t=${Date.now()}`}
          alt={`Detection Feed ${feedId}`}
          className={className}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            imageRendering: 'auto',
            display: streamError ? 'none' : 'block'
          }}
          onLoad={() => {
            console.log(`✅ Detection stream ${feedId} loaded from server`);
            setStreamError(false);
            setIsLoading(false);
          }}
          onError={(e) => {
            console.error(`❌ Detection stream ${feedId} failed to load`);
            setStreamError(true);
            setIsLoading(false);
          }}
        />
        
        {/* Loading state for detection stream */}
        {isLoading && !streamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10">
            <Camera className="w-12 h-12 text-[#3BE39C] animate-pulse mb-3" />
            <p className="text-white text-sm">Connecting to AI Detection Server...</p>
            <p className="text-gray-400 text-xs mt-1">Feed {feedId}</p>
          </div>
        )}
        
        {/* Error state for detection stream */}
        {streamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10">
            <AlertCircle className="w-12 h-12 text-amber-500 animate-pulse mb-3" />
            <p className="text-white text-sm font-medium mb-2">Detection Server Unavailable</p>
            <p className="text-gray-400 text-xs text-center px-4">
              Ensure Flask server is running on {detectionApiUrl}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Feed {feedId} - Retrying...
            </p>
          </div>
        )}

        {/* Detection Active indicator */}
        {!streamError && !isLoading && (
          <div className="absolute top-3 left-3 flex items-center space-x-1 bg-red-600 text-white px-2 py-1 rounded text-xs z-20">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>AI DETECTION ACTIVE</span>
          </div>
        )}
      </div>
    );
  }

  // Show browser webcam (getUserMedia)
  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      {/* Initial permission request UI - shown when user hasn't granted permission yet */}
      {!hasUserInteracted && permissionState !== 'granted' && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 z-10">
          <div className="flex flex-col items-center max-w-md px-6 text-center">
            {permissionState === 'denied' ? (
              <>
                <Lock className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-white font-medium mb-2">Camera Access Blocked</h3>
                <p className="text-gray-400 text-sm mb-6">
                  You've previously denied camera access. To enable your webcam:
                </p>
                <div className="bg-gray-800 rounded-lg p-4 mb-4 text-left w-full">
                  <p className="text-gray-300 text-sm mb-2 font-medium">🔧 How to Fix:</p>
                  <ol className="text-gray-400 text-xs space-y-2 list-decimal list-inside">
                    <li>Click the camera icon (🎥) or lock icon (🔒) in your browser's address bar</li>
                    <li>Find "Camera" permissions and change it to "Allow"</li>
                    <li>Refresh this page or click the button below</li>
                  </ol>
                </div>
                <button
                  onClick={handleManualRetry}
                  className="px-6 py-2.5 bg-[#3BE39C] hover:bg-[#32c787] text-gray-900 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Retry Camera Access</span>
                </button>
              </>
            ) : (
              <>
                <Camera className="w-16 h-16 text-[#3BE39C] mb-4" />
                <h3 className="text-white font-medium mb-2">Live Webcam Feed {feedId}</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Click below to activate your camera for this CCTV feed
                </p>
                <button
                  onClick={handleRequestPermission}
                  className="px-6 py-3 bg-[#3BE39C] hover:bg-[#32c787] text-gray-900 rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2 shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                  <span>Activate Camera</span>
                </button>
                <p className="text-gray-500 text-xs mt-4">
                  Your browser will ask for camera permission
                </p>
              </>
            )}
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10">
          <Camera className="w-12 h-12 text-[#3BE39C] animate-pulse mb-3" />
          <p className="text-white text-sm">Starting webcam...</p>
          <p className="text-gray-400 text-xs mt-1">Please allow camera access</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-900/20 via-gray-900 to-gray-900 z-10 p-6">
          <div className="max-w-lg w-full bg-gray-800 rounded-xl p-6 border-2 border-red-500/30 shadow-2xl">
            {/* Error Icon and Title */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-500/20 rounded-full p-4">
                <Lock className="w-12 h-12 text-red-500" />
              </div>
            </div>
            
            <h3 className="text-white text-center font-bold mb-2">🚨 Camera Permission Denied</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Feed {feedId} needs camera access to work as a live CCTV feed
            </p>
            
            {/* Instructions Box */}
            <div className="bg-gray-900/80 rounded-lg p-5 mb-6 border border-[#3BE39C]/30">
              <div className="flex items-start space-x-3 mb-4">
                <div className="bg-[#3BE39C]/20 rounded-full p-2 flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-[#3BE39C]" />
                </div>
                <div>
                  <p className="text-[#3BE39C] font-semibold mb-2">How to Fix This:</p>
                  <ol className="text-gray-300 text-sm space-y-3 list-none">
                    <li className="flex items-start space-x-2">
                      <span className="text-[#3BE39C] font-bold flex-shrink-0">1.</span>
                      <span>Look for the <strong className="text-white">camera icon 🎥</strong> or <strong className="text-white">lock icon 🔒</strong> in your browser's address bar (top left)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-[#3BE39C] font-bold flex-shrink-0">2.</span>
                      <span>Click on it and find <strong className="text-white">"Camera"</strong> in the permissions list</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-[#3BE39C] font-bold flex-shrink-0">3.</span>
                      <span>Change it from <strong className="text-red-400">"Block"</strong> to <strong className="text-[#3BE39C]">"Allow"</strong></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-[#3BE39C] font-bold flex-shrink-0">4.</span>
                      <span>Click the <strong className="text-white">"Retry Camera Access"</strong> button below</span>
                    </li>
                  </ol>
                </div>
              </div>
              
              {/* Browser-specific tips */}
              <div className="bg-gray-800/50 rounded p-3 mt-3">
                <p className="text-xs text-gray-400 mb-1"><strong className="text-gray-300">💡 Quick Tip:</strong></p>
                <p className="text-xs text-gray-300">
                  After changing permissions, you may need to <strong>refresh the page</strong> or click Retry
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleManualRetry}
                className="w-full px-6 py-3 bg-[#3BE39C] hover:bg-[#32c787] text-gray-900 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg font-semibold"
              >
                <Camera className="w-5 h-5" />
                <span>🔄 Retry Camera Access {retryCount > 0 && `(Attempt ${retryCount + 1})`}</span>
              </button>
              
              <button
                onClick={() => {
                  toast.info('📍 Look at the top of your browser', {
                    description: 'Find the 🎥 camera icon or 🔒 lock icon in the address bar, click it, and select "Allow" for camera permissions',
                    duration: 10000,
                  });
                }}
                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <AlertCircle className="w-5 h-5" />
                <span>ℹ️ Show Detailed Help</span>
              </button>
            </div>
            
            {/* Alternative Option */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                <strong className="text-gray-400">Still having issues?</strong> Make sure no other application is using your camera, or try a different browser.
              </p>
            </div>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Mirror the webcam (like selfie mode)
          display: error ? 'none' : 'block'
        }}
      />

      {/* Live indicator for browser webcam */}
      {!isLoading && !error && (
        <div className="absolute top-3 left-3 flex items-center space-x-1 bg-[#3BE39C] text-white px-2 py-1 rounded text-xs z-20">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>LIVE WEBCAM</span>
        </div>
      )}
    </div>
  );
}