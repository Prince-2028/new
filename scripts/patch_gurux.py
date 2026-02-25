#!/usr/bin/env python3
"""
Patch script for Gurux DLMS library HDLC extended format bug.

This script fixes a bug in gurux-dlms 1.0.189 where HDLC frames larger than 255 bytes
fail because the library doesn't properly mask the length byte in extended format.

Bug location: gurux_dlms/GXDLMS.py line 970
Fix: Add & 0xFF mask to extract lower 8 bits of frame length
"""

import os
import sys
import shutil
from pathlib import Path


def find_gxdlms_file():
    """Find the GXDLMS.py file in the current Python environment."""
    venv_path = Path(sys.prefix)
    
    # Try common locations
    possible_paths = [
        venv_path / 'Lib' / 'site-packages' / 'gurux_dlms' / 'GXDLMS.py',
        venv_path / 'lib' / 'python3.11' / 'site-packages' / 'gurux_dlms' / 'GXDLMS.py',
        venv_path / 'lib' / 'site-packages' / 'gurux_dlms' / 'GXDLMS.py',
    ]
    
    for path in possible_paths:
        if path.exists():
            return path
    
    raise FileNotFoundError(
        f"Could not find GXDLMS.py in virtual environment at {venv_path}. "
        "Please ensure gurux-dlms is installed."
    )


def backup_file(file_path):
    """Create a backup of the original file."""
    backup_path = file_path.with_suffix('.py.backup')
    if not backup_path.exists():
        shutil.copy2(file_path, backup_path)
        print(f"✓ Created backup: {backup_path}")
    else:
        print(f"ℹ Backup already exists: {backup_path}")


def check_if_already_patched(content):
    """Check if the file has already been patched."""
    # Look for the patched line
    if '& 0xFF)' in content and 'bb.setUInt8((7 + len(secondaryAddress)' in content:
        return True
    return False


def apply_patch(file_path):
    """Apply the HDLC extended format fix to GXDLMS.py."""
    print(f"Patching: {file_path}")
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already patched
    if check_if_already_patched(content):
        print("✓ File is already patched. No changes needed.")
        return True
    
    # Create backup
    backup_file(file_path)
    
    # Apply the fix - replace line 970
    original_line = 'bb.setUInt8(7 + len(secondaryAddress) + len(primaryAddress) + len1)'
    patched_line = 'bb.setUInt8((7 + len(secondaryAddress) + len(primaryAddress) + len1) & 0xFF)'
    
    if original_line not in content:
        print("✗ Could not find the line to patch. File may have been modified.")
        return False
    
    # Apply the patch
    patched_content = content.replace(original_line, patched_line)
    
    # Write the patched content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(patched_content)
    
    print("✓ Patch applied successfully!")
    print(f"  Fixed: HDLC extended format length byte masking")
    print(f"  Line 970: Added & 0xFF mask")
    
    return True


def clear_pycache(file_path):
    """Clear Python cache files to ensure the patch takes effect."""
    pycache_dir = file_path.parent / '__pycache__'
    if pycache_dir.exists():
        for pyc_file in pycache_dir.glob('GXDLMS*.pyc'):
            pyc_file.unlink()
            print(f"✓ Removed cache: {pyc_file.name}")


def main():
    """Main entry point for the patch script."""
    print("=" * 60)
    print("Gurux DLMS HDLC Extended Format Patch")
    print("=" * 60)
    
    try:
        # Find the file
        gxdlms_path = find_gxdlms_file()
        print(f"Found: {gxdlms_path}")
        
        # Apply patch
        success = apply_patch(gxdlms_path)
        
        if success:
            # Clear cache
            clear_pycache(gxdlms_path)
            
            print("\n" + "=" * 60)
            print("✓ Patch completed successfully!")
            print("=" * 60)
        else:
            print("\n✗ Patch failed. Please check the error messages above.")
            return 1
            
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
