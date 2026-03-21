import React, { useState, useEffect } from 'react';
import { alertsAPI, evidenceAPI, statsAPI, threatAPI } from '../../utils/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { toast } from 'sonner@2.0.3';

/**
 * Example Component: Demonstrates Backend Integration
 * 
 * This component shows how to use the Supabase backend APIs
 * for the CrimeShield AI Dashboard.
 */

export function BackendUsageExample() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch dashboard statistics on mount
  useEffect(() => {
    if (user) {
      loadStats();
      loadAlerts();
    }
  }, [user]);

  async function loadStats() {
    try {
      const result = await statsAPI.getStats();
      setStats(result.stats);
    } catch (error: any) {
      console.error('Stats error:', error);
      toast.error('Failed to load statistics');
    }
  }

  async function loadAlerts() {
    try {
      const result = await alertsAPI.getAll({ severity: 'high' });
      setAlerts(result.alerts || []);
    } catch (error: any) {
      console.error('Alerts error:', error);
      toast.error('Failed to load alerts');
    }
  }

  async function createSampleAlert() {
    setLoading(true);
    try {
      const result = await alertsAPI.create({
        type: 'Theft',
        severity: 'high',
        description: 'Vehicle theft reported near main road',
        location: 'MG Road, Bengaluru',
        state: 'Karnataka',
        district: 'Bengaluru',
        latitude: 12.9716,
        longitude: 77.5946,
      });

      toast.success('Alert created successfully!');
      loadAlerts(); // Refresh alerts
      loadStats(); // Refresh stats
    } catch (error: any) {
      console.error('Create alert error:', error);
      toast.error(error.message || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  }

  async function createSampleEvidence() {
    setLoading(true);
    try {
      const result = await evidenceAPI.create({
        title: 'CCTV Footage - Theft Incident',
        type: 'Video',
        category: 'Theft',
        description: 'Security camera footage showing vehicle theft',
        location: 'Parking Lot A',
        imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800',
        tags: ['cctv', 'theft', 'vehicle'],
      });

      toast.success('Evidence stored successfully!');
      loadStats(); // Refresh stats
    } catch (error: any) {
      console.error('Create evidence error:', error);
      toast.error(error.message || 'Failed to store evidence');
    } finally {
      setLoading(false);
    }
  }

  async function checkSampleIP() {
    setLoading(true);
    try {
      const result = await threatAPI.checkIP('8.8.8.8');
      console.log('IP Check Result:', result);
      toast.success('IP checked successfully! Check console for details.');
    } catch (error: any) {
      console.error('IP check error:', error);
      toast.error(error.message || 'Failed to check IP');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="p-8 bg-slate-800/50 rounded-lg border border-slate-700">
        <p className="text-slate-400">Loading authentication...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 bg-slate-800/50 rounded-lg border border-slate-700">
        <p className="text-slate-400">Please sign in to use backend features</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-800/50 rounded-lg border border-slate-700 space-y-6">
      <div>
        <h2 className="text-xl text-white mb-2">Backend Integration Examples</h2>
        <p className="text-slate-400 text-sm">
          Logged in as: <span className="text-emerald-400">{user.email}</span> ({user.role})
        </p>
      </div>

      {/* Statistics Section */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Total Alerts</p>
            <p className="text-2xl text-white mt-1">{stats.total_alerts}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Active Alerts</p>
            <p className="text-2xl text-white mt-1">{stats.active_alerts}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Evidence Items</p>
            <p className="text-2xl text-white mt-1">{stats.total_evidence}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Detections</p>
            <p className="text-2xl text-white mt-1">{stats.total_detections}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={createSampleAlert}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600"
        >
          Create Sample Alert
        </Button>
        <Button
          onClick={createSampleEvidence}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Store Sample Evidence
        </Button>
        <Button
          onClick={checkSampleIP}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600"
        >
          Check Sample IP
        </Button>
        <Button
          onClick={() => { loadStats(); loadAlerts(); }}
          disabled={loading}
          variant="outline"
        >
          Refresh Data
        </Button>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-white mb-3">Recent High-Priority Alerts</h3>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-900/50 p-3 rounded-lg border border-slate-700"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white">{alert.type}</p>
                    <p className="text-sm text-slate-400">{alert.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{alert.location}</p>
                  </div>
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
