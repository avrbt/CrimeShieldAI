"""
Quick Model Class Tester
=========================
This script tests your YOLO model to show what classes it was trained on.

Usage:
------
python test-model-classes.py

This will show you the exact class names and indices in your model.
"""

from ultralytics import YOLO
import sys

MODEL_PATH = 'best.pt'

print("=" * 60)
print("YOLO Model Class Inspector")
print("=" * 60)
print(f"Loading model from: {MODEL_PATH}\n")

try:
    # Load the model
    model = YOLO(MODEL_PATH)
    print("✓ Model loaded successfully!\n")
    
    # Get class names
    if hasattr(model, 'names'):
        class_names = model.names
        print("📋 Model Classes:")
        print("-" * 60)
        for idx, name in class_names.items():
            print(f"  Class {idx}: '{name}'")
        print("-" * 60)
        print()
        
        # Check if expected classes exist
        print("🔍 Checking for expected classes:")
        print("-" * 60)
        
        has_weapon = False
        has_person = False
        
        for idx, name in class_names.items():
            name_lower = name.lower()
            
            # Check for weapon
            if idx == 0 or any(w in name_lower for w in ['weapon', 'gun', 'knife', 'pistol', 'rifle']):
                print(f"  ✓ WEAPON class found: Index {idx} = '{name}'")
                has_weapon = True
            
            # Check for person
            if idx == 1 or 'person' in name_lower or 'people' in name_lower:
                print(f"  ✓ PERSON class found: Index {idx} = '{name}'")
                has_person = True
        
        print("-" * 60)
        print()
        
        # Summary
        print("📊 Detection Capability:")
        print("-" * 60)
        if has_weapon and has_person:
            print("  ✓ Model can detect BOTH weapon AND person")
            print("  ✓ Weapon + Person detection will work!")
        elif has_weapon:
            print("  ⚠ Model can detect weapons, but NO person class found")
            print("  ✗ Weapon + Person detection will NOT work")
        elif has_person:
            print("  ⚠ Model can detect persons, but NO weapon class found")
            print("  ✗ Weapon + Person detection will NOT work")
        else:
            print("  ✗ Neither weapon nor person class found")
            print("  ✗ Detection will NOT work with current configuration")
        print("-" * 60)
        print()
        
        # Configuration recommendation
        print("💡 Recommended Configuration:")
        print("-" * 60)
        print("In weapon-detection-server.py, make sure:")
        print()
        
        for idx, name in class_names.items():
            name_lower = name.lower()
            if any(w in name_lower for w in ['weapon', 'gun', 'knife', 'pistol', 'rifle']) or idx == 0:
                print(f"Weapon detection (Line 197):")
                print(f"  if cls == {idx}:  # {name}")
                print(f"      has_weapon = True")
                print()
            
            if 'person' in name_lower or 'people' in name_lower or idx == 1:
                print(f"Person detection (Line 202):")
                print(f"  if cls == {idx}:  # {name}")
                print(f"      has_person = True")
                print()
        
        print("-" * 60)
    else:
        print("✗ Error: Could not access model class names")
        print("  The model might not be properly trained or corrupted")
        
except FileNotFoundError:
    print(f"✗ Error: Model file '{MODEL_PATH}' not found!")
    print()
    print("Please make sure:")
    print("  1. Your trained model file is named 'best.pt'")
    print("  2. It's in the same directory as this script")
    print("  3. You have read permissions for the file")
    sys.exit(1)
    
except Exception as e:
    print(f"✗ Error loading model: {e}")
    print()
    print("This might be because:")
    print("  1. The model file is corrupted")
    print("  2. Wrong version of ultralytics library")
    print("  3. Model was trained with different YOLO version")
    print()
    print("Try reinstalling ultralytics:")
    print("  pip install --upgrade ultralytics")
    sys.exit(1)

print()
print("=" * 60)
print("Test Complete!")
print("=" * 60)
