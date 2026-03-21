"""
CrimeShield AI - Dangerous Weapon Detection Server (Fixed)
===========================================================
- Properly handles webcam access (releases it gracefully when needed)
- 30s cooldown per feed with batching: emit at most ONE alert every 30 seconds
- Continuous concurrent monitoring of ALL configured feeds in background threads
- Improved detection logic with better spatial association
- Automatic screenshot capture for evidence
- NEW: Real-time alerts SSE endpoint (/api/alerts/stream)
- NEW: Auto-restart YouTube feeds (loop) when they end

Run:
  pip install flask flask-cors ultralytics opencv-python-headless numpy yt-dlp
  python weapon-detection-server.py
"""

from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
import json
import time
from datetime import datetime, timedelta
from threading import Lock, Thread, Event
import base64
import traceback
import atexit  # <-- added

# --- Configuration ---
MODEL_PATH = 'best.pt'  # Path to your trained YOLO model
# Use stricter threshold for weapons; people are easier
PERSON_CONF = 0.40
WEAPON_CONF = 0.55
DETECTION_CONFIDENCE = 0.30  # base conf for model call
FRAME_SKIP = 2  # Process every Nth frame for performance

# Alert policy: at most one alert every 30 seconds per feed
ALERT_INTERVAL_SEC = 30
COOLDOWN_SEC = 30

# Video sources - Map feed IDs to video sources
VIDEO_SOURCES = {
    1: 'https://youtube.com/shorts/ywoUOIqfkrY?si=-PExTJp7tpGdJYR7',  # Main Street Intersection - Updated Video
    2: 'https://www.youtube.com/watch?v=u4UZ4UvZXrg',  # Central Park East
    3: 'https://youtube.com/shorts/ywoUOIqfkrY?si=-PExTJp7tpGdJYR7',  # Shopping Mall Entrance - Updated Video
    4: 0,  # Residential Zone A - LIVE WEBCAM
    5: 'https://youtube.com/shorts/myXiZTDSo-E',  # Industrial Zone B - Weapon Detection Video
    6: 'https://www.youtube.com/watch?v=llW2mUEZDFw',  # Airport Terminal
}

# Try to import yt-dlp for YouTube support
try:
    import yt_dlp
    YOUTUBE_SUPPORT = True
except ImportError:
    print("⚠ Warning: yt-dlp not installed. YouTube URLs won't work.")
    print("Install with: pip install yt-dlp")
    YOUTUBE_SUPPORT = False

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)

# Global state
model = None
active_streams = {}
stream_locks = {}
detection_events = []
detection_lock = Lock()

# For SSE: monotonically increasing id for each detection
detection_seq = 0

# Load model on startup
try:
    print(f"🔄 Loading YOLO model from {MODEL_PATH}...")
    model = YOLO(MODEL_PATH)
    print(f"✅ Model loaded successfully!")
    print(f"   Model classes: {model.names}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("   Please ensure 'best.pt' is in the same directory")

# Derive classes from model.names
PERSON_IDS = set()
WEAPON_IDS = set()
if model is not None and hasattr(model, 'names'):
    for cid, name in model.names.items():
        n = str(name).lower().replace('_', ' ').strip()
        print(f"   Class {cid}: {name} -> {n}")
        if n in {"person", "people", "human"}:
            PERSON_IDS.add(cid)
            print(f"     ✓ Identified as PERSON class")
        if n in {"dangerous weapon", "weapon", "dangerous_weapon"}:
            WEAPON_IDS.add(cid)
            print(f"     ✓ Identified as WEAPON class")
    
    if not PERSON_IDS or not WEAPON_IDS:
        print("⚠ Warning: Could not infer PERSON_IDS/WEAPON_IDS from model.names")
        print("   Falling back to: Person=0, Weapon=1")
        PERSON_IDS = PERSON_IDS or {0}
        WEAPON_IDS = WEAPON_IDS or {1}
else:
    PERSON_IDS = {0}
    WEAPON_IDS = {1}

print(f"📊 Detection Configuration:")
print(f"   Person IDs: {sorted(list(PERSON_IDS))}")
print(f"   Weapon IDs: {sorted(list(WEAPON_IDS))}")
print(f"   Person Confidence: {PERSON_CONF}")
print(f"   Weapon Confidence: {WEAPON_CONF}")

TARGET_CLASSES = sorted(list(PERSON_IDS | WEAPON_IDS))


def iou(a, b):
    """Calculate Intersection over Union between two bounding boxes"""
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    inter_x1, inter_y1 = max(ax1, bx1), max(ay1, by1)
    inter_x2, inter_y2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0, inter_x2 - inter_x1), max(0, inter_y2 - inter_y1)
    inter = iw * ih
    a_area = max(0, (ax2 - ax1)) * max(0, (ay2 - ay1))
    b_area = max(0, (bx2 - bx1)) * max(0, (by2 - by1))
    union = a_area + b_area - inter
    return inter / union if union > 0 else 0.0


def is_weapon_near_person(weapon_box, person_box):
    """
    Check if weapon is near or held by person using multiple criteria:
    1. IoU overlap
    2. Weapon center inside person box
    3. Proximity check
    """
    w_x1, w_y1, w_x2, w_y2 = weapon_box
    p_x1, p_y1, p_x2, p_y2 = person_box
    
    # Calculate IoU
    overlap = iou(weapon_box, person_box)
    if overlap >= 0.05:  # Even small overlap counts
        return True, overlap
    
    # Check if weapon center is inside person box
    w_cx, w_cy = (w_x1 + w_x2) / 2, (w_y1 + w_y2) / 2
    if p_x1 <= w_cx <= p_x2 and p_y1 <= w_cy <= p_y2:
        return True, 1.0
    
    # Check proximity (weapon close to person)
    # Calculate minimum distance between boxes
    dx = max(0, max(p_x1 - w_x2, w_x1 - p_x2))
    dy = max(0, max(p_y1 - w_y2, w_y1 - p_y2))
    distance = np.sqrt(dx*dx + dy*dy)
    
    # If weapon is within 50 pixels of person, consider it associated
    person_height = p_y2 - p_y1
    threshold_distance = person_height * 0.3  # 30% of person height
    if distance < threshold_distance:
        proximity_score = 1.0 - (distance / threshold_distance)
        return True, proximity_score
    
    return False, 0.0


class VideoStream:
    """Manages a single video stream with weapon detection and 30s alert batching"""

    def __init__(self, feed_id, source, use_camera=False):
        self.feed_id = feed_id
        self.source = source if not use_camera else 0
        self.use_camera = use_camera
        self.cap = None
        self.frame_count = 0
        self.detection_count = 0
        self.last_detection_ts = None
        self.is_running = False

        # Frame caching
        self.last_annotated_frame = None
        self.last_annotated_lock = Lock()

        # Best detection in current window
        self.window_best_frame = None
        self.window_best_weapon_conf = 0.0
        self.window_best_association_score = 0.0
        self.window_started_at = datetime.now()

    def start(self):
        """Initialize and start the video stream"""
        if self.cap is not None:
            self.cap.release()
            self.cap = None
            time.sleep(0.5)  # Give time for camera to be released

        actual_source = self.source
        
        # Handle YouTube URLs
        if isinstance(self.source, str) and ('youtube.com' in self.source or 'youtu.be' in self.source):
            if YOUTUBE_SUPPORT:
                try:
                    print(f"📺 Extracting YouTube stream URL for feed {self.feed_id}...")
                    ydl_opts = {
                        'format': 'best[ext=mp4][height<=720]/best[height<=720]/best',
                        'quiet': True,
                        'no_warnings': True
                    }
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        info = ydl.extract_info(self.source, download=False)
                        actual_source = info['url']
                    print(f"✅ YouTube stream URL extracted for feed {self.feed_id}")
                except Exception as e:
                    print(f"❌ Error extracting YouTube URL for feed {self.feed_id}: {e}")
                    return False
            else:
                print(f"❌ YouTube support not available for feed {self.feed_id}")
                return False

        # Open video capture
        try:
            self.cap = cv2.VideoCapture(actual_source)
            
            # Set camera properties for better performance
            if self.use_camera:
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                self.cap.set(cv2.CAP_PROP_FPS, 30)
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            if not self.cap.isOpened():
                print(f"❌ Could not open video source for feed {self.feed_id}")
                return False
            
            # Test read
            success, test_frame = self.cap.read()
            if not success or test_frame is None:
                print(f"❌ Could not read test frame from feed {self.feed_id}")
                self.cap.release()
                return False
            
            self.is_running = True
            source_type = 'Webcam' if self.use_camera else 'Video Stream'
            print(f"✅ Feed {self.feed_id} started successfully ({source_type})")
            print(f"   Resolution: {int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}")
            return True
            
        except Exception as e:
            print(f"❌ Error starting feed {self.feed_id}: {e}")
            traceback.print_exc()
            return False

    def stop(self):
        """Stop the video stream"""
        self.is_running = False
        if self.cap is not None:
            self.cap.release()
            self.cap = None
            print(f"🛑 Feed {self.feed_id} stopped")

    def _emit_window_alert_if_due(self):
        """Emit alert if we have a good detection and enough time has passed"""
        now = datetime.now()
        
        # Must have a detection in the window
        if self.window_best_frame is None:
            return
        
        # Check cooldown
        if self.last_detection_ts and (now - self.last_detection_ts).total_seconds() < COOLDOWN_SEC:
            return
        
        # Check if window duration has passed
        if (now - self.window_started_at).total_seconds() < ALERT_INTERVAL_SEC:
            return

        # Emit the alert
        self.last_detection_ts = now
        self.detection_count += 1

        event = {
            'feed_id': self.feed_id,
            'timestamp': now.isoformat(),
            'frame_number': self.frame_count,
            'has_dangerous_weapon': True,
            'has_person': True,
            'source_type': 'Camera Feed' if self.use_camera else 'Video Feed',
            'weapon_conf': round(self.window_best_weapon_conf, 3),
            'association_score': round(self.window_best_association_score, 3)
        }
        
        global detection_seq
        with detection_lock:
            detection_seq += 1
            event['id'] = detection_seq  # assign SSE id
            detection_events.append(event)
            if len(detection_events) > 100:
                detection_events.pop(0)

        # Store the annotated frame
        with self.last_annotated_lock:
            self.last_annotated_frame = self.window_best_frame.copy()

        # Reset window
        self.window_best_frame = None
        self.window_best_weapon_conf = 0.0
        self.window_best_association_score = 0.0
        self.window_started_at = now
        
        print(f"⚠️  ALERT: Feed {self.feed_id} - Weapon detected with conf={event['weapon_conf']}, association={event['association_score']}")

    def get_latest_frame(self):
        """Get the most recent annotated frame"""
        with self.last_annotated_lock:
            if self.last_annotated_frame is None:
                return None
            return self.last_annotated_frame.copy()

    def process_once(self):
        """Process one frame from the stream"""
        if not self.is_running or self.cap is None:
            return False

        success, frame = self.cap.read()
        if not success or frame is None:
            # read failed (could be end-of-stream); caller may decide to restart
            print(f"⚠️  Failed to read frame from feed {self.feed_id}")
            return False

        # Validate frame dimensions
        if frame.size == 0 or len(frame.shape) < 2:
            print(f"⚠️  Invalid frame dimensions from feed {self.feed_id}")
            return False

        self.frame_count += 1
        
        # Skip frames for performance, but still update the raw frame
        if self.frame_count % FRAME_SKIP != 0:
            with self.last_annotated_lock:
                if self.last_annotated_frame is None:
                    self.last_annotated_frame = frame.copy()
            self._emit_window_alert_if_due()
            return True

        try:
            # Validate model is loaded
            if model is None:
                print(f"❌ Model not loaded for feed {self.feed_id}")
                return False

            # Run YOLO detection
            results = model.track(
                frame,
                persist=True,
                verbose=False,
                conf=DETECTION_CONFIDENCE,
                classes=TARGET_CLASSES if TARGET_CLASSES else None,
            )
            
            if results is None or len(results) == 0:
                print(f"⚠️  No results from model for feed {self.feed_id}")
                return False
            
            r0 = results[0]
            boxes = r0.boxes

            persons, weapons = [], []
            H, W = frame.shape[:2]
            MIN_REL_AREA_WEAPON = 0.001  # Minimum weapon size (0.1% of frame)

            # Extract detections
            if len(boxes) > 0:
                for i in range(len(boxes)):
                    box = boxes[i]
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    bbox = box.xyxy[0].tolist()
                    tid = int(box.id[0]) if box.id is not None else None

                    # Classify as person or weapon
                    if cls in PERSON_IDS and conf >= PERSON_CONF:
                        persons.append({'bbox': bbox, 'conf': conf, 'id': tid})
                    elif cls in WEAPON_IDS and conf >= WEAPON_CONF:
                        # Size filter to ignore tiny detections
                        x1, y1, x2, y2 = bbox
                        rel_area = max(0.0, (x2 - x1)) * max(0.0, (y2 - y1)) / (W * H)
                        if rel_area >= MIN_REL_AREA_WEAPON:
                            weapons.append({'bbox': bbox, 'conf': conf, 'id': tid})

            # Find weapon-person associations
            valid_pairs = []
            for w in weapons:
                for p in persons:
                    is_associated, score = is_weapon_near_person(w['bbox'], p['bbox'])
                    if is_associated:
                        valid_pairs.append((p, w, score))

            # Get annotated frame
            annotated = r0.plot()

            # Update window best detection
            if valid_pairs:
                best_pair = max(valid_pairs, key=lambda x: (x[1]['conf'], x[2]))  # Sort by weapon conf, then association
                _, best_weapon, best_score = best_pair
                best_w_conf = best_weapon['conf']
                
                # Add extra annotation for the dangerous detection
                for p, w, score in valid_pairs:
                    x1, y1, x2, y2 = map(int, w['bbox'])
                    # Draw red box around dangerous weapon
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 3)
                    cv2.putText(annotated, f"DANGER! {w['conf']:.2f}", (x1, y1-10), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                
                # Update window best if this is better
                if best_w_conf > self.window_best_weapon_conf:
                    self.window_best_weapon_conf = best_w_conf
                    self.window_best_association_score = best_score
                    self.window_best_frame = annotated.copy()
                    print(f"🎯 Feed {self.feed_id}: New best detection - weapon_conf={best_w_conf:.3f}, association={best_score:.3f}")

            # Update last frame for streaming
            with self.last_annotated_lock:
                self.last_annotated_frame = annotated

            # Check if it's time to emit an alert
            self._emit_window_alert_if_due()
            return True

        except Exception as e:
            print(f"❌ Detection error on feed {self.feed_id}: {e}")
            traceback.print_exc()
            # Use raw frame as fallback
            with self.last_annotated_lock:
                self.last_annotated_frame = frame.copy()
            return True


# Background monitor
class Monitor:
    def __init__(self):
        self.stop_event = Event()
        self.threads = []

    def start_all(self):
        """Start monitoring all configured feeds"""
        print("\n🚀 Starting feed monitoring...")
        for feed_id, src in VIDEO_SOURCES.items():
            use_camera = (src == 0)
            key = f"{feed_id}_{'camera' if use_camera else 'video'}"
            
            if key in active_streams:
                print(f"⏭️  Feed {feed_id} already active, skipping")
                continue
            
            stream = VideoStream(feed_id, src, use_camera=use_camera)
            if stream.start():
                active_streams[key] = stream
                # Start monitoring thread
                t = Thread(target=self._worker, args=(stream,), daemon=True)
                t.start()
                self.threads.append(t)
                print(f"✅ Monitoring thread started for feed {feed_id}")
            else:
                print(f"❌ Failed to start feed {feed_id}")

    def _worker(self, stream: VideoStream):
        """Worker thread to continuously process frames (auto-restarts on failures/YouTube end)"""
        print(f"🔄 Worker started for feed {stream.feed_id}")
        consecutive_failures = 0
        backoff = 0.5  # start gentle
        while not self.stop_event.is_set():
            # If stream is not running (or died), try to start/restart with backoff
            if not stream.is_running or stream.cap is None or not stream.cap.isOpened():
                if self.stop_event.is_set():
                    break
                print(f"♻️  Restarting feed {stream.feed_id}...")
                try:
                    stream.stop()
                except Exception:
                    traceback.print_exc()
                ok_start = stream.start()
                if not ok_start:
                    time.sleep(min(backoff, 10.0))
                    backoff = min(backoff * 2, 10.0)
                    continue
                # on successful start, reset counters
                consecutive_failures = 0
                backoff = 0.5

            try:
                ok = stream.process_once()
                if ok:
                    consecutive_failures = 0
                    time.sleep(0.03)
                else:
                    # read failed; could be transient or EOS, trigger restart after some failures
                    consecutive_failures += 1
                    time.sleep(0.5)
                    if consecutive_failures >= 20:  # ~10 seconds of failures -> restart
                        stream.stop()
                        # loop will attempt restart next iteration
            except Exception as e:
                print(f"❌ Worker error for feed {stream.feed_id}: {e}")
                traceback.print_exc()
                consecutive_failures += 1
                time.sleep(1)
                if consecutive_failures >= 10:
                    stream.stop()
        print(f"🛑 Worker stopped for feed {stream.feed_id}")

    def stop(self):
        """Stop all monitoring"""
        print("\n🛑 Stopping all monitoring...")
        self.stop_event.set()
        for stream in list(active_streams.values()):
            stream.stop()


monitor = Monitor()
atexit.register(monitor.stop)  # <-- added


def get_stream_for_feed(feed_id, source_type=None):
    """Get the stream for a specific feed"""
    if source_type in ("camera", "video"):
        key = f"{feed_id}_{source_type}"
        return active_streams.get(key)
    # Fallback: return any stream for this feed
    for key, s in active_streams.items():
        if key.startswith(f"{feed_id}_"):
            return s
    return None


@app.route('/video_feed/<int:feed_id>')
def video_feed(feed_id):
    """Stream video feed with detection annotations"""
    source_type = request.args.get('source', None)
    stream = get_stream_for_feed(feed_id, source_type)
    
    if stream is None:
        return jsonify({'error': f'Feed {feed_id} not active'}), 404

    def gen():
        """Generate MJPEG stream"""
        while stream.is_running:
            frame = stream.get_latest_frame()
            if frame is None:
                time.sleep(0.05)
                continue
            
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if not ret:
                continue
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(0.03)

    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/feeds')
def get_feeds():
    """Get status of all feeds"""
    feeds = []
    for feed_id in VIDEO_SOURCES.keys():
        video_key = f"{feed_id}_video"
        camera_key = f"{feed_id}_camera"
        is_active = False
        detection_count = 0
        last_detection = None
        
        for key in (video_key, camera_key):
            stream = active_streams.get(key)
            if stream and stream.is_running:
                is_active = True
                detection_count += stream.detection_count
                if stream.last_detection_ts:
                    if not last_detection or stream.last_detection_ts > last_detection:
                        last_detection = stream.last_detection_ts.isoformat()
        
        feeds.append({
            'id': feed_id,
            'status': 'active' if is_active else 'inactive',
            'detection_count': detection_count,
            'last_detection': last_detection
        })
    
    return jsonify({'feeds': feeds})


@app.route('/api/detections')
def get_detections():
    """Get recent detections"""
    with detection_lock:
        return jsonify({'detections': detection_events[-50:]})


@app.route('/api/detections/latest')
def get_latest_detection():
    """Get the most recent detection"""
    with detection_lock:
        if detection_events:
            return jsonify({'detection': detection_events[-1]})
        return jsonify({'detection': None})


@app.route('/api/capture/<int:feed_id>')
def capture_screenshot(feed_id):
    """Capture a screenshot from a feed"""
    source_type = request.args.get('source', None)
    stream = get_stream_for_feed(feed_id, source_type)
    
    if stream is None:
        return jsonify({'error': 'Feed not active'}), 404

    # Use best frame from window if available
    frame = stream.window_best_frame if stream.window_best_frame is not None else stream.get_latest_frame()
    if frame is None:
        return jsonify({'error': 'No frame available'}), 500

    frame_copy = frame.copy()
    cv2.putText(frame_copy, f"FEED {stream.feed_id}", (10, 30), 
               cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
    
    ret, buffer = cv2.imencode('.jpg', frame_copy, [cv2.IMWRITE_JPEG_QUALITY, 95])
    if not ret:
        return jsonify({'error': 'Failed to encode frame'}), 500

    return Response(buffer.tobytes(), mimetype='image/jpeg')


@app.route('/api/feed/<int:feed_id>/snapshot')
def get_snapshot(feed_id):
    """Get a base64-encoded snapshot"""
    stream = get_stream_for_feed(feed_id)
    if stream is None:
        return jsonify({'error': 'Feed not active'}), 404

    frame = stream.get_latest_frame()
    if frame is None:
        return jsonify({'error': 'No frame available'}), 500

    ret, buffer = cv2.imencode('.jpg', frame)
    if not ret:
        return jsonify({'error': 'Failed to encode frame'}), 500

    img_base64 = base64.b64encode(buffer).decode('utf-8')
    return jsonify({
        'snapshot': f'data:image/jpeg;base64,{img_base64}',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'model_loaded': model is not None,
        'active_streams': len(active_streams),
        'total_detections': sum(s.detection_count for s in active_streams.values()),
        'alert_interval_sec': ALERT_INTERVAL_SEC,
        'cooldown_sec': COOLDOWN_SEC
    })


@app.route('/')
def index():
    """API documentation"""
    return jsonify({
        'service': 'CrimeShield Weapon Detection API',
        'version': '2.0',
        'status': 'operational',
        'endpoints': {
            'video_feed': '/video_feed/<feed_id>',
            'feeds_list': '/api/feeds',
            'detections': '/api/detections',
            'latest_detection': '/api/detections/latest',
            'snapshot': '/api/feed/<feed_id>/snapshot',
            'capture': '/api/capture/<feed_id>',
            'health': '/api/health',
            'alerts_stream': '/api/alerts/stream'  # <-- added
        },
        'available_feeds': list(VIDEO_SOURCES.keys()),
        'classes': {
            'person_ids': sorted(list(PERSON_IDS)),
            'weapon_ids': sorted(list(WEAPON_IDS)),
        }
    })


# --- NEW: Server-Sent Events stream for real-time alerts ---
@app.route('/api/alerts/stream')
def alerts_stream():
    """
    SSE stream: emits a 'detection' event whenever a new detection is appended.
    Frontend example:
        const es = new EventSource('/api/alerts/stream');
        es.addEventListener('detection', (evt) => {
            const data = JSON.parse(evt.data);
            console.log('ALERT', data);
        });
    """
    def event_stream(last_seen_id=0):
        # Respect Last-Event-ID header for reconnections
        hdr_id = request.headers.get('Last-Event-ID')
        if hdr_id and hdr_id.isdigit():
            last_seen_id = int(hdr_id)

        # Send initial comment to establish connection (triggers onopen)
        yield ": SSE connection established\n\n"
        print(f"✅ SSE client connected from {request.remote_addr}")

        while True:
            # Pull any events with id > last_seen_id
            with detection_lock:
                new_events = [e for e in detection_events if e.get('id', 0) > last_seen_id]
            if new_events:
                for e in new_events:
                    payload = json.dumps(e)
                    # SSE formatted message
                    yield f"id: {e['id']}\nevent: detection\ndata: {payload}\n\n"
                    last_seen_id = e['id']
            # Prevent tight loop; also keeps connection alive
            time.sleep(0.5)

    headers = {
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',  # for nginx: do not buffer
        'Connection': 'keep-alive'
    }
    return Response(event_stream(), mimetype='text/event-stream', headers=headers)


# REMOVED teardown that was killing workers:
# @app.teardown_appcontext
# def cleanup(error=None):
#     """Cleanup on shutdown"""
#     monitor.stop()


if __name__ == '__main__':
    print("=" * 70)
    print("      CrimeShield AI - Weapon Detection Server")
    print("=" * 70)
    print(f"📦 Model: {MODEL_PATH}")
    print(f"📹 Available Feeds: {list(VIDEO_SOURCES.keys())}")
    print(f"⏱️  Alert Interval: {ALERT_INTERVAL_SEC}s")
    print(f"⏸️  Cooldown: {COOLDOWN_SEC}s")
    print(f"🎯 Detection Confidence: {DETECTION_CONFIDENCE}")
    print("=" * 70)
    print("\n📡 Endpoints:")
    print("   Video Streams: http://localhost:5000/video_feed/<feed_id>")
    print("   API Docs:      http://localhost:5000/")
    print("   Health Check:  http://localhost:5000/api/health")
    print("   Alerts SSE:    http://localhost:5000/api/alerts/stream")
    print("=" * 70)
    print("\n🚀 Starting server and background monitoring...\n")

    # Start background monitoring
    monitor.start_all()

    # Start Flask server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,
        threaded=True,
        use_reloader=False  # keep workers stable
    )