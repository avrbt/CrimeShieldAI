import React, { useState, useEffect, useRef } from 'react';
import { Camera, Eye, Users, AlertTriangle, Play, Maximize2, Settings, Activity, Shield, Zap, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { WebcamFeed } from './WebcamFeed';
import { toast } from 'sonner@2.0.3';
import { authUtils } from '../utils/auth';

interface CCTVFeedSectionProps {
  onDetectionClick?: () => void;
  fullView?: boolean;
  onNewEvidence?: (evidence: any) => void;
}

interface Detection {
  feed_id: number;
  timestamp: string;
  frame_number: number;
  has_dangerous_weapon: boolean;
  has_person: boolean;
  source_type?: 'Camera Feed' | 'Video Feed';
  weapon_conf?: number;
}

// Configuration
const WEAPON_DETECTION_API = 'http://localhost:5000';
const CHECK_INTERVAL = 2000; // Check for detections every 2 seconds for real-time responsiveness
const SUPABASE_BACKEND_URL = 'https://make-server-cfc8313f.deno.dev';

export function CCTVFeedSection({ onDetectionClick, fullView = false, onNewEvidence }: CCTVFeedSectionProps) {
  const [expandedFeed, setExpandedFeed] = useState<number | null>(null);
  const [useWeaponDetection, setUseWeaponDetection] = useState(false);
  const [detectionSource, setDetectionSource] = useState<'camera' | 'video'>('video'); // Source for detection
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [latestDetection, setLatestDetection] = useState<Detection | null>(null);
  const [feedStats, setFeedStats] = useState<{[key: number]: { detections: number, lastDetection: string | null }}>({});
  const detectionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [settingsFeedId, setSettingsFeedId] = useState<number | null>(null);
  const videoRefs = useRef<{[key: number]: HTMLVideoElement | HTMLIFrameElement | null}>({});
  const eventSourceRef = useRef<EventSource | null>(null);
  const [sseConnectionStatus, setSseConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Cooldown tracking - prevents continuous notifications and duplicate evidence
  const lastNotificationTime = useRef<{[key: number]: number}>({});
  const submittedEvidenceIds = useRef<Set<string>>(new Set());
  const NOTIFICATION_COOLDOWN = 30000; // 30 seconds cooldown per camera
  const EVIDENCE_UNIQUENESS_WINDOW = 60000; // 60 seconds window for evidence uniqueness
  const [feedCooldowns, setFeedCooldowns] = useState<{[key: number]: number}>({});
  const processedDetectionTimestamps = useRef<Set<string>>(new Set()); // Track processed detections
  
  // Feed settings state - stores settings for each feed
  const [feedSettings, setFeedSettings] = useState<{[key: number]: { 
    motionDetection: boolean;
    nightVision: boolean;
    audioRecording: boolean;
  }}>({
    1: { motionDetection: true, nightVision: true, audioRecording: false },
    2: { motionDetection: true, nightVision: true, audioRecording: false },
    3: { motionDetection: true, nightVision: true, audioRecording: false },
    4: { motionDetection: true, nightVision: true, audioRecording: false },
    5: { motionDetection: true, nightVision: true, audioRecording: false },
    6: { motionDetection: true, nightVision: true, audioRecording: false },
  });

  const cctvFeeds = [
    {
      id: 1,
      name: 'Main Street Intersection',
      location: 'Downtown District',
      status: 'active',
      lastActivity: 'Live Stream',
      detections: ['person', 'vehicle'],
      threatLevel: 'low',
      youtubeId: 'AiJtHubk4IQ', // Railway/Traffic footage
      videoUrl: '',
      supportsWeaponDetection: true
    },
    {
      id: 2,
      name: 'Railway Station Platform',
      location: 'Central Railway Station',
      status: 'active',
      lastActivity: 'Live Stream',
      detections: ['person', 'loitering'],
      threatLevel: 'medium',
      youtubeId: 'Z3DnRJhgo9k', // Railway station footage
      videoUrl: '',
      supportsWeaponDetection: true
    },
    {
      id: 3,
      name: 'Shopping Mall Entrance',
      location: 'Commercial District',
      status: 'active',
      lastActivity: 'Live Stream',
      detections: ['person', 'crowd'],
      threatLevel: 'high',
      youtubeId: 'ixS3Ymux9tE', // Mall/public area footage
      videoUrl: '',
      supportsWeaponDetection: true
    },
    {
      id: 4,
      name: 'Metro Station Exit',
      location: 'North District Metro',
      status: 'active',
      lastActivity: 'Live Stream',
      detections: ['vehicle'],
      threatLevel: 'low',
      youtubeId: 'YIvwiih1DWk', // Metro/urban footage
      videoUrl: '',
      supportsWeaponDetection: true
    },
    {
      id: 5,
      name: 'Bus Terminal',
      location: 'East District Transport Hub',
      status: 'active',
      lastActivity: 'Live Stream',
      detections: ['person', 'weapon'],
      threatLevel: 'high',
      youtubeId: 'jyLwFS6dCAg', // Bus terminal footage
      videoUrl: '',
      supportsWeaponDetection: true
    },
    {
      id: 6,
      name: 'Airport Terminal',
      location: 'International Airport',
      status: 'active',
      lastActivity: 'Live Stream',
      detections: ['person', 'bag'],
      threatLevel: 'high',
      youtubeId: 'r-XPPUnne6I', // Airport terminal footage
      videoUrl: '',
      supportsWeaponDetection: true
    }
  ];

  // Check server status
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${WEAPON_DETECTION_API}/api/health`);
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        setServerStatus('offline');
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Update cooldown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setFeedCooldowns(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        Object.keys(updated).forEach(feedId => {
          const remaining = updated[Number(feedId)] - 1000;
          if (remaining <= 0) {
            delete updated[Number(feedId)];
            hasChanges = true;
          } else {
            updated[Number(feedId)] = remaining;
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // NEW: Real-time Server-Sent Events (SSE) connection for instant alerts
  useEffect(() => {
    if (!useWeaponDetection || serverStatus !== 'online') {
      // Close existing connection if weapon detection is off
      if (eventSourceRef.current) {
        console.log('🛑 Closing SSE connection...');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setSseConnectionStatus('disconnected');
      }
      return;
    }

    const sseUrl = `${WEAPON_DETECTION_API}/api/alerts/stream`;
    console.log('🚀 Opening SSE connection to backend for real-time alerts...');
    console.log('   SSE URL:', sseUrl);
    setSseConnectionStatus('connecting');
    
    // Create EventSource connection
    let eventSource: EventSource;
    try {
      eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;
      console.log('   EventSource created, readyState:', eventSource.readyState);
      console.log('   Waiting for onopen event...');
    } catch (error) {
      console.error('❌ Failed to create EventSource:', error);
      setSseConnectionStatus('disconnected');
      toast.error('SSE Connection Failed', {
        description: 'Could not create EventSource. Check console.',
        duration: 5000,
      });
      return;
    }

    // Handle 'detection' events from backend
    eventSource.addEventListener('detection', async (evt) => {
      try {
        const detection: Detection = JSON.parse(evt.data);
        
        console.log('\n🔔 ========== REAL-TIME ALERT RECEIVED VIA SSE ==========');
        console.log('   Feed ID:', detection.feed_id);
        console.log('   Timestamp:', detection.timestamp);
        console.log('   Weapon Conf:', detection.weapon_conf);
        console.log('   Has Person:', detection.has_person);
        console.log('   Has Weapon:', detection.has_dangerous_weapon);
        console.log('==========================================================\n');

        // Check if we've already processed this detection
        const detectionKey = `${detection.feed_id}-${detection.timestamp}`;
        if (processedDetectionTimestamps.current.has(detectionKey)) {
          console.log('⏭️  Already processed this detection, skipping...');
          return;
        }

        // Mark as processed
        processedDetectionTimestamps.current.add(detectionKey);
        
        // Clean up old timestamps
        if (processedDetectionTimestamps.current.size > 100) {
          const timestampsArray = Array.from(processedDetectionTimestamps.current);
          processedDetectionTimestamps.current = new Set(timestampsArray.slice(-100));
        }

        // Update UI with latest detection
        setLatestDetection(detection);

        // Check if BOTH weapon AND person are detected
        const hasWeapon = detection.has_dangerous_weapon === true;
        const hasPerson = detection.has_person === true;

        if (hasWeapon && hasPerson) {
          const feedId = detection.feed_id;
          const currentTime = Date.now();

          // Check cooldown
          const lastNotification = lastNotificationTime.current[feedId] || 0;
          const timeSinceLastNotification = currentTime - lastNotification;

          if (timeSinceLastNotification < NOTIFICATION_COOLDOWN) {
            console.log(`⏱️  Cooldown active for Feed ${feedId}, skipping notification`);
            return;
          }

          // Update cooldown
          lastNotificationTime.current[feedId] = currentTime;
          setFeedCooldowns(prev => ({ ...prev, [feedId]: NOTIFICATION_COOLDOWN }));

          // Play alarm sound
          playAlarm();

          // Show toast notification
          const feed = cctvFeeds.find(f => f.id === feedId);
          const feedName = feed?.name || `Feed ${feedId}`;
          const weaponConfidence = detection.weapon_conf || 0.65;

          toast.error('⚠️ DANGEROUS WEAPON + PERSON DETECTED!', {
            description: `${feedName} (Feed ID: ${feedId}) - Confidence: ${(weaponConfidence * 100).toFixed(0)}% - [Real-time SSE Alert]`,
            duration: 8000,
          });

          // Send alert to Supabase backend
          sendAlertToBackend(detection, feed).catch(err => {
            console.error('❌ Failed to send alert to backend:', err);
          });

          // Capture screenshot and create evidence
          if (onNewEvidence && feed) {
            const evidenceTimeWindow = Math.floor(currentTime / EVIDENCE_UNIQUENESS_WINDOW);
            const evidenceUniqueId = `${feedId}-${evidenceTimeWindow}-weapon-person`;

            // Check for duplicate evidence
            if (submittedEvidenceIds.current.has(evidenceUniqueId)) {
              console.log(`🚫 Evidence already exists for this time window`);
              return;
            }

            // Mark as submitted
            submittedEvidenceIds.current.add(evidenceUniqueId);

            // Clean up old evidence IDs
            if (submittedEvidenceIds.current.size > 10) {
              const idsArray = Array.from(submittedEvidenceIds.current);
              submittedEvidenceIds.current = new Set(idsArray.slice(-10));
            }

            // Capture screenshot
            console.log(`📸 Capturing screenshot from Feed ${feedId} via SSE trigger...`);
            const screenshot = await captureScreenshot(feedId, detection);

            // Create evidence item
            const evidenceItem = {
              id: Date.now() + feedId,
              title: `⚠️ Dangerous Weapon + Person - ${feedName}`,
              type: 'weapon',
              location: `${feed.location} (Feed ${feedId})`,
              cameraId: `CAM-${String(feedId).padStart(3, '0')}`,
              feedId: feedId,
              timestamp: new Date(detection.timestamp).toLocaleString(),
              duration: 'Screenshot',
              confidence: weaponConfidence,
              tags: [
                'dangerous-weapon',
                'person',
                'high-priority',
                'auto-captured',
                'real-time-sse',
                `feed-${feedId}`,
                detection.source_type || 'Video Feed'
              ],
              thumbnail: screenshot,
              size: 'High Quality',
              detectionDetails: [
                {
                  class: 'person',
                  confidence: 0.85,
                  bbox: []
                },
                {
                  class: 'dangerous_weapon',
                  confidence: weaponConfidence,
                  bbox: []
                }
              ],
              autoCapture: true,
              evidenceId: evidenceUniqueId,
              detectionSource: detection.source_type || 'Video Feed',
              captureMethod: 'SSE Real-time'
            };

            onNewEvidence(evidenceItem);

            console.log(`✅ Evidence captured via SSE and sent to Evidence Section`);

            toast.success('📸 Screenshot Captured (Real-time)', {
              description: `Evidence saved from ${feedName} (Feed ${feedId})`,
              duration: 3000,
            });
          }
        }
      } catch (error) {
        console.error('❌ Error processing SSE detection event:', error);
      }
    });

    // Handle connection open
    eventSource.onopen = () => {
      console.log('✅ SSE connection established successfully');
      console.log('   readyState:', eventSource.readyState, '(1 = OPEN)');
      setSseConnectionStatus('connected');
      toast.success('Real-time Alerts Connected', {
        description: 'Now receiving instant alerts from backend',
        duration: 3000,
      });
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      console.error('   readyState:', eventSource.readyState);
      console.error('   0 = CONNECTING, 1 = OPEN, 2 = CLOSED');
      
      if (eventSource.readyState === EventSource.CONNECTING) {
        console.log('🔄 SSE reconnecting...');
        setSseConnectionStatus('connecting');
      } else if (eventSource.readyState === EventSource.CLOSED) {
        console.log('❌ SSE connection closed permanently');
        setSseConnectionStatus('disconnected');
        toast.error('SSE Connection Lost', {
          description: 'Real-time alerts disconnected. Using polling fallback.',
          duration: 5000,
        });
      }
    };

    // Cleanup on unmount or when weapon detection is disabled
    return () => {
      console.log('🛑 Closing SSE connection (cleanup)');
      eventSource.close();
      eventSourceRef.current = null;
      setSseConnectionStatus('disconnected');
    };
  }, [useWeaponDetection, serverStatus, onNewEvidence]);

  // Check for weapon detections (FALLBACK POLLING - SSE is primary now)
  useEffect(() => {
    if (!useWeaponDetection || serverStatus !== 'online') {
      if (detectionCheckInterval.current) {
        clearInterval(detectionCheckInterval.current);
        detectionCheckInterval.current = null;
        console.log('🛑 Frontend detection monitoring STOPPED');
      }
      return;
    }

    console.log('🚀 Frontend detection monitoring STARTED - Polling every', CHECK_INTERVAL / 1000, 'seconds');

    const checkDetections = async () => {
      try {
        // Fetch ALL recent detections from ALL feeds (parallel processing)
        // This API returns detections from Feed 1, 2, 3, 4, 5, 6 simultaneously
        const response = await fetch(`${WEAPON_DETECTION_API}/api/detections`);
        
        if (!response.ok) {
          console.warn(`⚠️ Detection API returned status ${response.status}`);
          return;
        }
        
        const data = await response.json();
        
        console.log(`🔄 [${new Date().toLocaleTimeString()}] Polled backend - Found ${data.detections?.length || 0} detection(s)`);
        
        if (data.detections && data.detections.length > 0) {
          console.log(`\n🔄 Processing ${data.detections.length} detection(s) from parallel feeds...`);
          
          // Process each detection that we haven't seen before
          // Multiple feeds can have detections at the same time
          for (const detection of data.detections) {
            // Skip if we've already processed this detection
            const detectionKey = `${detection.feed_id}-${detection.timestamp}`;
            if (processedDetectionTimestamps.current.has(detectionKey)) {
              continue; // Already processed this detection
            }
            
            // Mark as processed
            processedDetectionTimestamps.current.add(detectionKey);
            
            // Clean up old processed timestamps (keep only last 100)
            if (processedDetectionTimestamps.current.size > 100) {
              const timestampsArray = Array.from(processedDetectionTimestamps.current);
              processedDetectionTimestamps.current = new Set(timestampsArray.slice(-100));
            }
            
            // Update latest detection for UI display
            setLatestDetection(detection);
            
            // Check if BOTH weapon AND person are detected together
            const hasWeapon = detection.has_dangerous_weapon === true;
            const hasPerson = detection.has_person === true;
            
            // Log detection details - showing which specific feed detected
            console.log(`\n🔍 [Feed ${detection.feed_id}] Detection Event:`);
            console.log(`   Source: ${detection.source_type}`);
            console.log(`   Weapon: ${hasWeapon}, Person: ${hasPerson}`);
            console.log(`   Timestamp: ${detection.timestamp}`);
            
            // ONLY capture if BOTH weapon AND person are detected together
            if (hasWeapon && hasPerson) {
              const feedId = detection.feed_id;
              const currentTime = Date.now();
              
              console.log(`\n✅ ========== VALID DETECTION: Feed ${feedId} ==========`);
              console.log(`   🎯 Person + Weapon detected together`);
              console.log(`   📹 Will capture screenshot from Feed ${feedId} ONLY`);
              
              // Check cooldown - prevent continuous notifications from same camera
              const lastNotification = lastNotificationTime.current[feedId] || 0;
              const timeSinceLastNotification = currentTime - lastNotification;
              
              if (timeSinceLastNotification < NOTIFICATION_COOLDOWN) {
                // Still in cooldown period - skip notification and evidence capture
                console.log(`⏱️ Cooldown active for Feed ${feedId} (${Math.ceil((NOTIFICATION_COOLDOWN - timeSinceLastNotification) / 1000)}s remaining)`);
                continue; // Use continue instead of return to process other feeds
              }
              
              // Update last notification time and cooldown state
              lastNotificationTime.current[feedId] = currentTime;
              setFeedCooldowns(prev => ({ ...prev, [feedId]: NOTIFICATION_COOLDOWN }));
              
              // Play alarm sound (only once per detection cycle)
              playAlarm();
              
              // Show toast notification
              const feed = cctvFeeds.find(f => f.id === feedId);
              const feedName = feed?.name || `Feed ${feedId}`;
              const weaponConfidence = detection.weapon_conf || 0.65;
              
              toast.error('⚠️ DANGEROUS WEAPON + PERSON DETECTED!', {
                description: `${feedName} (Feed ID: ${feedId}) - Confidence: ${(weaponConfidence * 100).toFixed(0)}% - Next alert in 30s`,
                duration: 8000,
              });

              // Send alert to Supabase backend
              sendAlertToBackend(detection, feed).catch(err => {
                console.error('❌ Failed to send alert to backend:', err);
              });

              // Capture screenshot and send to evidence (only if not duplicate)
              if (onNewEvidence && feed) {
                // Generate unique evidence ID based on camera, time window, and detection type
                const evidenceTimeWindow = Math.floor(currentTime / EVIDENCE_UNIQUENESS_WINDOW);
                const evidenceUniqueId = `${feedId}-${evidenceTimeWindow}-weapon-person`;
                
                // Check if we already submitted evidence for this camera in this time window
                if (submittedEvidenceIds.current.has(evidenceUniqueId)) {
                  console.log(`🚫 Evidence already submitted for Feed ${feedId} in current time window (${EVIDENCE_UNIQUENESS_WINDOW / 1000}s)`);
                  continue; // Use continue instead of return to process other feeds
                }
                
                // Mark as submitted
                submittedEvidenceIds.current.add(evidenceUniqueId);
                
                // Clean up old evidence IDs (keep only last 10)
                if (submittedEvidenceIds.current.size > 10) {
                  const idsArray = Array.from(submittedEvidenceIds.current);
                  submittedEvidenceIds.current = new Set(idsArray.slice(-10));
                }
                
                // Capture high-quality screenshot from the EXACT feed where detection occurred
                console.log(`\n📸 ========== SCREENSHOT CAPTURE ==========`);
                console.log(`   Target Feed: ${feedId} (${feedName})`);
                console.log(`   Source Type: ${detection.source_type}`);
                console.log(`   Capture URL: /api/capture/${feedId}?source=${detection.source_type === 'Camera Feed' ? 'camera' : 'video'}`);
                
                const screenshot = await captureScreenshot(feedId, detection);
                
                console.log(`   ✅ Screenshot captured from Feed ${feedId}`);
                console.log(`   ✅ Sending to Evidence Section...`);
                console.log(`==========================================\n`);
                
                const evidenceItem = {
                  id: Date.now() + feedId, // Ensure unique IDs for simultaneous detections
                  title: `⚠️ Dangerous Weapon + Person - ${feedName}`,
                  type: 'weapon',
                  location: `${feed.location} (Feed ${feedId})`,
                  cameraId: `CAM-${String(feedId).padStart(3, '0')}`,
                  feedId: feedId, // Explicitly track feed ID
                  timestamp: new Date(detection.timestamp).toLocaleString(),
                  duration: 'Screenshot',
                  confidence: weaponConfidence,
                  tags: [
                    'dangerous-weapon',
                    'person',
                    'high-priority',
                    'auto-captured',
                    `feed-${feedId}`,
                    detection.source_type || 'Video Feed' // Use source from backend
                  ],
                  thumbnail: screenshot,
                  size: 'High Quality',
                  detectionDetails: [
                    {
                      class: 'person',
                      confidence: 0.85,
                      bbox: []
                    },
                    {
                      class: 'dangerous_weapon',
                      confidence: weaponConfidence,
                      bbox: []
                    }
                  ],
                  autoCapture: true,
                  evidenceId: evidenceUniqueId, // Track unique ID
                  detectionSource: detection.source_type || 'Video Feed' // Track detection source from backend
                };
                
                onNewEvidence(evidenceItem);
                
                console.log(`✅ Evidence submitted for Feed ${feedId} - ID: ${evidenceUniqueId}`);
                
                toast.success('📸 Screenshot Captured', {
                  description: `Evidence saved from ${feedName} (Feed ${feedId})`,
                  duration: 3000,
                });
              }
            }
          }
        }

        // Update feed stats
        const statsResponse = await fetch(`${WEAPON_DETECTION_API}/api/feeds`);
        const statsData = await statsResponse.json();
        
        const newStats: typeof feedStats = {};
        statsData.feeds.forEach((feed: any) => {
          newStats[feed.id] = {
            detections: feed.detection_count,
            lastDetection: feed.last_detection
          };
        });
        setFeedStats(newStats);

      } catch (error) {
        console.error('Error checking detections:', error);
      }
    };

    // Start continuous monitoring - check immediately and every 3 seconds
    checkDetections();
    detectionCheckInterval.current = setInterval(checkDetections, CHECK_INTERVAL);

    return () => {
      if (detectionCheckInterval.current) {
        clearInterval(detectionCheckInterval.current);
        detectionCheckInterval.current = null;
      }
    };
  }, [useWeaponDetection, serverStatus]); // Removed latestDetection from dependencies to prevent restart

  // Capture screenshot from detection stream
  const captureScreenshot = async (feedId: number, detection: Detection): Promise<string> => {
    try {
      // Determine which source to capture from based on detection source_type
      const sourceType = detection.source_type === 'Camera Feed' ? 'camera' : 'video';
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📸 SCREENSHOT CAPTURE REQUEST`);
      console.log(`   Feed ID: ${feedId}`);
      console.log(`   Source Type: ${detection.source_type}`);
      console.log(`   Source Parameter: ${sourceType}`);
      console.log(`   Detection Timestamp: ${detection.timestamp}`);
      
      // Try to capture from weapon detection stream with correct source parameter
      const captureUrl = `${WEAPON_DETECTION_API}/api/capture/${feedId}?source=${sourceType}`;
      console.log(`   Capture URL: ${captureUrl}`);
      
      const response = await fetch(captureUrl);
      if (response.ok) {
        const blob = await response.blob();
        console.log(`✅ Screenshot captured successfully from Feed ${feedId} - ${detection.source_type}`);
        console.log(`   Blob size: ${blob.size} bytes`);
        console.log(`${'='.repeat(60)}\n`);
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to capture from Feed ${feedId}:`, response.status, errorText);
        console.log(`${'='.repeat(60)}\n`);
      }
    } catch (error) {
      console.error(`❌ Failed to capture from API for Feed ${feedId}, using fallback:`, error);
      console.log(`${'='.repeat(60)}\n`);
    }
    
    // Fallback: Generate a placeholder image
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Dark background
      ctx.fillStyle = '#1a1f2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Detection info
      ctx.fillStyle = '#FF6EC7';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DETECTION CAPTURED', canvas.width / 2, canvas.height / 2 - 40);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Feed ID: ${feedId}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Time: ${new Date(detection.timestamp).toLocaleTimeString()}`, canvas.width / 2, canvas.height / 2 + 30);
      
      const weaponConf = detection.weapon_conf || 0.65;
      ctx.fillText(`Confidence: ${(weaponConf * 100).toFixed(0)}%`, canvas.width / 2, canvas.height / 2 + 60);
    }
    
    return canvas.toDataURL('image/png');
  };

  // Send alert to Supabase backend
  const sendAlertToBackend = async (detection: Detection, feed: typeof cctvFeeds[0]) => {
    try {
      const token = authUtils.getAccessToken();
      if (!token) {
        console.log('❌ No access token found, skipping backend alert');
        return;
      }

      const currentUser = authUtils.getCurrentUser();
      
      const response = await fetch(`${SUPABASE_BACKEND_URL}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'Weapon Detection',
          severity: 'high',
          description: `Dangerous weapon + person detected at ${feed?.name || `Feed ${detection.feed_id}`}. Confidence: ${((detection.weapon_conf || 0.65) * 100).toFixed(0)}%. Source: ${detection.source_type}`,
          location: feed?.location || `Feed ${detection.feed_id}`,
          latitude: null,
          longitude: null,
          state: currentUser?.state || 'Unknown',
          district: currentUser?.district || 'Unknown'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to send alert to backend: ${response.status} ${errorText}`);
        return;
      }

      console.log('✅ Alert sent to Supabase backend successfully');
    } catch (error) {
      console.error('❌ Error sending alert to backend:', error);
    }
  };

  // Play alarm sound
  const playAlarm = () => {
    try {
      // Create a new AudioContext each time for a fresh 2-second siren
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create alternating siren sound (800Hz -> 400Hz -> 800Hz)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 1);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 1.5);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 2);
      
      // Set volume
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      // Play for exactly 2 seconds
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);
      
      // Clean up after playing
      oscillator.onended = () => {
        audioContext.close();
      };
      
      console.log('🔊 Threat alarm triggered - playing for 2 seconds');
    } catch (error) {
      console.error('❌ Error playing alarm:', error);
    }
  };

  const toggleWeaponDetection = () => {
    if (serverStatus === 'offline') {
      toast.error('Weapon Detection Server Offline', {
        description: 'Please start the Python detection server first.',
      });
      return;
    }
    
    setUseWeaponDetection(!useWeaponDetection);
    
    if (!useWeaponDetection) {
      // Start background detection for ALL feeds SIMULTANEOUSLY (parallel processing)
      // Each feed runs independently and continuously monitors for person + weapon
      console.log('\n🚀 ========== STARTING PARALLEL DETECTION FOR ALL FEEDS ==========');
      
      const startTime = Date.now();
      let activatedCount = 0;
      
      cctvFeeds.forEach(feed => {
        if (feed.supportsWeaponDetection) {
          activatedCount++;
          
          // Determine the correct source type for this feed
          // Feed 4 is webcam-only (isWebcamOnly flag), others are video feeds
          const sourceType = feed.isWebcamOnly ? 'camera' : 'video';
          
          console.log(`🎯 Feed ${feed.id} (${feed.name}): Starting ${sourceType} stream...`);
          
          // Start detection stream (runs in parallel with other feeds)
          // All fetch calls execute simultaneously - NO waiting for one to finish
          fetch(`${WEAPON_DETECTION_API}/video_feed/${feed.id}?source=${sourceType}`)
            .then(() => {
              console.log(`✅ Feed ${feed.id} [${sourceType}] → ACTIVE and monitoring for person + weapon`);
            })
            .catch((err) => {
              console.error(`❌ Feed ${feed.id} [${sourceType}] → FAILED:`, err);
            });
        }
      });
      
      console.log(`📊 Total feeds activated: ${activatedCount}`);
      console.log(`⚡ All ${activatedCount} feeds starting in parallel (not sequential)`);
      console.log(`🔍 Detection logic: Capture screenshot ONLY from feed where person + weapon detected`);
      console.log(`📸 Evidence source: Always matches the feed_id where detection occurred`);
      console.log('================================================================\n');
      
      toast.success('🎯 Parallel Detection Activated', {
        description: `Monitoring ALL ${activatedCount} feeds simultaneously. Each feed captures its own evidence when person + weapon detected.`,
        duration: 5000,
      });
    } else {
      toast.info('Weapon Detection Disabled', {
        description: 'AI monitoring has been stopped',
      });
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-[#FF6EC7]';
      case 'medium': return 'text-orange-400';
      case 'low': return 'text-[#3BE39C]';
      default: return 'text-gray-400';
    }
  };

  const getThreatBg = (level: string) => {
    switch (level) {
      case 'high': return 'bg-[#FF6EC7]/20';
      case 'medium': return 'bg-orange-400/20';
      case 'low': return 'bg-[#3BE39C]/20';
      default: return 'bg-gray-400/20';
    }
  };

  const displayFeeds = fullView ? cctvFeeds : cctvFeeds.slice(0, 4);

  const getVideoSource = (feed: typeof cctvFeeds[0]) => {
    // NEVER show detection stream in live feeds
    // Detection happens in background, screenshots only go to Evidence Section
    return null;
  };

  return (
    <section className="bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Weapon Detection Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#3BE39C]/20 rounded-lg">
              <Camera className="w-6 h-6 text-[#3BE39C]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Live CCTV Monitoring</h2>
              <p className="text-gray-400">Continuous live video feeds • AI detection runs in background</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Server Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-500 animate-pulse' : serverStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-400">
                {serverStatus === 'online' ? 'Server Online' : serverStatus === 'checking' ? 'Checking...' : 'Server Offline'}
              </span>
            </div>

            {/* Weapon Detection Toggle */}
            <button
              onClick={toggleWeaponDetection}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                useWeaponDetection 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{useWeaponDetection ? 'Weapon Detection ON' : 'Enable Weapon Detection'}</span>
              {useWeaponDetection && <Activity className="w-4 h-4 animate-pulse" />}
            </button>

            {/* Detection Status - Only visible when weapon detection is on */}
            {useWeaponDetection && (
              <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-4 py-2">
                <Activity className="w-4 h-4 text-[#3BE39C] animate-pulse" />
                <span className="text-sm text-gray-300">Background Monitoring Active</span>
              </div>
            )}

            {!fullView && (
              <button 
                onClick={onDetectionClick}
                className="bg-[#FF6EC7] text-white px-4 py-2 rounded-lg hover:bg-[#FF6EC7]/80 transition-colors flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>AI Detection Panel</span>
              </button>
            )}
          </div>
        </div>

        {/* Latest Detection Alert */}
        {latestDetection && useWeaponDetection && (
          <div className="bg-red-500/10 border-2 border-red-500 rounded-xl p-4 mb-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-white font-medium flex items-center gap-2">
                    DANGEROUS WEAPON + PERSON DETECTED!
                    <span className="text-blue-400 text-sm">📸 Screenshot Captured</span>
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {cctvFeeds.find(f => f.id === latestDetection.feed_id)?.name} - {new Date(latestDetection.timestamp).toLocaleTimeString()}
                    <span className="text-blue-300 ml-2">→ Evidence Section Updated</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm">
                  Person: 85%
                </div>
                <div className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm">
                  Weapon: {((latestDetection.weapon_conf || 0.65) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Frontend Monitoring Status - Debug Info */}
        {useWeaponDetection && (
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
              <h3 className="text-white font-medium">Frontend Monitoring Status</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 mb-1">🔔 Real-time SSE</div>
                <div className={`font-medium flex items-center gap-2 ${
                  sseConnectionStatus === 'connected' ? 'text-green-400' : 
                  sseConnectionStatus === 'connecting' ? 'text-yellow-400' : 'text-gray-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    sseConnectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
                    sseConnectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'
                  }`}></div>
                  {sseConnectionStatus === 'connected' ? 'Connected' : 
                   sseConnectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 mb-1">🔄 Polling (Fallback)</div>
                <div className="text-green-400 font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Active ({CHECK_INTERVAL / 1000}s)
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 mb-1">Backend Server</div>
                <div className={`font-medium flex items-center gap-2 ${serverStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  {serverStatus === 'online' ? 'Connected' : 'Offline'}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 mb-1">Latest Detection</div>
                <div className="text-white font-medium">
                  {latestDetection 
                    ? `Feed ${latestDetection.feed_id} - ${new Date(latestDetection.timestamp).toLocaleTimeString()}`
                    : 'Waiting...'}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>💡 Tip:</span>
                <span>Backend sends instant alerts via Server-Sent Events (SSE). Check console for logs.</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    console.log('\n🧪 ========== TESTING SSE CONNECTION ==========');
                    const testUrl = `${WEAPON_DETECTION_API}/api/alerts/stream`;
                    console.log('Creating test EventSource:', testUrl);
                    
                    const testES = new EventSource(testUrl);
                    let connected = false;
                    
                    testES.onopen = () => {
                      console.log('✅ TEST: SSE connection opened successfully!');
                      connected = true;
                      toast.success('SSE Test Passed', {
                        description: 'EventSource can connect to backend',
                        duration: 3000,
                      });
                      setTimeout(() => {
                        testES.close();
                        console.log('🛑 TEST: Closed test connection');
                      }, 2000);
                    };
                    
                    testES.onerror = (err) => {
                      console.error('❌ TEST: SSE connection failed', err);
                      console.error('   readyState:', testES.readyState);
                      toast.error('SSE Test Failed', {
                        description: 'Cannot connect to SSE endpoint. Check CORS or backend.',
                        duration: 5000,
                      });
                      testES.close();
                    };
                    
                    testES.addEventListener('detection', (evt) => {
                      console.log('🔔 TEST: Received detection event!', evt.data);
                    });
                    
                    setTimeout(() => {
                      if (!connected) {
                        console.error('❌ TEST: Connection timeout (5s)');
                        testES.close();
                        toast.error('SSE Timeout', {
                          description: 'Connection took too long. Backend might be down.',
                          duration: 5000,
                        });
                      }
                    }, 5000);
                    
                    console.log('⏳ Waiting for connection... (5s timeout)');
                  }}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors"
                >
                  🧪 Test SSE
                </button>
                <button
                onClick={async () => {
                  try {
                    console.log('\n🔍 ========== MANUAL BACKEND CHECK ==========');
                    
                    // Check health
                    const healthRes = await fetch(`${WEAPON_DETECTION_API}/api/health`);
                    const health = await healthRes.json();
                    console.log('📊 Health:', health);
                    
                    // Check feeds
                    const feedsRes = await fetch(`${WEAPON_DETECTION_API}/api/feeds`);
                    const feeds = await feedsRes.json();
                    console.log('📹 Feeds:', feeds);
                    
                    // Check detections
                    const detectionsRes = await fetch(`${WEAPON_DETECTION_API}/api/detections`);
                    const detections = await detectionsRes.json();
                    console.log('🔔 Detections:', detections);
                    console.log('   Total detections:', detections.detections?.length || 0);
                    
                    if (detections.detections && detections.detections.length > 0) {
                      console.log('   Latest detection:', detections.detections[detections.detections.length - 1]);
                      setLatestDetection(detections.detections[detections.detections.length - 1]);
                    }
                    
                    console.log('============================================\n');
                    
                    toast.success('Backend Check Complete', {
                      description: `${health.active_streams} active streams, ${detections.detections?.length || 0} detections in queue`,
                      duration: 5000,
                    });
                  } catch (error) {
                    console.error('❌ Backend check failed:', error);
                    toast.error('Backend Check Failed', {
                      description: 'Check console for details',
                    });
                  }
                }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                >
                  🔍 Debug Backend
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feed Grid */}
        <div className={`grid ${fullView ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-6`} style={{ perspective: '1200px' }}>
          {displayFeeds.map((feed) => {
            const videoSource = getVideoSource(feed);
            const stats = feedStats[feed.id];
            
            return (
              <div 
                key={feed.id} 
                className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-500 cursor-pointer"
                style={{
                  transform: 'translateZ(0)',
                  transformStyle: 'preserve-3d',
                  boxShadow: '0 10px 40px -12px rgba(59, 227, 156, 0.15), 0 0 0 1px rgba(31, 41, 55, 0.5) inset'
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(-10px) translateZ(30px) rotateX(3deg)';
                  el.style.boxShadow = '0 25px 70px -15px rgba(59, 227, 156, 0.35), 0 0 0 1px rgba(59, 227, 156, 0.3) inset, 0 2px 0 0 rgba(255, 255, 255, 0.1) inset';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateZ(0)';
                  el.style.boxShadow = '0 10px 40px -12px rgba(59, 227, 156, 0.15), 0 0 0 1px rgba(31, 41, 55, 0.5) inset';
                }}
              >
                {/* 3D Shine Layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" style={{ transform: 'translateZ(2px)' }}></div>
                
                {/* Video Feed */}
                <div className="relative aspect-video bg-black">
                  {videoSource ? (
                    // This will never execute - videoSource is always null
                    // Detection happens in background, live feeds always show clean video
                    <img 
                      src={videoSource}
                      alt={feed.name}
                      className="w-full h-full object-cover"
                    />
                  ) : feed.isWebcamOnly ? (
                    // Webcam feed - ALWAYS shows live camera
                    // When detection OFF: Browser webcam (getUserMedia)
                    // When detection ON: Flask server MJPEG stream with YOLO annotations
                    <WebcamFeed
                      feedId={feed.id}
                      useDetectionStream={useWeaponDetection && serverStatus === 'online'}
                      detectionApiUrl={WEAPON_DETECTION_API}
                      className="w-full h-full object-cover"
                    />
                  ) : feed.videoUrl ? (
                    // Direct video file
                    <video
                      src={feed.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : feed.youtubeId ? (
                    // YouTube stream
                    <iframe
                      src={`https://www.youtube.com/embed/${feed.youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&loop=1&playlist=${feed.youtubeId}`}
                      className="w-full h-full pointer-events-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    // Static image
                    <ImageWithFallback 
                      src={feed.image}
                      alt={feed.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Live Indicator - Only show for non-webcam feeds (webcam has its own indicator) */}
                  {!feed.isWebcamOnly && (
                    <div className="absolute top-3 left-3 flex items-center space-x-1 bg-red-600 text-white px-2 py-1 rounded text-xs z-10">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>
                  )}

                  {/* Weapon Detection Badge */}
                  {useWeaponDetection && videoSource && (
                    <div className="absolute top-3 left-20 flex items-center space-x-1 bg-red-500 text-white px-2 py-1 rounded text-xs z-10">
                      <Zap className="w-3 h-3" />
                      <span>AI SCAN</span>
                    </div>
                  )}

                  {/* Threat Level */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium ${getThreatBg(feed.threatLevel)} ${getThreatColor(feed.threatLevel)}`}>
                    {feed.threatLevel.toUpperCase()}
                  </div>

                  {/* Detection Count */}
                  {stats && stats.detections > 0 && (
                    <div className="absolute bottom-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
                      ⚠ {stats.detections} DANGEROUS WEAPON+PERSON DETECTIONS
                    </div>
                  )}

                  {/* Cooldown Indicator */}
                  {feedCooldowns[feed.id] && (
                    <div className="absolute bottom-3 right-3 bg-amber-500/90 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>Cooldown: {Math.ceil(feedCooldowns[feed.id] / 1000)}s</span>
                    </div>
                  )}

                  {/* AI Detection Overlays */}
                  {!useWeaponDetection && (
                    <div className="absolute bottom-3 left-3 flex space-x-2">
                      {feed.detections.map((detection, idx) => (
                        <div key={idx} className="bg-[#3BE39C]/80 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                          {detection === 'person' && <Users className="w-3 h-3" />}
                          {detection === 'vehicle' && <Camera className="w-3 h-3" />}
                          {detection === 'loitering' && <AlertTriangle className="w-3 h-3" />}
                          {detection === 'crowd' && <Users className="w-3 h-3" />}
                          {detection === 'bag' && <AlertTriangle className="w-3 h-3" />}
                          <span>{detection}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expand Button */}
                  <button 
                    onClick={() => setExpandedFeed(expandedFeed === feed.id ? null : feed.id)}
                    className="absolute bottom-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Feed Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-medium">{feed.name}</h3>
                      <p className="text-gray-400 text-sm">{feed.location}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-[#3BE39C] text-sm">
                      <div className="w-2 h-2 bg-[#3BE39C] rounded-full"></div>
                      <span>Active</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Last activity: {feed.lastActivity}</span>
                    <button 
                      onClick={() => setSettingsFeedId(feed.id)}
                      className="text-[#3BE39C] hover:text-[#3BE39C]/80 transition-colors"
                      title="Feed Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded Feed Modal */}
        {expandedFeed && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-6xl w-full">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-medium">
                  {cctvFeeds.find(f => f.id === expandedFeed)?.name}
                </h3>
                <button 
                  onClick={() => setExpandedFeed(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="aspect-video bg-black">
                {(() => {
                  const feed = cctvFeeds.find(f => f.id === expandedFeed);
                  if (!feed) return null;
                  
                  const videoSource = getVideoSource(feed);
                  
                  if (videoSource) {
                    return (
                      <img 
                        src={videoSource}
                        alt={feed.name}
                        className="w-full h-full object-contain"
                      />
                    );
                  } else if (feed.videoUrl) {
                    return (
                      <video
                        src={feed.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                        className="w-full h-full object-contain"
                      />
                    );
                  } else if (feed.youtubeId) {
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${feed.youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&loop=1&playlist=${feed.youtubeId}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  } else {
                    return (
                      <ImageWithFallback 
                        src={feed.image || ''}
                        alt="Expanded feed"
                        className="w-full h-full object-contain"
                      />
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        )}



        {/* Feed Settings Modal */}
        {settingsFeedId !== null && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-lg w-full border border-gray-700">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#3BE39C]" />
                  Feed Settings - {cctvFeeds.find(f => f.id === settingsFeedId)?.name}
                </h3>
                <button 
                  onClick={() => setSettingsFeedId(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Feed Information */}
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm">Location</label>
                    <div className="text-white mt-1">
                      {cctvFeeds.find(f => f.id === settingsFeedId)?.location}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Status</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-[#3BE39C] rounded-full"></div>
                      <span className="text-[#3BE39C]">Active</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Threat Level</label>
                    <div className="text-white mt-1 capitalize">
                      {cctvFeeds.find(f => f.id === settingsFeedId)?.threatLevel}
                    </div>
                  </div>
                  {feedStats[settingsFeedId] && (
                    <div>
                      <label className="text-gray-400 text-sm">Weapon Detections</label>
                      <div className="text-white mt-1">
                        {feedStats[settingsFeedId].detections} total detections
                      </div>
                      {feedStats[settingsFeedId].lastDetection && (
                        <div className="text-gray-500 text-sm">
                          Last: {new Date(feedStats[settingsFeedId].lastDetection).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Settings Options */}
                <div className="pt-4 border-t border-gray-700 space-y-3">
                  {/* Motion Detection Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Motion Detection</span>
                    <button
                      onClick={() => {
                        setFeedSettings(prev => ({
                          ...prev,
                          [settingsFeedId]: {
                            ...prev[settingsFeedId],
                            motionDetection: !prev[settingsFeedId]?.motionDetection
                          }
                        }));
                      }}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                        feedSettings[settingsFeedId]?.motionDetection ? 'bg-[#3BE39C]' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                        feedSettings[settingsFeedId]?.motionDetection ? 'ml-auto' : 'ml-0'
                      }`}></div>
                    </button>
                  </div>

                  {/* Night Vision Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Night Vision</span>
                    <button
                      onClick={() => {
                        setFeedSettings(prev => ({
                          ...prev,
                          [settingsFeedId]: {
                            ...prev[settingsFeedId],
                            nightVision: !prev[settingsFeedId]?.nightVision
                          }
                        }));
                      }}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                        feedSettings[settingsFeedId]?.nightVision ? 'bg-[#3BE39C]' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                        feedSettings[settingsFeedId]?.nightVision ? 'ml-auto' : 'ml-0'
                      }`}></div>
                    </button>
                  </div>

                  {/* Audio Recording Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Audio Recording</span>
                    <button
                      onClick={() => {
                        setFeedSettings(prev => ({
                          ...prev,
                          [settingsFeedId]: {
                            ...prev[settingsFeedId],
                            audioRecording: !prev[settingsFeedId]?.audioRecording
                          }
                        }));
                      }}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                        feedSettings[settingsFeedId]?.audioRecording ? 'bg-[#3BE39C]' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                        feedSettings[settingsFeedId]?.audioRecording ? 'ml-auto' : 'ml-0'
                      }`}></div>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      toast.success('Settings saved successfully');
                      setSettingsFeedId(null);
                    }}
                    className="flex-1 bg-[#3BE39C] hover:bg-[#3BE39C]/80 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setSettingsFeedId(null)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
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