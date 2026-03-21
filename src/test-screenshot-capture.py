#!/usr/bin/env python3
"""
Test script to verify screenshot capture from correct feeds
"""

import requests
import time
import json
from pathlib import Path

API_BASE = 'http://localhost:5000'

def test_screenshot_capture():
    print("="*70)
    print("🔍 Testing Screenshot Capture from Correct Feeds")
    print("="*70)
    
    # Step 1: Check backend health
    print("\n📡 Step 1: Checking backend...")
    try:
        health = requests.get(f"{API_BASE}/api/health", timeout=5).json()
        print(f"   ✅ Backend: {health['status']}")
        print(f"   ✅ Model: {'Loaded' if health['model_loaded'] else 'Not loaded'}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print("   Make sure weapon-detection-server.py is running!")
        return
    
    # Step 2: Check active streams
    print("\n🎬 Step 2: Checking active streams...")
    try:
        feeds_resp = requests.get(f"{API_BASE}/api/feeds", timeout=5).json()
        active_feeds = [f for f in feeds_resp['feeds'] if f.get('is_active')]
        
        if active_feeds:
            print(f"   ✅ Found {len(active_feeds)} active feed(s):")
            for feed in active_feeds:
                feed_id = feed['feed_id']
                detection_count = feed.get('detection_count', 0)
                print(f"      - Feed {feed_id}: {detection_count} detections")
        else:
            print("   ⚠️  No active feeds. Enable weapon detection in dashboard first!")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 3: Get recent detections
    print("\n📊 Step 3: Getting recent detections...")
    try:
        detections_resp = requests.get(f"{API_BASE}/api/detections", timeout=5).json()
        detections = detections_resp.get('detections', [])
        
        if not detections:
            print("   ⚠️  No detections found. Wait 30-60 seconds for auto-detection.")
            return
        
        # Get unique feed IDs from detections
        feed_ids_detected = set(d['feed_id'] for d in detections[-10:])
        print(f"   ✅ Detections from feeds: {sorted(feed_ids_detected)}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 4: Test screenshot capture for each detected feed
    print("\n📸 Step 4: Testing screenshot capture...")
    
    output_dir = Path("test_screenshots")
    output_dir.mkdir(exist_ok=True)
    
    results = []
    
    for feed_id in sorted(feed_ids_detected):
        # Find a recent detection from this feed
        feed_detections = [d for d in detections if d['feed_id'] == feed_id]
        if not feed_detections:
            continue
        
        detection = feed_detections[-1]  # Most recent
        source_type = detection.get('source_type', 'Video Feed')
        source_param = 'camera' if source_type == 'Camera Feed' else 'video'
        
        print(f"\n   📷 Testing Feed {feed_id} ({source_type})...")
        print(f"      Source parameter: {source_param}")
        
        try:
            # Capture screenshot
            capture_url = f"{API_BASE}/api/capture/{feed_id}?source={source_param}"
            print(f"      URL: {capture_url}")
            
            resp = requests.get(capture_url, timeout=10)
            
            if resp.status_code == 200:
                # Save screenshot
                filename = f"feed_{feed_id}_{source_param}.jpg"
                filepath = output_dir / filename
                
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                
                file_size = len(resp.content)
                print(f"      ✅ Captured: {file_size} bytes")
                print(f"      💾 Saved to: {filepath}")
                
                results.append({
                    'feed_id': feed_id,
                    'source_type': source_type,
                    'success': True,
                    'file': str(filepath),
                    'size': file_size
                })
            else:
                error_msg = resp.text
                print(f"      ❌ Failed: HTTP {resp.status_code}")
                print(f"      Error: {error_msg[:100]}")
                
                results.append({
                    'feed_id': feed_id,
                    'source_type': source_type,
                    'success': False,
                    'error': f"HTTP {resp.status_code}"
                })
                
        except Exception as e:
            print(f"      ❌ Exception: {str(e)[:100]}")
            results.append({
                'feed_id': feed_id,
                'source_type': source_type,
                'success': False,
                'error': str(e)[:100]
            })
    
    # Step 5: Summary
    print("\n" + "="*70)
    print("📋 SUMMARY")
    print("="*70)
    
    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]
    
    if successful:
        print(f"\n✅ Successfully captured {len(successful)} screenshot(s):")
        for r in successful:
            print(f"   - Feed {r['feed_id']} ({r['source_type']}): {r['file']}")
        
        print(f"\n📁 Screenshots saved in: {output_dir.absolute()}")
        print(f"\n🔍 VERIFICATION STEPS:")
        print(f"   1. Open each screenshot")
        print(f"   2. Look for 'FEED X' text in top-left corner")
        print(f"   3. Verify content matches the feed:")
        print(f"      - Feed 4: Should show webcam content")
        print(f"      - Feed 5: Should show Industrial Zone video")
        print(f"      - Feed 6: Should show Airport Terminal video")
        print(f"   4. Check for bounding boxes around detections")
    
    if failed:
        print(f"\n❌ Failed to capture {len(failed)} screenshot(s):")
        for r in failed:
            print(f"   - Feed {r['feed_id']} ({r['source_type']}): {r['error']}")
    
    if not successful and not failed:
        print("\n⚠️  No feeds tested. Enable weapon detection and wait for detections.")
    
    # Step 6: Visual verification instructions
    if successful:
        print("\n" + "="*70)
        print("🎯 VISUAL VERIFICATION")
        print("="*70)
        print("""
To verify screenshots are from correct feeds:

1. Open test_screenshots/ folder
2. For each screenshot:
   a. Check 'FEED X' overlay in top-left corner
   b. Verify feed ID matches filename
   c. Verify content is from that specific feed

Example:
   - feed_5_video.jpg should show:
     ✅ "FEED 5" text overlay
     ✅ Industrial Zone video content
     ✅ Bounding boxes around person + weapon
     ❌ NOT webcam content
     ❌ NOT "FEED 4" or "FEED 6" text

3. If any screenshot shows wrong feed ID or wrong content:
   → There's a stream lookup issue in the backend
   → Check backend logs during capture
   → Verify stream_key generation is correct

4. If all screenshots match their feed IDs:
   ✅ Screenshot capture is working correctly!
   ✅ Evidence section should show correct screenshots!
        """)
    
    print("="*70)

if __name__ == "__main__":
    test_screenshot_capture()
