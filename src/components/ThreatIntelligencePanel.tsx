import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Globe, Server, Activity, X, Loader2, Radio, Volume2 } from 'lucide-react';
import { generateThreatReport, ThreatIntelligenceReport } from '../utils/threatIntelligence';
import { alarmSystem } from '../utils/alarmSystem';
import { Button } from './ui/button';

interface ThreatIntelligencePanelProps {
  alertId: string;
  detectionType: string;
  cameraId?: string;
  sourceIp?: string;
  onClose: () => void;
}

export function ThreatIntelligencePanel({ alertId, detectionType, cameraId, sourceIp, onClose }: ThreatIntelligencePanelProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ThreatIntelligenceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alarmTriggered, setAlarmTriggered] = useState(false);

  useEffect(() => {
    loadThreatIntelligence();
  }, [alertId]);

  const loadThreatIntelligence = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateThreatReport(alertId, detectionType, sourceIp);
      setReport(data);
      
      // Trigger alarm if necessary
      if (data.shouldTriggerAlarm && !alarmTriggered) {
        setAlarmTriggered(true);
        if (data.threatLevel === 'critical') {
          alarmSystem.triggerAlarm('critical', { duration: 8000, pattern: 'rapid' });
        } else if (data.threatLevel === 'high') {
          alarmSystem.triggerAlarm('weapon', { duration: 6000, pattern: 'continuous' });
        } else {
          alarmSystem.triggerAlarm('warning', { duration: 4000, pattern: 'pulse' });
        }
      }
    } catch (err) {
      setError('Failed to fetch threat intelligence data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'high': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      case 'medium': return 'text-amber-400 bg-amber-400/20 border-amber-400/30';
      case 'low': return 'text-cyan-400 bg-cyan-400/20 border-cyan-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1F2E] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1A1F2E] border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Threat Intelligence Report</h2>
              <p className="text-sm text-gray-400">
                {cameraId && `Camera: ${cameraId} • `}
                Alert: {alertId}
                {detectionType && ` • Type: ${detectionType}`}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
              <p className="text-gray-400">Analyzing threat intelligence...</p>
              <p className="text-sm text-gray-500 mt-2">Querying VirusTotal and AbuseIPDB</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-sm text-gray-400">{error}</p>
              </div>
            </div>
          )}

          {report && !loading && (
            <div className="space-y-6">
              {/* Overall Threat Assessment */}
              <div className={`border rounded-xl p-6 ${getThreatColor(report.threatLevel)}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Overall Threat Level</h3>
                    <p className="text-sm opacity-80">{report.recommendation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.shouldTriggerAlarm && (
                      <Volume2 className="w-5 h-5 animate-pulse" />
                    )}
                    <span className="px-3 py-1 rounded-full border font-medium uppercase text-sm">
                      {report.threatLevel}
                    </span>
                  </div>
                </div>
                {report.shouldTriggerAlarm && (
                  <div className="bg-black/20 rounded-lg p-3 mt-3 flex items-center gap-2">
                    <Radio className="w-4 h-4 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium">🚨 Alarm Activated</p>
                      <p className="text-xs mt-1 opacity-80">Security personnel have been notified. Immediate response initiated.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* VirusTotal Results */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg shadow-lg shadow-blue-500/20">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">VirusTotal Analysis</h3>
                    <p className="text-xs text-gray-400">Scan ID: {report.virusTotal.scanId}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Threat Detection Score</span>
                    <span className={`font-bold ${
                      report.virusTotal.malicious ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {report.virusTotal.positives}/{report.virusTotal.total} ({Math.round(report.virusTotal.threatScore)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        report.virusTotal.malicious ? 'bg-red-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${report.virusTotal.threatScore}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-medium ${report.virusTotal.malicious ? 'text-red-400' : 'text-emerald-400'}`}>
                      {report.virusTotal.malicious ? 'MALICIOUS' : 'CLEAN'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Scan Date:</span>
                    <span className="text-white text-xs">{new Date(report.virusTotal.scanDate).toLocaleString()}</span>
                  </div>
                </div>

                {report.virusTotal.vendors.length > 0 && (
                  <div className="pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-3">Detection Results by Security Vendors:</p>
                    <div className="grid md:grid-cols-2 gap-2">
                      {report.virusTotal.vendors.map((vendor, idx) => (
                        <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded ${
                          vendor.detected ? 'bg-red-500/10 border border-red-500/20' : 'bg-gray-800/50'
                        }`}>
                          <span className="text-sm text-white">{vendor.name}</span>
                          {vendor.detected ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-400">{vendor.result}</span>
                              <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Clean</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AbuseIPDB Results */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg shadow-lg shadow-purple-500/20">
                    <Server className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">AbuseIPDB Analysis</h3>
                    <p className="text-xs text-gray-400">IP: {report.abuseIPDB.ipAddress}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Abuse Confidence Score</span>
                    <span className={`font-bold ${
                      report.abuseIPDB.abuseConfidenceScore > 80 ? 'text-red-400' :
                      report.abuseIPDB.abuseConfidenceScore > 60 ? 'text-orange-400' :
                      report.abuseIPDB.abuseConfidenceScore > 40 ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {report.abuseIPDB.abuseConfidenceScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        report.abuseIPDB.abuseConfidenceScore > 80 ? 'bg-red-400' :
                        report.abuseIPDB.abuseConfidenceScore > 60 ? 'bg-orange-400' :
                        report.abuseIPDB.abuseConfidenceScore > 40 ? 'bg-amber-400' :
                        'bg-emerald-400'
                      }`}
                      style={{ width: `${report.abuseIPDB.abuseConfidenceScore}%` }}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Total Reports:</span>
                      <span className="text-white font-medium">{report.abuseIPDB.totalReports}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Country:</span>
                      <span className="text-white">{report.abuseIPDB.countryCode}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Usage Type:</span>
                      <span className="text-white text-xs">{report.abuseIPDB.usageType}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">ISP:</span>
                      <span className="text-white text-xs">{report.abuseIPDB.isp}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Domain:</span>
                      <span className="text-white text-xs">{report.abuseIPDB.domain}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Tor Exit Node:</span>
                      <span className={report.abuseIPDB.isTor ? 'text-red-400' : 'text-emerald-400'}>
                        {report.abuseIPDB.isTor ? 'Yes ⚠️' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-3 border-t border-gray-700">
                  Last Reported: {new Date(report.abuseIPDB.lastReportedAt).toLocaleString()}
                </div>
              </div>

              {/* Timestamp & Actions */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  <span>Report Generated: {new Date(report.timestamp).toLocaleString()}</span>
                </div>
                <Button onClick={loadThreatIntelligence} variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                  Refresh Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
