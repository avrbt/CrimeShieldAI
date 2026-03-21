#!/usr/bin/env python3
"""
Quick test script to verify feed IDs are working correctly
"""

import requests
import json
import time
from collections import defaultdict

API_BASE = 'http://localhost:5000'

def test_feed_ids():
    print("=" * 60)
    print("🔍 CrimeShield Feed ID Test")
    print("=" * 60)
    
    # Step 1: Check backend health
    print("\n📡 Step 1: Checking backend health...")
    try:
        health = requests.get(f"{API_BASE}/api/health", timeout=5).json()
        print(f"   ✅ Status: {health.get('status')}")
        print(f"   ✅ Model Loaded: {health.get('model_loaded')}")
        
        if 'active_streams' in health:
            print(f"   ✅ Active Streams: {len(health['active_streams'])}")
            for stream_key, stream_info in health['active_streams'].items():
                print(f"      - {stream_key}: feed_id={stream_info.get('feed_id')}, detections={stream_info.get('detection_count', 0)}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print("   Make sure weapon-detection-server.py is running!")
        return
    
    # Step 2: Check existing detections
    print("\n📊 Step 2: Checking recent detection events...")
    try:
        detections_resp = requests.get(f"{API_BASE}/api/detections", timeout=5).json()
        detections = detections_resp.get('detections', [])
        
        if detections:
            print(f"   ✅ Found {len(detections)} total detection events")
            
            # Count detections per feed
            feed_counts = defaultdict(int)
            recent_detections = detections[-20:]  # Last 20
            
            for det in recent_detections:
                feed_id = det.get('feed_id')
                feed_counts[feed_id] += 1
            
            print(f"\n   📈 Recent detections (last {len(recent_detections)}) by feed:")
            for feed_id in sorted(feed_counts.keys()):
                count = feed_counts[feed_id]
                percentage = (count / len(recent_detections)) * 100
                print(f"      Feed {feed_id}: {count} detections ({percentage:.1f}%)")
            
            # Check if only one feed is detecting
            if len(feed_counts) == 1:
                only_feed = list(feed_counts.keys())[0]
                print(f"\n   ⚠️  WARNING: Only Feed {only_feed} has detections!")
                print(f"   This might be normal if other feeds don't have weapons.")
                
                if only_feed == 6:
                    print(f"\n   💡 Feed 6 is the Airport Terminal video with weapons.")
                    print(f"   To test other feeds:")
                    print(f"      - Feed 5: Should auto-detect (YouTube Shorts)")
                    print(f"      - Feed 4: Hold weapon image to webcam")
                    print(f"      - Feeds 1-3: Live city streams (unlikely to have weapons)")
            else:
                print(f"\n   ✅ Multiple feeds detecting! System working correctly.")
            
            # Show sample detections
            print(f"\n   📋 Sample recent detections:")
            for det in detections[-5:]:
                feed_id = det.get('feed_id')
                source = det.get('source_type', 'Unknown')
                timestamp = det.get('timestamp', 'Unknown')[:19]
                print(f"      - Feed {feed_id} ({source}) at {timestamp}")
        else:
            print("   ⚠️  No detection events found yet")
            print("   Wait 30-60 seconds after enabling weapon detection")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Step 3: Test feed access
    print("\n🎬 Step 3: Testing feed accessibility...")
    for feed_id in [1, 2, 3, 4, 5, 6]:
        try:
            # Test video source
            resp = requests.get(f"{API_BASE}/video_feed/{feed_id}?source=video", 
                              timeout=2, stream=True)
            if resp.status_code == 200:
                print(f"   ✅ Feed {feed_id} (video) accessible")
            else:
                print(f"   ❌ Feed {feed_id} (video) error: {resp.status_code}")
        except requests.exceptions.Timeout:
            print(f"   ⏱️  Feed {feed_id} (video) timeout (might be loading)")
        except Exception as e:
            print(f"   ❌ Feed {feed_id} (video) error: {str(e)[:50]}")
    
    # Step 4: Recommendations
    print("\n" + "=" * 60)
    print("📝 Recommendations:")
    print("=" * 60)
    
    if detections:
        unique_feeds = len(feed_counts)
        if unique_feeds == 1 and 6 in feed_counts:
            print("""
   🎯 Only Feed 6 is detecting. This is NORMAL if:
      - Feed 6 has a weapon detection video ✅
      - Other feeds are live streams without weapons ✅
      
   ✅ To verify system is working on other feeds:
      1. Test Feed 4: Hold weapon+person image to webcam
      2. Watch for alert: "Residential Zone A (Feed ID: 4)"
      3. Check evidence section for Feed 4 entry
      
   📹 Current Video Sources:
      - Feed 1-3: Live city streams (no weapons expected)
      - Feed 4: Webcam (only detects when shown weapon)
      - Feed 5: YouTube Shorts (check if it has weapons)
      - Feed 6: YouTube Video (has weapons - confirmed working)
            """)
        elif unique_feeds > 1:
            print("""
   ✅ Multiple feeds are detecting!
   ✅ Feed ID system is working correctly!
   ✅ Each feed is properly tracked and identified!
   
   No issues found. System operating normally.
            """)
    else:
        print("""
   ⚠️  No detections found yet.
   
   Steps to generate detections:
   1. Start backend: python weapon-detection-server.py
   2. Open dashboard and enable weapon detection
   3. Wait 30-60 seconds for Feed 6 to auto-detect
   4. Check this script again
        """)
    
    print("=" * 60)

if __name__ == "__main__":
    test_feed_ids()
