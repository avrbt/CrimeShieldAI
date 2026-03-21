import React, { useState } from 'react';
import { Video, Search, Download, Eye, Calendar, Filter, Clock, Tag, FileText, X, FileArchive, FileBarChart } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

interface EvidenceSectionProps {
  fullView?: boolean;
  autoCapturedEvidence?: any[];
  onDeleteEvidence?: (evidenceId: number) => void;
}

export function EvidenceSection({ fullView = false, autoCapturedEvidence = [], onDeleteEvidence }: EvidenceSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedClip, setSelectedClip] = useState<any>(null);

  // Handler functions for quick actions
  const handleExportEvidence = () => {
    toast.success('Evidence Export Started', {
      description: 'Preparing all evidence files for download. This may take a few minutes.',
      duration: 3000,
    });
    // Simulate export delay
    setTimeout(() => {
      toast.success('Export Complete', {
        description: 'All evidence files have been exported successfully.',
        duration: 3000,
      });
      // Simulate download
      const link = document.createElement('a');
      link.href = '#';
      link.download = `evidence_export_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 2000);
  };

  const handleGenerateReport = () => {
    toast.success('Report Generation Started', {
      description: 'Generating comprehensive evidence report with AI analysis.',
      duration: 3000,
    });
    // Simulate report generation
    setTimeout(() => {
      setShowReportModal(true);
      toast.success('Report Generated', {
        description: 'Evidence report is ready to view.',
        duration: 3000,
      });
    }, 2500);
  };

  const handleArchiveFiles = () => {
    toast.success('Archiving Process Started', {
      description: 'Moving old files to secure archive storage.',
      duration: 3000,
    });
    // Simulate archiving
    setTimeout(() => {
      setShowArchiveModal(true);
      toast.success('Files Archived', {
        description: '124 files have been archived successfully. Storage freed: 1.2 TB',
        duration: 3000,
      });
    }, 3000);
  };

  // Handle clip download
  const handleDownloadClip = (clip: any) => {
    toast.success('Download Started', {
      description: `Downloading ${clip.title} (${clip.size})`,
      duration: 2000,
    });
    // Simulate download
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = '#';
      link.download = `${clip.title.replace(/\s+/g, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download Complete', {
        description: `${clip.title} downloaded successfully.`,
      });
    }, 1000);
  };

  // Handle clip view
  const handleViewClip = (clip: any) => {
    setSelectedClip(clip);
    toast.info('Opening Evidence Clip', {
      description: `Loading ${clip.title}...`,
      duration: 1500,
    });
  };

  // Handle clip delete
  const handleDeleteClip = (clip: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering view action
    
    if (window.confirm(`Are you sure you want to delete "${clip.title}"?`)) {
      if (onDeleteEvidence) {
        onDeleteEvidence(clip.id);
        toast.success('Evidence Deleted', {
          description: `${clip.title} has been removed successfully.`,
          duration: 2000,
        });
      }
    }
  };

  // Archive files data
  const archivedFiles = [
    { id: 1, name: 'Weapon_Detection_Main_St_2024-01-01.mp4', date: '2024-01-01', size: '15.2 MB', type: 'weapon' },
    { id: 2, name: 'Face_Recognition_Airport_2024-01-02.mp4', date: '2024-01-02', size: '8.7 MB', type: 'face' },
    { id: 3, name: 'Crowd_Anomaly_Mall_2024-01-03.mp4', date: '2024-01-03', size: '22.4 MB', type: 'crowd' },
  ];

  // Remove dummy evidence - only show real auto-captured evidence
  const evidenceClips: any[] = [];

  const eventHistory = [
    { date: '2024-01-07', events: 24, type: 'Mixed detections' },
    { date: '2024-01-06', events: 18, type: 'Behavioral anomalies' },
    { date: '2024-01-05', events: 31, type: 'Crowd monitoring' },
    { date: '2024-01-04', events: 15, type: 'Vehicle tracking' },
    { date: '2024-01-03', events: 22, type: 'Face recognition' }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'weapon': return 'text-[#FF6EC7] bg-[#FF6EC7]/20';
      case 'face': return 'text-blue-400 bg-blue-400/20';
      case 'crowd': return 'text-orange-400 bg-orange-400/20';
      case 'behavior': return 'text-yellow-400 bg-yellow-400/20';
      case 'vehicle': return 'text-purple-400 bg-purple-400/20';
      case 'object': return 'text-[#3BE39C] bg-[#3BE39C]/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  // Merge auto-captured evidence with static evidence
  const allEvidence = [...autoCapturedEvidence, ...evidenceClips];

  const filteredClips = allEvidence.filter(clip => {
    const matchesSearch = clip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clip.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clip.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Special filter for auto-captured evidence
    if (filterType === 'auto-captured') {
      return matchesSearch && clip.autoCapture === true;
    }
    
    const matchesType = filterType === 'all' || clip.type === filterType;
    return matchesSearch && matchesType;
  });

  const displayClips = fullView ? filteredClips : filteredClips.slice(0, 6);

  return (
    <section className="bg-[#0B1D3A] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#3BE39C]/20 rounded-lg">
              <Video className="w-6 h-6 text-[#3BE39C]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                Evidence & Event Archive
                {autoCapturedEvidence.length > 0 && (
                  <span className="text-base bg-blue-500 text-white px-3 py-1 rounded-full animate-pulse">
                    📸 {autoCapturedEvidence.length} New
                  </span>
                )}
              </h2>
              <p className="text-gray-400">
                Auto-generated evidence clips and event history
                {autoCapturedEvidence.length > 0 && (
                  <span className="text-blue-400 ml-2">• {autoCapturedEvidence.length} auto-captured today</span>
                )}
              </p>
            </div>
          </div>
          
          {/* Date Range Picker */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, location, or crime type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#3BE39C] transition-colors"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="auto-captured">📸 Auto-Captured Only</option>
                <option value="weapon">Weapon Detection</option>
                <option value="face">Face Recognition</option>
                <option value="crowd">Crowd Anomaly</option>
                <option value="behavior">Behavioral</option>
                <option value="vehicle">Vehicle</option>
                <option value="object">Object Detection</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Evidence Clips */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-medium mb-4">Auto-Generated Evidence Clips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayClips.map((clip) => (
                <div key={clip.id} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden hover:bg-white/5 transition-all duration-300">
                  {/* Thumbnail */}
                  <div 
                    className="relative aspect-video bg-black group cursor-pointer" 
                    onClick={() => handleViewClip(clip)}
                  >
                    <ImageWithFallback 
                      src={clip.thumbnail}
                      alt={clip.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-[#3BE39C] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#3BE39C]/80 transition-colors">
                        <Video className="w-6 h-6 text-white ml-0.5" />
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {clip.duration}
                    </div>

                    {/* Type Badge */}
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${getTypeColor(clip.type)}`}>
                      {clip.type.toUpperCase()}
                    </div>

                    {/* Auto-Capture Badge */}
                    {clip.autoCapture && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-blue-500/80 text-white">
                        AUTO-CAPTURED
                      </div>
                    )}
                  </div>

                  {/* Clip Info */}
                  <div className="p-4">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      {clip.title}
                      {clip.autoCapture && (
                        <span className="text-blue-400 text-xs">📸</span>
                      )}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>Location:</span>
                        <span className="text-gray-300">{clip.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Camera:</span>
                        <span className="text-gray-300 font-mono">{clip.cameraId}</span>
                      </div>
                      {clip.feedId && (
                        <div className="flex items-center justify-between">
                          <span>Feed ID:</span>
                          <span className="text-blue-400 font-mono font-bold">#{clip.feedId}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Time:</span>
                        <span className="text-gray-300">{clip.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Size:</span>
                        <span className="text-gray-300">{clip.size}</span>
                      </div>
                    </div>

                    {/* Detection Details for Auto-Captured Evidence */}
                    {clip.detectionDetails && clip.detectionDetails.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="text-sm text-gray-400 mb-2">Detection Details:</div>
                        <div className="space-y-1">
                          {clip.detectionDetails.map((det: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-gray-300">{det.class}</span>
                              <span className="text-[#FF6EC7]">{det.confidence}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {clip.tags.map((tag, idx) => (
                        <span key={idx} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs flex items-center">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-400">
                        Confidence: <span className="text-[#3BE39C]">{Math.round(clip.confidence * 100)}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewClip(clip)}
                          className="text-[#3BE39C] hover:text-[#3BE39C]/80 transition-colors p-2 hover:bg-[#3BE39C]/10 rounded"
                          title="View Evidence"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDownloadClip(clip)}
                          className="text-[#3BE39C] hover:text-[#3BE39C]/80 transition-colors p-2 hover:bg-[#3BE39C]/10 rounded"
                          title="Download Evidence"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteClip(clip, e)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-400/10 rounded"
                          title="Delete Evidence"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event History Sidebar */}
          <div className="space-y-6">
            {/* Event History */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-[#3BE39C]" />
                Event History
              </h3>
              <div className="space-y-4">
                {eventHistory.map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm">{day.date}</div>
                      <div className="text-gray-400 text-xs">{day.type}</div>
                    </div>
                    <div className="text-[#3BE39C] font-medium">{day.events} events</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Stats */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Storage Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Total Evidence</span>
                  <span className="text-white font-medium">{allEvidence.length} clips</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Auto-Captured</span>
                  <span className="text-blue-400 font-medium">{autoCapturedEvidence.length} clips</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Storage Used</span>
                  <span className="text-white font-medium">2.4 TB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Available</span>
                  <span className="text-[#3BE39C] font-medium">7.6 TB</span>
                </div>
                
                {/* Storage Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                  <div className="bg-[#3BE39C] h-2 rounded-full" style={{ width: '24%' }}></div>
                </div>
                <div className="text-xs text-gray-400 text-center">24% used</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleExportEvidence}
                  className="w-full bg-[#3BE39C]/20 text-[#3BE39C] hover:bg-[#3BE39C]/30 py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export All Evidence
                </button>
                <button 
                  onClick={handleGenerateReport}
                  className="w-full bg-[#FF6EC7]/20 text-[#FF6EC7] hover:bg-[#FF6EC7]/30 py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate Report
                </button>
                <button 
                  onClick={handleArchiveFiles}
                  className="w-full bg-gray-700 text-gray-300 hover:bg-gray-600 py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Archive Old Files
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0B1D3A] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#0B1D3A] border-b border-gray-700 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FF6EC7]/20 rounded-lg">
                    <FileBarChart className="w-6 h-6 text-[#FF6EC7]" />
                  </div>
                  <div>
                    <h3 className="text-xl text-white">Evidence Analysis Report</h3>
                    <p className="text-gray-400 text-sm">Generated on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl text-[#3BE39C] mb-1">247</div>
                    <div className="text-gray-400 text-sm">Total Evidence</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl text-[#FF6EC7] mb-1">23</div>
                    <div className="text-gray-400 text-sm">High Priority</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl text-blue-400 mb-1">94%</div>
                    <div className="text-gray-400 text-sm">Avg Confidence</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl text-orange-400 mb-1">2.4 TB</div>
                    <div className="text-gray-400 text-sm">Storage Used</div>
                  </div>
                </div>

                {/* Detection Breakdown */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h4 className="text-white mb-4">Detection Type Breakdown</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Weapon Detection</span>
                        <span className="text-white">23 clips (9%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-[#FF6EC7] h-2 rounded-full" style={{ width: '9%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Face Recognition</span>
                        <span className="text-white">89 clips (36%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '36%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Crowd Anomaly</span>
                        <span className="text-white">67 clips (27%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-400 h-2 rounded-full" style={{ width: '27%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Behavioral Analysis</span>
                        <span className="text-white">45 clips (18%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '18%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Vehicle Tracking</span>
                        <span className="text-white">23 clips (10%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-400 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis Summary */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h4 className="text-white mb-4">AI Analysis Summary</h4>
                  <div className="space-y-3 text-gray-300 text-sm">
                    <p>• <span className="text-[#3BE39C]">High accuracy rate</span> of 94% across all detection types with minimal false positives.</p>
                    <p>• <span className="text-[#FF6EC7]">23 high-priority alerts</span> requiring immediate attention, including weapon detections and suspect identifications.</p>
                    <p>• <span className="text-blue-400">Peak detection hours</span> identified between 2 PM - 6 PM with increased crowd activity.</p>
                    <p>• <span className="text-orange-400">Geographic hotspots</span> detected at Main Street Intersection and Shopping Mall Entrance.</p>
                    <p>• <span className="text-yellow-400">Behavioral patterns</span> suggest coordinated surveillance needed for Central Park East area.</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h4 className="text-white mb-4">Recommendations</h4>
                  <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside">
                    <li>Increase camera coverage at identified hotspot locations</li>
                    <li>Deploy additional security personnel during peak detection hours</li>
                    <li>Archive evidence older than 90 days to optimize storage</li>
                    <li>Schedule preventive maintenance for cameras with detection gaps</li>
                    <li>Review and update AI models for improved accuracy</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      toast.success('Report Downloaded', {
                        description: 'Evidence analysis report saved to your downloads.',
                      });
                    }}
                    className="flex-1 bg-[#3BE39C]/20 text-[#3BE39C] hover:bg-[#3BE39C]/30 py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF Report
                  </button>
                  <button 
                    onClick={() => {
                      toast.success('Report Shared', {
                        description: 'Report link copied to clipboard.',
                      });
                    }}
                    className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 py-3 px-4 rounded-lg transition-colors font-medium"
                  >
                    Share Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archive Modal */}
        {showArchiveModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0B1D3A] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#0B1D3A] border-b border-gray-700 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <FileArchive className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-xl text-white">Archived Evidence Files</h3>
                    <p className="text-gray-400 text-sm">124 files archived • 1.2 TB storage freed</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowArchiveModal(false)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">File Name</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Size</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {archivedFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-white font-mono">{file.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${getTypeColor(file.type)}`}>
                              {file.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">{file.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{file.size}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  toast.success('Restoring File', {
                                    description: `${file.name} is being restored from archive.`,
                                  });
                                }}
                                className="text-[#3BE39C] hover:text-[#3BE39C]/80 text-sm"
                              >
                                Restore
                              </button>
                              <span className="text-gray-600">|</span>
                              <button 
                                onClick={() => {
                                  toast.error('File Deleted', {
                                    description: `${file.name} permanently deleted from archive.`,
                                  });
                                }}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Archive Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl text-[#3BE39C] mb-1">124</div>
                    <div className="text-gray-400 text-sm">Files Archived</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl text-blue-400 mb-1">1.2 TB</div>
                    <div className="text-gray-400 text-sm">Storage Freed</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl text-orange-400 mb-1">90+ days</div>
                    <div className="text-gray-400 text-sm">Age Threshold</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => {
                      toast.success('Restoring All Files', {
                        description: 'All archived files are being restored.',
                      });
                    }}
                    className="flex-1 bg-[#3BE39C]/20 text-[#3BE39C] hover:bg-[#3BE39C]/30 py-3 px-4 rounded-lg transition-colors font-medium"
                  >
                    Restore All
                  </button>
                  <button 
                    onClick={() => {
                      toast.error('Deleting All Archives', {
                        description: 'All archived files will be permanently deleted.',
                      });
                    }}
                    className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-3 px-4 rounded-lg transition-colors font-medium"
                  >
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Clip Modal */}
        {selectedClip && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0B1D3A] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#0B1D3A] border-b border-gray-700 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(selectedClip.type)}`}>
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl text-white">{selectedClip.title}</h3>
                    <p className="text-gray-400 text-sm">{selectedClip.location} • {selectedClip.timestamp}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedClip(null)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Video Player */}
              <div className="p-6">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  <ImageWithFallback 
                    src={selectedClip.thumbnail}
                    alt={selectedClip.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Clip Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Camera ID</div>
                    <div className="text-white font-mono">{selectedClip.cameraId}</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Confidence</div>
                    <div className="text-[#3BE39C]">{Math.round(selectedClip.confidence * 100)}%</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">File Size</div>
                    <div className="text-white">{selectedClip.size}</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Duration</div>
                    <div className="text-white">{selectedClip.duration}</div>
                  </div>
                </div>

                {/* Detection Details for Auto-Captured Evidence */}
                {selectedClip.detectionDetails && selectedClip.detectionDetails.length > 0 && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
                    <div className="text-white font-medium mb-3">Detection Details</div>
                    <div className="space-y-2">
                      {selectedClip.detectionDetails.map((det: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-gray-300">
                            {det.class.charAt(0).toUpperCase() + det.class.slice(1)}
                          </span>
                          <span className="text-[#FF6EC7] font-medium">{det.confidence}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="mb-4">
                  <div className="text-gray-400 text-sm mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedClip.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleDownloadClip(selectedClip)}
                    className="flex-1 bg-[#3BE39C]/20 text-[#3BE39C] hover:bg-[#3BE39C]/30 py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Evidence
                  </button>
                  <button 
                    onClick={() => {
                      toast.success('Evidence Shared', {
                        description: 'Share link copied to clipboard.',
                      });
                    }}
                    className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 py-3 px-4 rounded-lg transition-colors font-medium"
                  >
                    Share Evidence
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}