import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

/**
 * SetupChecker - Verifies backend configuration and alerts if setup is incomplete
 */
export function SetupChecker() {
  const [checking, setChecking] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [envStatus, setEnvStatus] = useState<{
    hasSupabaseUrl: boolean;
    hasServiceKey: boolean;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkSetup();
  }, []);

  async function checkSetup() {
    setChecking(true);
    setHasError(false);

    try {
      const projectId = 'lfksrwqamtfqrexoxlnp';
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxma3Nyd3FhbXRmcXJleG94bG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTcwMjAsImV4cCI6MjA3NzUzMzAyMH0.WZ9VtUx24DMuRFJh0ZluYwjNTBhUyjVRlgQE7WS6iqA';
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cfc8313f/health`,
        {
          headers: { 'Authorization': `Bearer ${anonKey}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEnvStatus(data.env || null);
        
        // If env variables are missing, show error
        if (data.env && (!data.env.hasSupabaseUrl || !data.env.hasServiceKey)) {
          setHasError(true);
        }
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error('Setup check failed:', error);
      setHasError(true);
    } finally {
      setChecking(false);
    }
  }

  // Don't show anything if dismissed or if setup is complete
  if (dismissed || (checking === false && !hasError)) {
    return null;
  }

  // Show loading state
  if (checking) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 max-w-md z-50 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 font-semibold mb-1">Checking Backend Setup...</p>
            <p className="text-blue-300 text-sm">Verifying Supabase configuration</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if setup incomplete
  if (hasError) {
    const missingUrl = envStatus && !envStatus.hasSupabaseUrl;
    const missingKey = envStatus && !envStatus.hasServiceKey;

    return (
      <div className="fixed bottom-4 right-4 bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-md z-50 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 font-semibold mb-2">Backend Setup Required</p>
            <p className="text-red-300 text-sm mb-3">
              Environment variables need to be configured in Supabase:
            </p>
            
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2">
                {missingUrl ? (
                  <span className="text-red-400">❌</span>
                ) : (
                  <span className="text-green-400">✓</span>
                )}
                <span className="text-gray-300">SUPABASE_URL</span>
              </div>
              <div className="flex items-center gap-2">
                {missingKey ? (
                  <span className="text-red-400">❌</span>
                ) : (
                  <span className="text-green-400">✓</span>
                )}
                <span className="text-gray-300">SUPABASE_SERVICE_ROLE_KEY</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => window.open('/verify-setup.html', '_blank')}
                className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Setup Guide
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={checkSetup}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recheck
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissed(true)}
                className="text-red-400 hover:bg-red-500/10"
              >
                Dismiss
              </Button>
            </div>

            <p className="text-xs text-red-300/70 mt-3">
              See <code className="bg-red-500/20 px-1 rounded">/ENVIRONMENT-SETUP-REQUIRED.md</code> for detailed instructions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
