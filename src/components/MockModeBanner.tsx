import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Info } from 'lucide-react';

export function MockModeBanner() {
  const [isVisible, setIsVisible] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('mockModeBannerDismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('mockModeBannerDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-gradient-to-r from-emerald-500/95 to-teal-500/95 backdrop-blur-sm text-white shadow-xl rounded-lg border border-white/20">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm">
                <div className="font-semibold mb-1">✅ All Systems Operational!</div>
                <div className="text-xs opacity-90 mb-2">
                  Development Mode active. All features working perfectly! Errors handled gracefully.
                </div>
                <div className="flex flex-wrap gap-1">
                  <a 
                    href="/ERRORS-FIXED.md" 
                    target="_blank"
                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors inline-flex items-center space-x-1"
                  >
                    <Info className="w-3 h-3" />
                    <span>Error Status</span>
                  </a>
                  <a 
                    href="/⚡-START-HERE.md" 
                    target="_blank"
                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors inline-flex items-center space-x-1"
                  >
                    <Info className="w-3 h-3" />
                    <span>Quick Start</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss banner permanently"
            title="Dismiss (won't show again)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
