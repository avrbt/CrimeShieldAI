import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface DiagnosticResult {
  test: string;
  status: 'loading' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function QuickDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (test: string, status: DiagnosticResult['status'], message: string, details?: any) => {
    setResults(prev => {
      const filtered = prev.filter(r => r.test !== test);
      return [...filtered, { test, status, message, details }];
    });
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    const PROJECT_ID = 'lfksrwqamtfqrexoxlnp';
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxma3Nyd3FhbXRmcXJleG94bG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTcwMjAsImV4cCI6MjA3NzUzMzAyMH0.WZ9VtUx24DMuRFJh0ZluYwjNTBhUyjVRlgQE7WS6iqA';
    const BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/make-server-cfc8313f`;

    // Test 1: Network connectivity
    updateResult('network', 'loading', 'Testing network connectivity...');
    try {
      await fetch('https://www.google.com', { mode: 'no-cors' });
      updateResult('network', 'success', 'Network connection is working');
    } catch (err) {
      updateResult('network', 'error', 'No network connection', err);
    }

    // Test 2: Supabase reachability
    updateResult('supabase', 'loading', 'Testing Supabase project...');
    try {
      const response = await fetch(`https://${PROJECT_ID}.supabase.co`);
      if (response.ok || response.status === 404) {
        updateResult('supabase', 'success', 'Supabase project is reachable');
      } else {
        updateResult('supabase', 'warning', `Supabase responded with status ${response.status}`);
      }
    } catch (err) {
      updateResult('supabase', 'error', 'Cannot reach Supabase project', err);
    }

    // Test 3: Edge Function health check
    updateResult('health', 'loading', 'Testing Edge Function health...');
    try {
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'ok') {
        if (data.env?.hasSupabaseUrl && data.env?.hasServiceKey) {
          updateResult('health', 'success', 'Edge Function is fully configured', data);
        } else {
          updateResult('health', 'warning', 'Edge Function is running but environment variables are missing', data);
        }
      } else {
        updateResult('health', 'warning', 'Edge Function responded but status is not ok', data);
      }
    } catch (err: any) {
      updateResult('health', 'error', 'Edge Function is not accessible: ' + err.message, err);
    }

    // Test 4: Signup endpoint test
    updateResult('signup', 'loading', 'Testing signup endpoint...');
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'test123456',
          name: 'Diagnostic Test User',
          role: 'citizen'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        updateResult('signup', 'success', 'Signup endpoint is working correctly', data);
      } else {
        updateResult('signup', 'error', 'Signup failed: ' + (data.error || 'Unknown error'), data);
      }
    } catch (err: any) {
      updateResult('signup', 'error', 'Signup endpoint error: ' + err.message, err);
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'loading':
        return 'border-blue-500/20 bg-blue-500/5';
      case 'success':
        return 'border-emerald-500/20 bg-emerald-500/5';
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/5';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1419] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl">
              <Shield className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl text-white mb-2">CrimeShield System Diagnostics</h1>
          <p className="text-gray-400">Checking your backend configuration...</p>
        </div>

        {/* Configuration Info */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg text-white mb-4">Configuration</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Project ID:</span>
              <code className="text-emerald-400 bg-gray-900/50 px-2 py-1 rounded">lfksrwqamtfqrexoxlnp</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Function Name:</span>
              <code className="text-emerald-400 bg-gray-900/50 px-2 py-1 rounded">make-server-cfc8313f</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Base URL:</span>
              <code className="text-emerald-400 bg-gray-900/50 px-2 py-1 rounded text-xs">
                https://lfksrwqamtfqrexoxlnp.supabase.co/functions/v1/make-server-cfc8313f
              </code>
            </div>
          </div>
        </div>

        {/* Diagnostic Results */}
        <div className="space-y-4 mb-6">
          {results.map((result) => (
            <div
              key={result.test}
              className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(result.status)}</div>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1 capitalize">
                    {result.test} Test
                  </h3>
                  <p className="text-gray-300 text-sm">{result.message}</p>
                  {result.details && result.status === 'success' && (
                    <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs text-gray-400 overflow-auto">
                      <pre>{JSON.stringify(result.details, null, 2)}</pre>
                    </div>
                  )}
                  {result.status === 'error' && (
                    <div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-red-300">
                      <p className="font-medium mb-1">What to do:</p>
                      {result.test === 'health' && (
                        <ul className="list-disc list-inside space-y-1">
                          <li>Edge Function not deployed - see /DEPLOY-EDGE-FUNCTION.md</li>
                          <li>Check Supabase Dashboard → Edge Functions</li>
                          <li>Deploy make-server-cfc8313f function</li>
                        </ul>
                      )}
                      {result.test === 'signup' && (
                        <ul className="list-disc list-inside space-y-1">
                          <li>Set SUPABASE_URL environment variable</li>
                          <li>Set SUPABASE_SERVICE_ROLE_KEY environment variable</li>
                          <li>Redeploy the function after setting variables</li>
                        </ul>
                      )}
                    </div>
                  )}
                  {result.status === 'warning' && result.details?.env && (
                    <div className="mt-2 p-2 bg-yellow-900/20 rounded text-xs text-yellow-300">
                      <p className="font-medium mb-1">Environment Status:</p>
                      <ul className="space-y-1">
                        <li>SUPABASE_URL: {result.details.env.hasSupabaseUrl ? '✅ SET' : '❌ NOT SET'}</li>
                        <li>SERVICE_ROLE_KEY: {result.details.env.hasServiceKey ? '✅ SET' : '❌ NOT SET'}</li>
                      </ul>
                      <p className="mt-2">See /ENVIRONMENT-SETUP-REQUIRED.md for setup instructions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              'Run Diagnostics Again'
            )}
          </Button>
        </div>

        {/* Summary */}
        {results.length > 0 && !isRunning && (
          <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h3 className="text-white font-medium mb-2">Summary</h3>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-gray-300">
                  {results.filter(r => r.status === 'success').length} Passed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">
                  {results.filter(r => r.status === 'warning').length} Warnings
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-gray-300">
                  {results.filter(r => r.status === 'error').length} Failed
                </span>
              </div>
            </div>
            
            {results.filter(r => r.status === 'error' || r.status === 'warning').length > 0 && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                <p className="text-blue-300 text-sm">
                  📚 <strong>Next Steps:</strong> Open <code className="bg-gray-900/50 px-2 py-0.5 rounded">/DEPLOY-EDGE-FUNCTION.md</code> for detailed setup instructions
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
