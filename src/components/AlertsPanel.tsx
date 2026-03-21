import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Send, Save, Clock, MapPin, Filter, Calendar, Shield, Radio, Download, BarChart3, X } from 'lucide-react';
import { authUtils } from '../utils/auth';
import { alarmSystem } from '../utils/alarmSystem';
import { ThreatIntelligencePanel } from './ThreatIntelligencePanel';
import { toast } from 'sonner@2.0.3';

interface AlertsPanelProps {
  fullView?: boolean;
}

export function AlertsPanel({ fullView = false }: AlertsPanelProps) {
  const currentUser = authUtils.getCurrentUser();
  const isCitizen = currentUser?.userType === 'citizen';
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'Weapon Detection',
      location: 'Main Street Intersection',
      cameraId: 'CAM-001',
      confidence: 0.92,
      severity: 'high',
      timestamp: '2 min ago',
      status: 'dispatched',
      description: 'Suspicious object detected matching weapon profile'
    },
    {
      id: 2,
      type: 'Vehicle Intrusion',
      location: 'Government Building Perimeter',
      cameraId: 'CAM-002',
      confidence: 0.88,
      severity: 'high',
      timestamp: '5 min ago',
      status: 'pending',
      description: 'Unauthorized vehicle detected in restricted zone'
    },
    {
      id: 3,
      type: 'Crowd Anomaly',
      location: 'Shopping Mall Entrance',
      cameraId: 'CAM-003',
      confidence: 0.85,
      severity: 'high',
      timestamp: '8 min ago',
      status: 'acknowledged',
      description: 'Unusual crowd formation detected'
    },
    {
      id: 4,
      type: 'Face Recognition Match',
      location: 'Airport Terminal',
      cameraId: 'CAM-006',
      confidence: 0.94,
      severity: 'high',
      timestamp: '12 min ago',
      status: 'dispatched',
      description: 'Known suspect identified in restricted area'
    },
    {
      id: 5,
      type: 'Loitering Behavior',
      location: 'Bank ATM Area',
      cameraId: 'CAM-004',
      confidence: 0.81,
      severity: 'medium',
      timestamp: '15 min ago',
      status: 'pending',
      description: 'Individual loitering near ATM for extended period'
    },
    {
      id: 6,
      type: 'Weapon Detection',
      location: 'Railway Station Platform 3',
      cameraId: 'CAM-007',
      confidence: 0.89,
      severity: 'high',
      timestamp: '18 min ago',
      status: 'dispatched',
      description: 'Dangerous weapon detected in public transit area'
    },
    {
      id: 7,
      type: 'Unattended Object',
      location: 'Metro Station Exit',
      cameraId: 'CAM-005',
      confidence: 0.78,
      severity: 'medium',
      timestamp: '22 min ago',
      status: 'acknowledged',
      description: 'Suspicious package left unattended'
    },
    {
      id: 8,
      type: 'Crowd Anomaly',
      location: 'City Park Central',
      cameraId: 'CAM-008',
      confidence: 0.73,
      severity: 'medium',
      timestamp: '28 min ago',
      status: 'acknowledged',
      description: 'Large gathering detected in public space'
    },
    {
      id: 9,
      type: 'Face Recognition Match',
      location: 'Border Checkpoint',
      cameraId: 'CAM-009',
      confidence: 0.91,
      severity: 'high',
      timestamp: '32 min ago',
      status: 'dispatched',
      description: 'Watchlist individual identified at border'
    },
    {
      id: 10,
      type: 'Vehicle Intrusion',
      location: 'Military Base Gate',
      cameraId: 'CAM-010',
      confidence: 0.96,
      severity: 'high',
      timestamp: '40 min ago',
      status: 'dispatched',
      description: 'Unauthorized vehicle attempting entry to secured facility'
    },
    {
      id: 11,
      type: 'Loitering Behavior',
      location: 'School Perimeter',
      cameraId: 'CAM-011',
      confidence: 0.76,
      severity: 'low',
      timestamp: '45 min ago',
      status: 'pending',
      description: 'Suspicious activity near educational institution'
    },
    {
      id: 12,
      type: 'Weapon Detection',
      location: 'City Center Plaza',
      cameraId: 'CAM-012',
      confidence: 0.87,
      severity: 'high',
      timestamp: '52 min ago',
      status: 'dispatched',
      description: 'Concealed weapon detected in crowded area'
    }
  ]);

  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('24h');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showThreatIntel, setShowThreatIntel] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState<string | null>(null);

  // Track previous alert count to detect new weapon detections
  const [previousAlertIds, setPreviousAlertIds] = useState<Set<number>>(new Set());

  // Listen for weapon detection events from Detection Tab
  useEffect(() => {
    const handleWeaponDetected = (event: any) => {
      const newAlert = {
        id: Date.now(), // Use timestamp as unique ID
        ...event.detail
      };
      setAlerts(prev => [newAlert, ...prev]);
    };

    window.addEventListener('weaponDetected', handleWeaponDetected);
    return () => window.removeEventListener('weaponDetected', handleWeaponDetected);
  }, []);

  // Only trigger alarm when NEW weapon detection is added
  useEffect(() => {
    if (isCitizen) return;

    const currentWeaponAlerts = alerts.filter(alert => 
      alert.type.toLowerCase().includes('weapon') && 
      alert.status === 'pending' &&
      alert.severity === 'high'
    );

    // Check for new weapon alerts
    const newWeaponAlerts = currentWeaponAlerts.filter(
      alert => !previousAlertIds.has(alert.id)
    );

    if (newWeaponAlerts.length > 0) {
      // Trigger alarm only for NEW weapon detections
      alarmSystem.triggerAlarm('weapon', { duration: 5000, pattern: 'continuous' });
    }

    // Update tracked alert IDs
    const currentIds = new Set(alerts.map(a => a.id));
    setPreviousAlertIds(currentIds);
  }, [alerts, isCitizen]);

  const handleAcknowledge = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
    ));
  };

  const handleDispatch = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'dispatched' } : alert
    ));
  };

  const handleSave = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'saved' } : alert
    ));
  };

  const handleViewThreatIntel = (alert: any) => {
    setSelectedAlert(alert);
    setShowThreatIntel(true);
  };

  // Download report as CSV
  const downloadReport = (type: string) => {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'high':
        data = alerts.filter(a => a.severity === 'high');
        filename = 'high-priority-alerts-report.csv';
        break;
      case 'pending':
        data = alerts.filter(a => a.status === 'pending');
        filename = 'pending-actions-report.csv';
        break;
      case 'dispatched':
        data = alerts.filter(a => a.status === 'dispatched');
        filename = 'dispatched-units-report.csv';
        break;
      case 'all':
        data = alerts;
        filename = 'all-alerts-report.csv';
        break;
    }

    if (data.length === 0) {
      toast.error('No data to download');
      return;
    }

    // Convert to CSV
    const headers = ['ID', 'Type', 'Location', 'Camera ID', 'Confidence', 'Severity', 'Status', 'Timestamp', 'Description'];
    const csvRows = [headers.join(',')];

    data.forEach(alert => {
      const row = [
        alert.id,
        `"${alert.type}"`,
        `"${alert.location}"`,
        alert.cameraId,
        alert.confidence,
        alert.severity,
        alert.status,
        `"${alert.timestamp}"`,
        `"${alert.description}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Downloaded ${data.length} alerts as CSV`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'medium': return 'text-amber-400 bg-amber-400/20 border-amber-400/30';
      case 'low': return 'text-emerald-400 bg-emerald-400/20 border-emerald-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-400 bg-orange-400/20';
      case 'acknowledged': return 'text-amber-400 bg-amber-400/20';
      case 'dispatched': return 'text-emerald-400 bg-emerald-400/20';
      case 'saved': return 'text-cyan-400 bg-cyan-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
    const statusMatch = filterStatus === 'all' || alert.status === filterStatus;
    return severityMatch && statusMatch;
  });

  const displayAlerts = fullView ? filteredAlerts : filteredAlerts.slice(0, 4);

  // Citizen-friendly alerts (only show public safety information)
  const citizenAlerts = alerts.filter(alert => 
    ['Crowd Anomaly', 'Vehicle Intrusion', 'Loitering Behavior'].includes(alert.type)
  ).map(alert => ({
    ...alert,
    // Remove sensitive information for citizens
    cameraId: 'N/A',
    confidence: undefined
  }));

  const citizenDisplayAlerts = fullView ? citizenAlerts : citizenAlerts.slice(0, 4);

  return (
    <section className="bg-[#1A1F2E] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isCitizen && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/20 rounded-lg shadow-lg shadow-orange-500/20">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Real-Time Security Alerts
              </h2>
              <p className="text-gray-400">
                AI-powered threat detection and incident management
              </p>
            </div>
          </div>
          {/* Filters and Date Range - Only for Admin */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value="all">All Severity</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="dispatched">Dispatched</option>
              <option value="saved">Saved</option>
            </select>
          </div>
        </div>
        )}

        {/* Citizen View - Simplified Alerts */}
        {isCitizen ? (
          <div className="space-y-4">
            {citizenDisplayAlerts.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700 rounded-xl p-12 text-center">
                <Shield className="w-16 h-16 text-emerald-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400 text-lg">No active alerts in your area</p>
                <p className="text-gray-500 text-sm mt-2">Your neighborhood is currently safe</p>
              </div>
            ) : (
              citizenDisplayAlerts.map((alert) => (
                <div key={alert.id} className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700 rounded-xl p-6 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </span>
                      </div>
                      <h3 className="text-white font-medium text-lg mb-2">{alert.type}</h3>
                      <div className="flex items-center text-gray-400 text-sm mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        {alert.location}
                      </div>
                      <p className="text-gray-300 text-sm">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Admin View - Detailed Table */
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700 rounded-xl overflow-hidden backdrop-blur-sm">
          {/* Table Header */}
          <div className="bg-gray-800/50 border-b border-gray-700 px-6 py-4 overflow-x-auto">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-300 min-w-[1200px]">
              <div className="col-span-3">Alert Type & Location</div>
              <div className="col-span-2">Camera ID</div>
              <div className="col-span-1">Confidence</div>
              <div className="col-span-1">Severity</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Time</div>
              <div className="col-span-3">Actions</div>
            </div>
          </div>

          {/* Alert Rows - Scrollable */}
          <div className="divide-y divide-gray-700 overflow-x-auto">
            {displayAlerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4 hover:bg-white/5 transition-colors min-w-[1200px]">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Alert Type & Location */}
                  <div className="col-span-3">
                    <div className="text-white font-medium">{alert.type}</div>
                    <div className="flex items-center text-gray-400 text-sm mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {alert.location}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">{alert.description}</div>
                  </div>

                  {/* Camera ID */}
                  <div className="col-span-2">
                    <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm font-mono">
                      {alert.cameraId}
                    </span>
                  </div>

                  {/* Confidence Score */}
                  <div className="col-span-1">
                    <div className="text-white font-medium">
                      {Math.round(alert.confidence * 100)}%
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                      <div 
                        className="bg-emerald-400 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${alert.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Severity */}
                  <div className="col-span-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="col-span-1">
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      {alert.timestamp}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      {alert.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="bg-orange-400/20 text-orange-400 hover:bg-orange-400/30 px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Acknowledge</span>
                          </button>
                          <button
                            onClick={() => handleDispatch(alert.id)}
                            className="bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30 px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Dispatch</span>
                          </button>
                        </>
                      )}
                      {alert.status === 'acknowledged' && (
                        <button
                          onClick={() => handleDispatch(alert.id)}
                          className="bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30 px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleSave(alert.id)}
                        className="bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                      {alert.type.toLowerCase().includes('weapon') && (
                        <button
                          onClick={() => handleViewThreatIntel(alert)}
                          className="bg-red-400/20 text-red-400 hover:bg-red-400/30 px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                        >
                          <Radio className="w-3 h-3" />
                          <span>Threat Intel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats - Only for Admin */}
        {!isCitizen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {/* High Priority Alerts */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-lg p-4 shadow-lg shadow-red-500/5 hover:shadow-red-500/20 hover:border-red-500/40 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-red-400 text-2xl font-bold">
                  {alerts.filter(a => a.severity === 'high').length}
                </div>
                <div className="text-gray-400 text-sm">High Priority Alerts</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowStatsModal('high')}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded text-xs transition-colors flex items-center justify-center gap-1"
              >
                <BarChart3 className="w-3 h-3" />
                Details
              </button>
              <button
                onClick={() => downloadReport('high')}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded text-xs transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
            </div>
          </div>

          {/* Pending Actions */}
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-400/20 rounded-lg p-4 shadow-lg shadow-orange-500/5 hover:shadow-orange-500/20 hover:border-orange-400/40 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-orange-400 text-2xl font-bold">
                  {alerts.filter(a => a.status === 'pending').length}
                </div>
                <div className="text-gray-400 text-sm">Pending Actions</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowStatsModal('pending')}
                className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-2 py-1 rounded text-xs transition-colors flex items-center justify-center gap-1"
              >
                <BarChart3 className="w-3 h-3" />
                Details
              </button>
              <button
                onClick={() => downloadReport('pending')}
                className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-2 py-1 rounded text-xs transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
            </div>
          </div>

          {/* Units Dispatched */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-400/20 rounded-lg p-4 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/20 hover:border-emerald-400/40 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-emerald-400 text-2xl font-bold">
                  {alerts.filter(a => a.status === 'dispatched').length}
                </div>
                <div className="text-gray-400 text-sm">Units Dispatched</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowStatsModal('dispatched')}
                className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-2 py-1 rounded text-xs transition-colors flex items-center justify-center gap-1"
              >
                <BarChart3 className="w-3 h-3" />
                Details
              </button>
              <button
                onClick={() => downloadReport('dispatched')}
                className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-2 py-1 rounded text-xs transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
            </div>
          </div>

          {/* Avg Confidence */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-lg p-4 shadow-lg shadow-cyan-500/5 hover:shadow-cyan-500/20 hover:border-cyan-400/40 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-cyan-400 text-2xl font-bold">
                  {Math.round(alerts.reduce((acc, a) => acc + a.confidence, 0) / alerts.length * 100)}%
                </div>
                <div className="text-gray-400 text-sm">Avg Confidence</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowStatsModal('all')}
                className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-2 py-1 rounded text-xs transition-colors flex items-center justify-center gap-1"
              >
                <BarChart3 className="w-3 h-3" />
                Details
              </button>
              <button
                onClick={() => downloadReport('all')}
                className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-2 py-1 rounded text-xs transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Threat Intelligence Modal */}
      {showThreatIntel && selectedAlert && (
        <ThreatIntelligencePanel
          alertId={String(selectedAlert.id)}
          detectionType={selectedAlert.type}
          cameraId={selectedAlert.cameraId}
          onClose={() => {
            setShowThreatIntel(false);
            setSelectedAlert(null);
          }}
        />
      )}

      {/* Stats Detail Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-medium flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                {showStatsModal === 'high' && 'High Priority Alerts - Detailed Report'}
                {showStatsModal === 'pending' && 'Pending Actions - Detailed Report'}
                {showStatsModal === 'dispatched' && 'Dispatched Units - Detailed Report'}
                {showStatsModal === 'all' && 'All Alerts - Comprehensive Report'}
              </h3>
              <button 
                onClick={() => setShowStatsModal(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Total Count</div>
                  <div className="text-white text-2xl font-bold">
                    {showStatsModal === 'high' && alerts.filter(a => a.severity === 'high').length}
                    {showStatsModal === 'pending' && alerts.filter(a => a.status === 'pending').length}
                    {showStatsModal === 'dispatched' && alerts.filter(a => a.status === 'dispatched').length}
                    {showStatsModal === 'all' && alerts.length}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Avg Confidence</div>
                  <div className="text-white text-2xl font-bold">
                    {(() => {
                      let data = alerts;
                      if (showStatsModal === 'high') data = alerts.filter(a => a.severity === 'high');
                      if (showStatsModal === 'pending') data = alerts.filter(a => a.status === 'pending');
                      if (showStatsModal === 'dispatched') data = alerts.filter(a => a.status === 'dispatched');
                      return data.length > 0 
                        ? Math.round(data.reduce((acc, a) => acc + a.confidence, 0) / data.length * 100) + '%'
                        : '0%';
                    })()}
                  </div>
                </div>
              </div>

              {/* Alert Type Breakdown */}
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Alert Types Breakdown</h4>
                <div className="space-y-2">
                  {(() => {
                    let data = alerts;
                    if (showStatsModal === 'high') data = alerts.filter(a => a.severity === 'high');
                    if (showStatsModal === 'pending') data = alerts.filter(a => a.status === 'pending');
                    if (showStatsModal === 'dispatched') data = alerts.filter(a => a.status === 'dispatched');
                    
                    const typeCounts = data.reduce((acc: any, alert) => {
                      acc[alert.type] = (acc[alert.type] || 0) + 1;
                      return acc;
                    }, {});

                    return Object.entries(typeCounts).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                        <span className="text-gray-300">{type}</span>
                        <span className="text-white font-medium">{count as number}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Recent Alerts List */}
              <div>
                <h4 className="text-white font-medium mb-3">Recent Alerts</h4>
                <div className="space-y-2">
                  {(() => {
                    let data = alerts;
                    if (showStatsModal === 'high') data = alerts.filter(a => a.severity === 'high');
                    if (showStatsModal === 'pending') data = alerts.filter(a => a.status === 'pending');
                    if (showStatsModal === 'dispatched') data = alerts.filter(a => a.status === 'dispatched');
                    
                    return data.slice(0, 5).map(alert => (
                      <div key={alert.id} className="bg-gray-800 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-white font-medium">{alert.type}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <div className="text-gray-400 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {alert.location}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">{alert.timestamp}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  downloadReport(showStatsModal);
                  setShowStatsModal(null);
                }}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Full Report
              </button>
              <button
                onClick={() => setShowStatsModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
