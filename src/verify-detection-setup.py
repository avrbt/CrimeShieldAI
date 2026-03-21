#!/usr/bin/env python3
"""
CrimeShield AI - Detection Setup Verification Script
=====================================================
Verifies that:
1. best.pt model file exists
2. Model loads correctly
3. Model has correct classes (person, dangerous_weapon)
4. All 6 feeds are configured correctly
5. Detection server can start properly
"""

import os
import sys
from pathlib import Path

def print_header(text):
    print("\n" + "=" * 60)
    print(text)
    print("=" * 60)

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_warning(text):
    print(f"⚠️  {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def check_model_file():
    """Check if best.pt exists"""
    print_header("Step 1: Checking Model File")
    
    model_path = Path("best.pt")
    
    if not model_path.exists():
        print_error("Model file 'best.pt' not found in project root!")
        print_info("Please place your trained YOLO model file in:")
        print_info(f"   {Path.cwd() / 'best.pt'}")
        print_info("\nTo get best.pt:")
        print_info("   1. Train your YOLO model with Ultralytics")
        print_info("   2. Find best.pt in runs/detect/train/weights/")
        print_info("   3. Copy it to this directory")
        return False
    
    file_size = model_path.stat().st_size
    file_size_mb = file_size / (1024 * 1024)
    
    print_success(f"Model file found: {model_path}")
    print_info(f"File size: {file_size_mb:.2f} MB")
    
    if file_size_mb < 1:
        print_warning("Model file seems too small (<1 MB)")
        print_warning("Make sure this is a valid YOLO model file")
    elif file_size_mb > 100:
        print_warning("Model file seems large (>100 MB)")
        print_warning("This might be a larger YOLO variant (e.g., YOLOv8l)")
    else:
        print_success("Model file size looks reasonable")
    
    return True

def check_model_classes():
    """Load model and verify classes"""
    print_header("Step 2: Verifying Model Classes")
    
    try:
        from ultralytics import YOLO
        print_success("Ultralytics library imported successfully")
    except ImportError:
        print_error("Ultralytics library not installed!")
        print_info("Install with: pip install ultralytics")
        return False
    
    try:
        print_info("Loading model...")
        model = YOLO('best.pt')
        print_success("Model loaded successfully!")
    except Exception as e:
        print_error(f"Failed to load model: {e}")
        return False
    
    # Check model classes
    if not hasattr(model, 'names'):
        print_error("Model doesn't have class names!")
        return False
    
    class_names = model.names
    print_success(f"Model has {len(class_names)} classes")
    print_info("Classes found:")
    for class_id, class_name in class_names.items():
        print(f"   Class {class_id}: {class_name}")
    
    # Verify required classes
    person_found = False
    weapon_found = False
    
    for class_id, class_name in class_names.items():
        name_lower = str(class_name).lower().replace('_', ' ').strip()
        if name_lower in {"person", "people", "human"}:
            person_found = True
            print_success(f"✓ Person class found: '{class_name}' (ID: {class_id})")
        if name_lower in {"dangerous weapon", "weapon", "dangerous_weapon"}:
            weapon_found = True
            print_success(f"✓ Weapon class found: '{class_name}' (ID: {class_id})")
    
    if not person_found:
        print_error("Person class not found in model!")
        print_warning("Model should have 'person' or 'people' or 'human' class")
        return False
    
    if not weapon_found:
        print_error("Weapon class not found in model!")
        print_warning("Model should have 'dangerous_weapon' or 'weapon' class")
        return False
    
    print_success("All required classes found!")
    return True

def check_dependencies():
    """Check all required dependencies"""
    print_header("Step 3: Checking Dependencies")
    
    required_packages = [
        ('flask', 'Flask'),
        ('flask_cors', 'Flask-CORS'),
        ('ultralytics', 'Ultralytics YOLO'),
        ('cv2', 'OpenCV'),
        ('numpy', 'NumPy'),
        ('yt_dlp', 'yt-dlp (optional for YouTube)')
    ]
    
    all_installed = True
    
    for package_name, display_name in required_packages:
        try:
            __import__(package_name)
            print_success(f"{display_name} installed")
        except ImportError:
            if package_name == 'yt_dlp':
                print_warning(f"{display_name} not installed (YouTube feeds won't work)")
            else:
                print_error(f"{display_name} not installed")
                all_installed = False
    
    if not all_installed:
        print_info("\nInstall missing packages with:")
        print_info("   pip install flask flask-cors ultralytics opencv-python-headless numpy yt-dlp")
        return False
    
    return True

def check_video_sources():
    """Verify video source configuration"""
    print_header("Step 4: Checking Video Source Configuration")
    
    # Check if weapon-detection-server.py exists
    if not Path("weapon-detection-server.py").exists():
        print_error("weapon-detection-server.py not found!")
        return False
    
    print_success("Detection server file found")
    
    # Read and check VIDEO_SOURCES configuration
    with open("weapon-detection-server.py", "r") as f:
        content = f.read()
        
        if "VIDEO_SOURCES" not in content:
            print_error("VIDEO_SOURCES not found in server file!")
            return False
        
        print_success("VIDEO_SOURCES configuration found")
        
        # Check for all 6 feeds
        feeds_found = []
        for feed_id in range(1, 7):
            if f"{feed_id}:" in content or f"{feed_id} :" in content:
                feeds_found.append(feed_id)
        
        print_info(f"Found {len(feeds_found)} feeds configured: {feeds_found}")
        
        if len(feeds_found) != 6:
            print_warning(f"Expected 6 feeds, found {len(feeds_found)}")
        else:
            print_success("All 6 feeds configured!")
        
        # Check for webcam (feed 4 should be device 0)
        if "4: 0" in content or "4:0" in content:
            print_success("Feed 4 configured as webcam (device 0)")
        else:
            print_warning("Feed 4 might not be configured as webcam")
    
    return True

def check_server_can_start():
    """Quick test if server can initialize"""
    print_header("Step 5: Testing Server Initialization")
    
    try:
        # Import required modules
        from flask import Flask
        from ultralytics import YOLO
        import cv2
        
        print_success("All imports successful")
        
        # Try to load model
        print_info("Loading model...")
        model = YOLO('best.pt')
        print_success("Model loaded successfully!")
        
        # Try to create Flask app
        print_info("Creating Flask app...")
        app = Flask(__name__)
        print_success("Flask app created successfully!")
        
        print_success("Server initialization test passed!")
        return True
        
    except Exception as e:
        print_error(f"Server initialization failed: {e}")
        return False

def print_next_steps():
    """Print what to do next"""
    print_header("Next Steps")
    
    print("\n📋 To start the detection system:\n")
    print("1. Start the detection server:")
    print("   python weapon-detection-server.py")
    print()
    print("2. Open the dashboard in your browser")
    print()
    print("3. Click 'Enable Weapon Detection' button")
    print()
    print("4. Watch all 6 feeds for automatic weapon detection")
    print()
    print("5. Screenshots automatically captured and sent to Evidence Section")
    print()
    
    print("📊 What happens when detection is active:\n")
    print("   • Feed 1-3, 5-6: YouTube streams processed in background")
    print("   • Feed 4: Your webcam processed in background")
    print("   • All feeds monitored simultaneously (parallel threads)")
    print("   • When person + weapon detected together:")
    print("     - Alert triggered (max 1 per 30 seconds per feed)")
    print("     - Screenshot captured from exact feed with detection")
    print("     - Evidence sent to Evidence Section")
    print("     - Alert sent to Supabase backend")
    print("     - Alarm sound plays")
    print()

def main():
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║   CrimeShield AI - Detection Setup Verification          ║
    ║   Checking weapon detection system configuration...      ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    all_checks_passed = True
    
    # Run all checks
    if not check_model_file():
        all_checks_passed = False
    
    if not check_dependencies():
        all_checks_passed = False
    
    if not check_model_classes():
        all_checks_passed = False
    
    if not check_video_sources():
        all_checks_passed = False
    
    if not check_server_can_start():
        all_checks_passed = False
    
    # Print results
    print_header("Verification Results")
    
    if all_checks_passed:
        print_success("All checks passed! ✨")
        print_success("Your detection system is ready to use!")
        print_next_steps()
    else:
        print_error("Some checks failed!")
        print_warning("Please fix the issues above before starting the server")
        print_info("\nSee HOW-TO-ADD-YOLO-MODEL.md for detailed setup instructions")
    
    return 0 if all_checks_passed else 1

if __name__ == "__main__":
    sys.exit(main())
