import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { projectId, publicAnonKey } from '../utils/supabase/info';

/**
 * API Test Component - Tests direct API calls
 */
export function APITest() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cfc8313f`;

  async function testHealthCheck() {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(`Health check failed: ${response.status} - ${JSON.stringify(data)}`);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function testSignup() {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const signupData = {
        email,
        password,
        name: 'Test User',
        role: 'citizen',
      };

      console.log('Sending signup request:', signupData);

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(signupData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        setError(`Signup failed: ${response.status} - ${JSON.stringify(data)}`);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-6">
        <div>
          <h1 className="text-2xl text-white mb-2">API Test Console</h1>
          <p className="text-slate-400 text-sm">Test direct API calls to debug authentication</p>
        </div>

        <div className="space-y-2">
          <p className="text-slate-400 text-sm">Project ID: {projectId}</p>
          <p className="text-slate-400 text-sm break-all">Anon Key: {publicAnonKey.substring(0, 20)}...</p>
          <p className="text-slate-400 text-sm">API URL: {API_BASE_URL}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white text-sm block mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <div>
            <label className="text-white text-sm block mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={testHealthCheck}
            disabled={loading}
            variant="outline"
          >
            Test Health Check
          </Button>
          
          <Button
            onClick={testSignup}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            Test Signup
          </Button>
        </div>

        {loading && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded p-4">
            <p className="text-blue-400">Loading...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded p-4">
            <p className="text-red-400 font-semibold mb-2">Error:</p>
            <pre className="text-red-300 text-xs overflow-auto">{error}</pre>
          </div>
        )}

        {result && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded p-4">
            <p className="text-emerald-400 font-semibold mb-2">Success:</p>
            <pre className="text-emerald-300 text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="border-t border-slate-700 pt-4">
          <p className="text-slate-400 text-sm">
            Note: Check browser console for detailed logs
          </p>
        </div>
      </div>
    </div>
  );
}
