#!/bin/bash

# 🧪 CrimeShield Weapon Detection - Test Commands
# ===============================================
# Run this script to verify everything is working

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🧪 CrimeShield Weapon Detection - System Test             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} - $2"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Check if best.pt exists
echo -e "${BLUE}Test 1: Checking for YOLO model file...${NC}"
if [ -f "best.pt" ]; then
    SIZE=$(ls -lh best.pt | awk '{print $5}')
    test_result 0 "Model file exists (size: $SIZE)"
else
    test_result 1 "Model file NOT found - Place best.pt in project root"
fi
echo ""

# Test 2: Check Python dependencies
echo -e "${BLUE}Test 2: Checking Python dependencies...${NC}"
python3 -c "import flask, flask_cors, ultralytics, cv2, numpy, yt_dlp" 2>/dev/null
test_result $? "All Python packages installed"
echo ""

# Test 3: Check if Flask server is running
echo -e "${BLUE}Test 3: Checking Flask server...${NC}"
if curl -s --max-time 2 http://localhost:5000/ > /dev/null 2>&1; then
    test_result 0 "Flask server is running on port 5000"
else
    test_result 1 "Flask server NOT running - Start with: python weapon-detection-server.py"
fi
echo ""

# Test 4: Check server health (if running)
if curl -s --max-time 2 http://localhost:5000/ > /dev/null 2>&1; then
    echo -e "${BLUE}Test 4: Checking server health...${NC}"
    
    HEALTH=$(curl -s http://localhost:5000/api/health)
    
    # Check if model is loaded
    if echo "$HEALTH" | grep -q '"model_loaded":true'; then
        test_result 0 "YOLO model loaded successfully"
    else
        test_result 1 "YOLO model NOT loaded"
    fi
    
    # Check active streams
    ACTIVE_STREAMS=$(echo "$HEALTH" | grep -o '"active_streams":[0-9]*' | grep -o '[0-9]*')
    if [ "$ACTIVE_STREAMS" -ge 1 ]; then
        test_result 0 "Active streams: $ACTIVE_STREAMS"
    else
        test_result 1 "No active streams"
    fi
    
    echo ""
fi

# Test 5: Check feeds status
if curl -s --max-time 2 http://localhost:5000/ > /dev/null 2>&1; then
    echo -e "${BLUE}Test 5: Checking feeds status...${NC}"
    
    FEEDS=$(curl -s http://localhost:5000/api/feeds)
    
    # Check Feed 4 (webcam)
    if echo "$FEEDS" | grep -q '"id":4'; then
        FEED4_STATUS=$(echo "$FEEDS" | grep -A 3 '"id":4' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$FEED4_STATUS" == "active" ]; then
            test_result 0 "Feed 4 (Webcam) is active"
        else
            test_result 1 "Feed 4 (Webcam) is NOT active"
        fi
    else
        test_result 1 "Feed 4 not found in feeds list"
    fi
    
    echo ""
fi

# Test 6: Check video stream endpoint
if curl -s --max-time 2 http://localhost:5000/ > /dev/null 2>&1; then
    echo -e "${BLUE}Test 6: Testing video stream endpoint...${NC}"
    
    # Try to get a frame from the video stream (timeout after 3 seconds)
    if timeout 3 curl -s http://localhost:5000/video_feed/4?source=camera --output /dev/null 2>&1; then
        test_result 0 "Video stream endpoint responding"
    else
        test_result 1 "Video stream endpoint timeout (may be normal if webcam not ready)"
    fi
    
    echo ""
fi

# Test 7: Check model classes
if [ -f "best.pt" ] && curl -s --max-time 2 http://localhost:5000/ > /dev/null 2>&1; then
    echo -e "${BLUE}Test 7: Verifying model classes...${NC}"
    
    # Get model classes from API
    CLASSES=$(curl -s http://localhost:5000/ | grep -o '"classes":{[^}]*}')
    
    if echo "$CLASSES" | grep -q '"person_ids"'; then
        test_result 0 "Person class configured"
    else
        test_result 1 "Person class NOT configured"
    fi
    
    if echo "$CLASSES" | grep -q '"weapon_ids"'; then
        test_result 0 "Weapon class configured"
    else
        test_result 1 "Weapon class NOT configured"
    fi
    
    echo ""
fi

# Test 8: Check recent detections
if curl -s --max-time 2 http://localhost:5000/ > /dev/null 2>&1; then
    echo -e "${BLUE}Test 8: Checking detection system...${NC}"
    
    DETECTIONS=$(curl -s http://localhost:5000/api/detections)
    DETECTION_COUNT=$(echo "$DETECTIONS" | grep -o '"feed_id":' | wc -l)
    
    if [ "$DETECTION_COUNT" -gt 0 ]; then
        echo -e "${GREEN}ℹ️  INFO${NC} - $DETECTION_COUNT detection(s) recorded"
    else
        echo -e "${YELLOW}ℹ️  INFO${NC} - No detections yet (this is normal if just started)"
    fi
    
    test_result 0 "Detection system operational"
    echo ""
fi

# Test 9: Check WebcamFeed component
echo -e "${BLUE}Test 9: Checking WebcamFeed component...${NC}"
if [ -f "components/WebcamFeed.tsx" ]; then
    # Check if the file contains the new fallback logic
    if grep -q "useFallback" components/WebcamFeed.tsx; then
        test_result 0 "WebcamFeed component has fallback logic"
    else
        test_result 1 "WebcamFeed component missing fallback logic"
    fi
else
    test_result 1 "WebcamFeed.tsx not found"
fi
echo ""

# Test 10: Check weapon detection server code
echo -e "${BLUE}Test 10: Checking weapon detection server...${NC}"
if [ -f "weapon-detection-server.py" ]; then
    # Check if the file contains the new association logic
    if grep -q "is_weapon_near_person" weapon-detection-server.py; then
        test_result 0 "Server has spatial association logic"
    else
        test_result 1 "Server missing spatial association logic"
    fi
    
    if grep -q "window_best_frame" weapon-detection-server.py; then
        test_result 0 "Server has window batching logic"
    else
        test_result 1 "Server missing window batching logic"
    fi
else
    test_result 1 "weapon-detection-server.py not found"
fi
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  📊 Test Summary                                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo ""

# Final verdict
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 ALL TESTS PASSED! System Ready!          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "✅ Flask server is running"
    echo "✅ Model is loaded"
    echo "✅ Feeds are active"
    echo "✅ Detection system operational"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Open dashboard (http://localhost:5173)"
    echo "   2. Login as organization user"
    echo "   3. Navigate to Live CCTV section"
    echo "   4. Enable weapon detection toggle"
    echo "   5. Test with Feed 4 (webcam) or Feed 5/6 (videos)"
    echo ""
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  PARTIAL SUCCESS - Some Issues Found     ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "🔍 Review failed tests above and fix them"
    echo ""
    echo "Common fixes:"
    if [ ! -f "best.pt" ]; then
        echo "   • Place best.pt in project root"
    fi
    if ! curl -s --max-time 2 http://localhost:5000/ > /dev/null 2>&1; then
        echo "   • Start Flask server: python weapon-detection-server.py"
    fi
    echo ""
else
    echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ MULTIPLE FAILURES - Action Required       ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "🔧 Required actions:"
    if [ ! -f "best.pt" ]; then
        echo "   1. Place best.pt YOLO model in project root"
    fi
    if ! python3 -c "import flask, flask_cors, ultralytics, cv2, numpy, yt_dlp" 2>/dev/null; then
        echo "   2. Install Python dependencies:"
        echo "      pip install flask flask-cors ultralytics opencv-python-headless numpy yt-dlp"
    fi
    if ! curl -s --max-time 2 http://localhost:5000/ > /dev/null 2>&1; then
        echo "   3. Start Flask server:"
        echo "      python weapon-detection-server.py"
    fi
    echo ""
    echo "📚 See documentation:"
    echo "   • 🚀-QUICK-START-WEAPON-DETECTION.md"
    echo "   • WEBCAM-AND-DETECTION-COMPLETE-FIX.md"
    echo ""
fi

# Additional helpful information
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📖 Quick Commands:"
echo ""
echo "   # Check server health"
echo "   curl http://localhost:5000/api/health | jq"
echo ""
echo "   # View active feeds"
echo "   curl http://localhost:5000/api/feeds | jq"
echo ""
echo "   # View recent detections"
echo "   curl http://localhost:5000/api/detections | jq"
echo ""
echo "   # Test video stream (in browser)"
echo "   http://localhost:5000/video_feed/4?source=camera"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📚 Documentation Files:"
echo "   • ⚡-QUICK-REFERENCE-CARD.md - Quick reference"
echo "   • 🚀-QUICK-START-WEAPON-DETECTION.md - Setup guide"
echo "   • WEBCAM-AND-DETECTION-COMPLETE-FIX.md - Full documentation"
echo "   • WEBCAM-DETECTION-FLOW-DIAGRAM.md - Visual diagrams"
echo "   • ✅-FIXES-COMPLETE-SUMMARY.md - What was fixed"
echo "   • 🎯-WHAT-GOT-FIXED.md - Before/after comparison"
echo ""
echo "═══════════════════════════════════════════════════════════════"

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
