import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  ShoppingBag,
  Slash,
  UserX,
  Swords,
  Lock,
  Package,
  Users,
  Hammer,
  Search,
  BarChart3,
  X,
  TrendingUp,
  AlertTriangle,
  Eye,
  Activity,
  Crosshair,
  MousePointerClick,
  Info,
} from 'lucide-react';
import { Card } from './ui/card';
import { toast } from 'sonner@2.0.3';

// Behavior category definitions
interface BehaviorCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  riskLevel: 'high' | 'medium' | 'low';
  color: string;
  bgGradient: string;
  detectionCount: number;
  confidence: number;
  diagramDescription: string;
  keyIndicators: string[];
  posePoints: { x: number; y: number; label: string }[];
  detectionTechniques: string[];
}

const behaviorCategories: BehaviorCategory[] = [
  {
    id: 'theft',
    name: 'Theft',
    icon: ShoppingBag,
    description: 'Person taking bag or valuable items',
    riskLevel: 'high',
    color: 'text-red-400',
    bgGradient: 'from-red-500/20 to-orange-500/10',
    detectionCount: 127,
    confidence: 94.2,
    diagramDescription: 'Pose estimation tracks hand movements toward objects, sudden grabbing motions, and rapid departure patterns.',
    keyIndicators: ['Rapid hand movement', 'Object displacement', 'Quick exit pattern', 'Suspicious loitering before action'],
    posePoints: [
      { x: 0.3, y: 0.5, label: 'Hand' },
      { x: 0.4, y: 0.6, label: 'Object' },
      { x: 0.5, y: 0.7, label: 'Exit' },
    ],
    detectionTechniques: ['Pose Estimation', 'Object Tracking', 'Motion Analysis', 'Behavior Pattern Recognition'],
  },
  {
    id: 'murder',
    name: 'Weapon Detection',
    icon: Slash,
    description: 'Dangerous weapon (knife/gun) detected',
    riskLevel: 'high',
    color: 'text-red-500',
    bgGradient: 'from-red-600/20 to-red-400/10',
    detectionCount: 23,
    confidence: 98.7,
    diagramDescription: 'YOLO model identifies weapon shape in hand, tracks threatening gestures, and monitors proximity to potential victims.',
    keyIndicators: ['Weapon in hand', 'Aggressive posture', 'Threatening gestures', 'Target proximity'],
    posePoints: [
      { x: 0.7, y: 0.4, label: 'Weapon' },
      { x: 0.5, y: 0.3, label: 'Hand' },
      { x: 0.4, y: 0.6, label: 'Target' },
    ],
    detectionTechniques: ['YOLO Model', 'Weapon Classification', 'Pose Analysis', 'Threat Assessment'],
  },
  {
    id: 'loitering',
    name: 'Loitering',
    icon: UserX,
    description: 'Person standing idle in restricted area',
    riskLevel: 'medium',
    color: 'text-orange-400',
    bgGradient: 'from-orange-500/20 to-yellow-500/10',
    detectionCount: 341,
    confidence: 87.5,
    diagramDescription: 'Tracks stationary duration, repeated visits to same location, and suspicious waiting patterns without clear purpose.',
    keyIndicators: ['Stationary > 5 minutes', 'Repeated location visits', 'No clear activity', 'Unusual time patterns'],
    posePoints: [
      { x: 0.5, y: 0.5, label: 'Person' },
      { x: 0.5, y: 0.8, label: 'Zone' },
    ],
    detectionTechniques: ['Time Tracking', 'Zone Monitoring', 'Behavior Analysis', 'Pattern Detection'],
  },
  {
    id: 'fight',
    name: 'Violence / Fight',
    icon: Swords,
    description: 'Physical altercation detected',
    riskLevel: 'high',
    color: 'text-red-400',
    bgGradient: 'from-red-500/20 to-pink-500/10',
    detectionCount: 89,
    confidence: 91.3,
    diagramDescription: 'Analyzes rapid body movements, close-quarter interactions, aggressive gestures, and impact detection through pose estimation.',
    keyIndicators: ['Rapid movement', 'Close proximity', 'Aggressive gestures', 'Impact detection'],
    posePoints: [
      { x: 0.3, y: 0.4, label: 'Person 1' },
      { x: 0.7, y: 0.4, label: 'Person 2' },
      { x: 0.5, y: 0.5, label: 'Contact' },
    ],
    detectionTechniques: ['Multi-Person Tracking', 'Impact Detection', 'Aggression Analysis', 'Motion Classification'],
  },
  {
    id: 'trespassing',
    name: 'Trespassing',
    icon: Lock,
    description: 'Unauthorized entry into forbidden zone',
    riskLevel: 'high',
    color: 'text-orange-500',
    bgGradient: 'from-orange-500/20 to-red-500/10',
    detectionCount: 156,
    confidence: 89.8,
    diagramDescription: 'Monitors restricted zone boundaries, tracks entry points, and detects unauthorized access attempts using geofencing.',
    keyIndicators: ['Boundary violation', 'Unauthorized entry', 'Bypassing security', 'Restricted zone access'],
    posePoints: [
      { x: 0.4, y: 0.5, label: 'Entry Point' },
      { x: 0.6, y: 0.5, label: 'Person' },
    ],
    detectionTechniques: ['Geofencing', 'Boundary Detection', 'Access Control', 'Path Tracking'],
  },
  {
    id: 'suspicious-object',
    name: 'Suspicious Object',
    icon: Package,
    description: 'Unattended bag or package detected',
    riskLevel: 'high',
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-500/20 to-orange-500/10',
    detectionCount: 67,
    confidence: 93.1,
    diagramDescription: 'Identifies abandoned objects, tracks owner separation duration, and monitors suspicious placement patterns.',
    keyIndicators: ['Unattended duration', 'Unusual placement', 'No nearby owner', 'Public area location'],
    posePoints: [
      { x: 0.5, y: 0.6, label: 'Object' },
      { x: 0.3, y: 0.4, label: 'Last Owner' },
    ],
    detectionTechniques: ['Object Detection', 'Ownership Tracking', 'Time Monitoring', 'Abandonment Analysis'],
  },
  {
    id: 'crowd-aggression',
    name: 'Crowd Aggression',
    icon: Users,
    description: 'Aggressive crowd behavior',
    riskLevel: 'medium',
    color: 'text-orange-400',
    bgGradient: 'from-orange-400/20 to-red-400/10',
    detectionCount: 45,
    confidence: 86.4,
    diagramDescription: 'Analyzes crowd density, movement patterns, aggression indicators, and collective behavior anomalies.',
    keyIndicators: ['High crowd density', 'Chaotic movement', 'Aggressive behavior', 'Collective agitation'],
    posePoints: [
      { x: 0.3, y: 0.4, label: 'Group 1' },
      { x: 0.7, y: 0.4, label: 'Group 2' },
      { x: 0.5, y: 0.6, label: 'Center' },
    ],
    detectionTechniques: ['Crowd Density Analysis', 'Flow Detection', 'Aggression Metrics', 'Mass Behavior AI'],
  },
  {
    id: 'vandalism',
    name: 'Vandalism',
    icon: Hammer,
    description: 'Property damage or graffiti',
    riskLevel: 'medium',
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-400/20 to-orange-400/10',
    detectionCount: 112,
    confidence: 88.9,
    diagramDescription: 'Detects spray painting motions, destructive actions, and unauthorized modifications to property surfaces.',
    keyIndicators: ['Spray motion detected', 'Surface interaction', 'Tool in hand', 'Unauthorized modification'],
    posePoints: [
      { x: 0.5, y: 0.4, label: 'Person' },
      { x: 0.6, y: 0.5, label: 'Tool' },
      { x: 0.4, y: 0.6, label: 'Surface' },
    ],
    detectionTechniques: ['Action Recognition', 'Tool Detection', 'Surface Analysis', 'Damage Assessment'],
  },
];

interface BehaviorAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BehaviorAnalysisModal({ isOpen, onClose }: BehaviorAnalysisModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBehavior, setSelectedBehavior] = useState<BehaviorCategory | null>(null);

  // Filter categories based on search
  const filteredCategories = behaviorCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get risk color
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Handle clickable sections
  const handleDetectionClick = (behavior: BehaviorCategory) => {
    toast.success(`${behavior.name} Detection Data`, {
      description: `Total detections in last 30 days: ${behavior.detectionCount}. Showing detailed breakdown...`,
    });
  };

  const handleConfidenceClick = (behavior: BehaviorCategory) => {
    toast.info(`${behavior.name} Confidence Score`, {
      description: `Average confidence: ${behavior.confidence}%. Model accuracy is continuously improving.`,
    });
  };

  const handleIndicatorClick = (indicator: string, behavior: BehaviorCategory) => {
    toast(`Key Indicator: ${indicator}`, {
      description: `This indicator is crucial for detecting ${behavior.name.toLowerCase()} behavior patterns.`,
    });
  };

  const handleTechniqueClick = (technique: string) => {
    toast.info(`AI Technique: ${technique}`, {
      description: `This technique uses advanced machine learning algorithms for real-time analysis.`,
    });
  };

  const handlePoseEstimationClick = (behavior: BehaviorCategory) => {
    toast.success('Pose Estimation Analysis', {
      description: `Tracking ${behavior.posePoints.length} key body points for ${behavior.name.toLowerCase()} detection.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-gradient-to-br from-[#1A1F2E] to-[#0F1419] border-gray-700 text-white p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/30">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                Behavior Analysis Dashboard
              </DialogTitle>
              <DialogDescription className="text-gray-300 mt-2 flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-purple-400" />
                AI-powered detection system - Click on any section for details
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Filter by behavior type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0F1419] border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-500"
            />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <AnimatePresence mode="wait">
            {selectedBehavior ? (
              // Detailed View
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => setSelectedBehavior(null)}
                  className="mb-4 text-gray-400 hover:text-white"
                >
                  ← Back to all behaviors
                </Button>

                <Card className="bg-gradient-to-br from-[#1A1F2E] to-[#0F1419] border-gray-700 p-6 shadow-xl">
                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className={`p-4 bg-gradient-to-br ${selectedBehavior.bgGradient} rounded-2xl shadow-lg`}>
                      <selectedBehavior.icon className="w-12 h-12 text-white" />
                    </div>

                    {/* Header Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl text-white">{selectedBehavior.name}</h3>
                        <Badge className={`${getRiskColor(selectedBehavior.riskLevel)} border capitalize`}>
                          {selectedBehavior.riskLevel} Risk
                        </Badge>
                      </div>
                      <p className="text-gray-300 mb-4">{selectedBehavior.description}</p>

                      {/* Statistics - CLICKABLE */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDetectionClick(selectedBehavior)}
                          className="bg-gradient-to-br from-[#0F1419] to-gray-900 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-purple-500/50 transition-all shadow-lg hover:shadow-purple-500/20"
                        >
                          <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">Detections (30d)</span>
                            <MousePointerClick className="w-3 h-3 ml-auto text-purple-400" />
                          </div>
                          <p className="text-3xl text-white">{selectedBehavior.detectionCount}</p>
                          <p className="text-xs text-purple-400 mt-1">Click for breakdown</p>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleConfidenceClick(selectedBehavior)}
                          className="bg-gradient-to-br from-[#0F1419] to-gray-900 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-green-500/50 transition-all shadow-lg hover:shadow-green-500/20"
                        >
                          <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">Avg. Confidence</span>
                            <MousePointerClick className="w-3 h-3 ml-auto text-green-400" />
                          </div>
                          <p className="text-3xl text-white">{selectedBehavior.confidence}%</p>
                          <p className="text-xs text-green-400 mt-1">Click for analysis</p>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Detection Method */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/30">
                    <h4 className="flex items-center gap-2 text-lg mb-3 text-white">
                      <AlertTriangle className="w-5 h-5 text-blue-400" />
                      Detection Method
                    </h4>
                    <p className="text-gray-300 leading-relaxed">{selectedBehavior.diagramDescription}</p>
                  </div>

                  {/* Key Indicators - CLICKABLE */}
                  <div className="mt-6">
                    <h4 className="text-lg mb-3 flex items-center gap-2 text-white">
                      Key Detection Indicators
                      <Info className="w-4 h-4 text-gray-400" />
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedBehavior.keyIndicators.map((indicator, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.03, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleIndicatorClick(indicator, selectedBehavior)}
                          className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-800/50 to-gray-900/30 rounded-lg border border-gray-700 cursor-pointer hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                        >
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                          <span className="text-gray-300 text-sm flex-1">{indicator}</span>
                          <MousePointerClick className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Detection Techniques - CLICKABLE */}
                  <div className="mt-6">
                    <h4 className="text-lg mb-3 flex items-center gap-2 text-white">
                      AI Detection Techniques
                      <Info className="w-4 h-4 text-gray-400" />
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedBehavior.detectionTechniques.map((technique, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.4 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTechniqueClick(technique)}
                          className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30 cursor-pointer hover:border-pink-500/50 transition-all hover:shadow-lg hover:shadow-pink-500/20"
                        >
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Activity className="w-5 h-5 text-purple-400" />
                          </div>
                          <span className="text-white flex-1">{technique}</span>
                          <MousePointerClick className="w-4 h-4 text-pink-400" />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Pose Estimation Diagram - CLICKABLE */}
                  <motion.div
                    className="mt-6 bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-xl border border-gray-700 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/20"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handlePoseEstimationClick(selectedBehavior)}
                  >
                    <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crosshair className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-white">Pose Estimation Analysis</span>
                        </div>
                        <MousePointerClick className="w-4 h-4 text-purple-400" />
                      </div>
                    </div>
                    <div className="relative aspect-video bg-gradient-to-br from-gray-900/50 to-purple-900/20 p-6">
                      {/* Skeletal Visualization */}
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                        {/* Body outline */}
                        <motion.circle
                          cx="50"
                          cy="20"
                          r="8"
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="1.5"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        />
                        {/* Skeleton lines */}
                        <motion.line
                          x1="50"
                          y1="28"
                          x2="50"
                          y2="50"
                          stroke="#8B5CF6"
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                        />
                        <motion.line
                          x1="50"
                          y1="35"
                          x2="30"
                          y2="50"
                          stroke="#8B5CF6"
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        />
                        <motion.line
                          x1="50"
                          y1="35"
                          x2="70"
                          y2="50"
                          stroke="#8B5CF6"
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        />
                        <motion.line
                          x1="50"
                          y1="50"
                          x2="40"
                          y2="75"
                          stroke="#8B5CF6"
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.6 }}
                        />
                        <motion.line
                          x1="50"
                          y1="50"
                          x2="60"
                          y2="75"
                          stroke="#8B5CF6"
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.6 }}
                        />
                        <motion.line
                          x1="40"
                          y1="75"
                          x2="35"
                          y2="95"
                          stroke="#8B5CF6"
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                        />
                        <motion.line
                          x1="60"
                          y1="75"
                          x2="65"
                          y2="95"
                          stroke="#8B5CF6"
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                        />
                        
                        {/* Key points */}
                        {selectedBehavior.posePoints.map((point, index) => (
                          <motion.g key={index}>
                            <motion.circle
                              cx={point.x * 100}
                              cy={point.y * 100}
                              r="4"
                              fill="#EC4899"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                            />
                            <motion.circle
                              cx={point.x * 100}
                              cy={point.y * 100}
                              r="8"
                              fill="none"
                              stroke="#EC4899"
                              strokeWidth="1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 0.5, 0] }}
                              transition={{ duration: 2, delay: 1 + index * 0.1, repeat: Infinity }}
                            />
                          </motion.g>
                        ))}
                      </svg>
                      
                      {/* Detection indicators */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="p-3 bg-gradient-to-r from-purple-900/80 to-pink-900/80 rounded-lg border border-purple-500/30 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Crosshair className="w-4 h-4 text-purple-400" />
                              <span className="text-xs text-white">{selectedBehavior.posePoints.length} keypoints tracked</span>
                            </div>
                            <span className="text-xs text-purple-300">Click for full analysis</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Card>
              </motion.div>
            ) : (
              // Grid View
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {filteredCategories.map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        onClick={() => setSelectedBehavior(category)}
                        className={`bg-gradient-to-br ${category.bgGradient} border-gray-700 p-5 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-500 group relative overflow-hidden`}
                      >
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300" />
                        
                        {/* Icon */}
                        <div className="relative flex items-center justify-center w-14 h-14 bg-[#0F1419] rounded-xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg">
                          <Icon className={`w-7 h-7 ${category.color}`} />
                        </div>

                        {/* Title */}
                        <h3 className="relative text-white mb-2 group-hover:text-purple-200 transition-colors">{category.name}</h3>

                        {/* Description */}
                        <p className="relative text-gray-400 text-sm mb-3 line-clamp-2">
                          {category.description}
                        </p>

                        {/* Stats */}
                        <div className="relative flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-400">Detections</span>
                          <span className="text-sm text-white font-medium">{category.detectionCount}</span>
                        </div>

                        {/* Risk Badge */}
                        <Badge className={`relative ${getRiskColor(category.riskLevel)} border capitalize w-full justify-center group-hover:scale-105 transition-transform`}>
                          {category.riskLevel} Risk
                        </Badge>
                        
                        {/* Click indicator */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MousePointerClick className="w-4 h-4 text-purple-400" />
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* No Results */}
          {filteredCategories.length === 0 && !selectedBehavior && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No behaviors found matching "{searchQuery}"</p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700/50 bg-gradient-to-r from-[#0F1419] to-[#1A1F2E]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              {filteredCategories.length} behavior{filteredCategories.length !== 1 ? 's' : ''} monitored
            </div>
            <Button
              onClick={() => {
                toast.success('Opening Analytics Dashboard', {
                  description: 'Loading comprehensive behavior analytics...',
                });
                onClose();
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Detailed Analytics
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
