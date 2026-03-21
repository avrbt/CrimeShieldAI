"""
Verify YOLO Model Classes
==========================
This script verifies that your trained model has the correct class names.

Usage:
    python verify-model-classes.py

Expected Output:
    Model Classes:
    - Class 0: person
    - Class 1: dangerous_weapon (or dangerous weapon)
"""

from ultralytics import YOLO
import sys

def verify_model_classes():
    try:
        print("=" * 60)
        print("CrimeShield - YOLO Model Class Verification")
        print("=" * 60)
        print()
        
        # Load model
        print("📦 Loading model from 'best.pt'...")
        model = YOLO('best.pt')
        print("✅ Model loaded successfully!")
        print()
        
        # Get class names
        print("🔍 Model Classes:")
        print("-" * 60)
        
        if hasattr(model, 'names'):
            class_names = model.names
            print(f"Total Classes: {len(class_names)}")
            print()
            
            for idx, name in class_names.items():
                print(f"  Class {idx}: {name}")
            
            print()
            print("=" * 60)
            print("✅ Verification Results:")
            print("=" * 60)
            
            # Verify expected classes
            has_person = False
            has_dangerous_weapon = False
            
            # Check for person class
            if 0 in class_names:
                class_0_name = class_names[0].lower()
                if 'person' in class_0_name or 'people' in class_0_name or 'human' in class_0_name:
                    has_person = True
                    print(f"✅ Class 0 (Person): FOUND - '{class_names[0]}'")
                else:
                    print(f"⚠️  Class 0: Found '{class_names[0]}' (expected 'person')")
            else:
                print("❌ Class 0: NOT FOUND")
            
            # Check for dangerous weapon class
            if 1 in class_names:
                class_1_name = class_names[1].lower().replace('_', ' ').replace('-', ' ')
                
                dangerous_weapon_keywords = [
                    'dangerous weapon', 'dangerous_weapon', 'dangerousweapon',
                    'weapon', 'gun', 'knife', 'pistol', 'rifle', 'firearm'
                ]
                
                if any(keyword in class_1_name for keyword in dangerous_weapon_keywords):
                    has_dangerous_weapon = True
                    print(f"✅ Class 1 (Dangerous Weapon): FOUND - '{class_names[1]}'")
                else:
                    print(f"⚠️  Class 1: Found '{class_names[1]}' (expected dangerous weapon related)")
            else:
                print("❌ Class 1: NOT FOUND")
            
            print()
            
            # Overall status
            if has_person and has_dangerous_weapon:
                print("🎉 SUCCESS! Your model has the correct classes for detection.")
                print("   The weapon detection system should work correctly.")
            elif has_person or has_dangerous_weapon:
                print("⚠️  PARTIAL: Some classes are correct, but not all.")
                print("   Detection may work with limitations.")
                print()
                print("   The updated code is flexible and will try to work with your classes.")
                print("   Monitor the Flask server console for detection messages.")
            else:
                print("❌ ERROR: Model classes don't match expected format.")
                print()
                print("   Expected:")
                print("   - Class 0: 'person' (or similar)")
                print("   - Class 1: 'dangerous_weapon' (or similar weapon keyword)")
                print()
                print("   Your model may need retraining with correct class labels.")
            
            print("=" * 60)
            print()
            
            # Additional info
            print("📋 Additional Information:")
            print("-" * 60)
            print("The detection system now accepts flexible class names:")
            print()
            print("For Person (Class 0):")
            print("  - 'person', 'people', 'human' (case insensitive)")
            print()
            print("For Dangerous Weapon (Class 1):")
            print("  - 'dangerous weapon', 'dangerous_weapon', 'dangerousweapon'")
            print("  - 'weapon', 'gun', 'knife', 'pistol', 'rifle', 'firearm'")
            print("  - 'armed', 'blade', 'sword'")
            print()
            print("Detection triggers ONLY when BOTH classes detected together!")
            print("=" * 60)
            
        else:
            print("❌ ERROR: Model doesn't have 'names' attribute")
            print("   This is unusual. Your model may be corrupted.")
        
    except FileNotFoundError:
        print("❌ ERROR: 'best.pt' file not found!")
        print()
        print("Please ensure your trained model file 'best.pt' is in the same directory")
        print("as this script.")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print()
        print("Make sure you have installed required packages:")
        print("  pip install ultralytics")
        sys.exit(1)

if __name__ == '__main__':
    verify_model_classes()
