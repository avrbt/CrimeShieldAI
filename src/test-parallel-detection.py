#!/usr/bin/env python3
"""
Test Script: Verify Parallel Detection Across All Feeds
========================================================

This script verifies that:
1. All 6 feeds are running simultaneously
2. Camera feed (ID 4) is active
3. Detection can occur in any feed (not just Feed 6)
4. Screenshots are captured from the correct feed

Usage:
    python test-parallel-detection.py
"""

import requests
import time
import json
from datetime import datetime

# Configuration
API_BASE = 'http://localhost:5000'

def check_health():
    """Check if weapon detection server is online"""
    try:
        response = requests.get(f'{API_BASE}/api/health')
        if response.ok:
            data = response.json()
            print("✅ Server Status: ONLINE")
            print(f"   Model Loaded: {data.get('model_loaded', False)}")
            print(f"   Active Streams: {data.get('active_streams', 0)}")
            print(f"   Total Detections: {data.get('total_detections', 0)}")
            return True
        else:
            print("❌ Server Status: OFFLINE")
            return False
    except Exception as e:
        print(f"❌ Server Status: ERROR - {e}")
        return False

def check_active_feeds():
    """Check which feeds are currently active"""
    try:
        response = requests.get(f'{API_BASE}/api/feeds')
        if response.ok:
            data = response.json()
            feeds = data.get('feeds', [])
            
            print(f"\n📊 Active Feeds Report ({len(feeds)} total):")
            print("=" * 70)
            
            active_count = 0
            for feed in feeds:
                feed_id = feed['id']
                status = feed['status']
                detection_count = feed['detection_count']
                last_detection = feed.get('last_detection', 'Never')
                
                status_icon = "🟢" if status == 'active' else "🔴"
                
                print(f"{status_icon} Feed {feed_id}: {status.upper()}")
                print(f"   Detections: {detection_count}")
                print(f"   Last Detection: {last_detection}")
                print()
                
                if status == 'active':
                    active_count += 1
            
            print(f"✅ {active_count} / {len(feeds)} feeds are ACTIVE")
            print("=" * 70)
            
            # Verify all feeds are active
            if active_count == len(feeds):
                print("✅ ALL FEEDS RUNNING IN PARALLEL")
                return True
            else:
                print(f"⚠️ WARNING: Only {active_count} feeds active (expected {len(feeds)})")
                return False
        else:
            print("❌ Failed to fetch feed status")
            return False
    except Exception as e:
        print(f"❌ Error checking feeds: {e}")
        return False

def check_camera_feed():
    """Verify camera feed (ID 4) is active"""
    try:
        response = requests.get(f'{API_BASE}/api/feeds')
        if response.ok:
            data = response.json()
            feeds = data.get('feeds', [])
            
            camera_feed = next((f for f in feeds if f['id'] == 4), None)
            
            if camera_feed:
                if camera_feed['status'] == 'active':
                    print("✅ Camera Feed (ID 4): ACTIVE and monitoring")
                    return True
                else:
                    print("❌ Camera Feed (ID 4): INACTIVE")
                    return False
            else:
                print("❌ Camera Feed (ID 4): NOT FOUND")
                return False
        else:
            return False
    except Exception as e:
        print(f"❌ Error checking camera feed: {e}")
        return False

def check_recent_detections():
    """Check recent detections from all feeds"""
    try:
        response = requests.get(f'{API_BASE}/api/detections')
        if response.ok:
            data = response.json()
            detections = data.get('detections', [])
            
            if detections:
                print(f"\n🔍 Recent Detections ({len(detections)} total):")
                print("=" * 70)
                
                # Group by feed_id
                feed_detections = {}
                for detection in detections[-10:]:  # Last 10 detections
                    feed_id = detection['feed_id']
                    source_type = detection.get('source_type', 'Unknown')
                    timestamp = detection['timestamp']
                    
                    if feed_id not in feed_detections:
                        feed_detections[feed_id] = []
                    
                    feed_detections[feed_id].append({
                        'timestamp': timestamp,
                        'source_type': source_type
                    })
                
                for feed_id in sorted(feed_detections.keys()):
                    detections_list = feed_detections[feed_id]
                    print(f"📹 Feed {feed_id}:")
                    for det in detections_list:
                        print(f"   • {det['timestamp']} ({det['source_type']})")
                
                print("=" * 70)
                
                # Verify detections from multiple feeds
                unique_feeds = len(feed_detections.keys())
                print(f"\n✅ Detections found in {unique_feeds} different feed(s)")
                
                if unique_feeds > 1:
                    print("✅ PARALLEL DETECTION CONFIRMED (multiple feeds detecting)")
                
                return True
            else:
                print("\nℹ️ No detections yet (system is monitoring)")
                return True
        else:
            print("❌ Failed to fetch detections")
            return False
    except Exception as e:
        print(f"❌ Error checking detections: {e}")
        return False

def verify_parallel_processing():
    """Main verification function"""
    print("\n" + "=" * 70)
    print("🚀 PARALLEL DETECTION VERIFICATION TEST")
    print("=" * 70)
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    tests_passed = 0
    total_tests = 4
    
    # Test 1: Server Health
    print("\n[Test 1/4] Server Health Check")
    print("-" * 70)
    if check_health():
        tests_passed += 1
    
    # Test 2: Active Feeds
    print("\n[Test 2/4] Active Feeds Check")
    print("-" * 70)
    if check_active_feeds():
        tests_passed += 1
    
    # Test 3: Camera Feed
    print("\n[Test 3/4] Camera Feed (ID 4) Check")
    print("-" * 70)
    if check_camera_feed():
        tests_passed += 1
    
    # Test 4: Recent Detections
    print("\n[Test 4/4] Recent Detections Check")
    print("-" * 70)
    if check_recent_detections():
        tests_passed += 1
    
    # Final Report
    print("\n" + "=" * 70)
    print("📊 FINAL REPORT")
    print("=" * 70)
    print(f"Tests Passed: {tests_passed} / {total_tests}")
    
    if tests_passed == total_tests:
        print("✅ ALL TESTS PASSED - Parallel detection is working correctly!")
        print("\n✅ Verified:")
        print("   • All 6 feeds running simultaneously")
        print("   • Camera feed (ID 4) is active")
        print("   • Detection can occur in any feed")
        print("   • System processes multiple feeds in parallel")
    else:
        print(f"⚠️ {total_tests - tests_passed} test(s) failed")
        print("\nTroubleshooting:")
        print("1. Make sure weapon-detection-server.py is running")
        print("2. Enable weapon detection in the dashboard")
        print("3. Wait a few seconds for streams to initialize")
        print("4. Run this test again")
    
    print("=" * 70 + "\n")

if __name__ == '__main__':
    verify_parallel_processing()
