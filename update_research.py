#!/usr/bin/env python3
"""
Complete research update script that:
1. Updates publications from Google Scholar
2. Generates thumbnails for papers
3. Builds the site locally for testing
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and print status."""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, 
                              capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(f"Output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        if e.stdout:
            print(f"Stdout: {e.stdout}")
        if e.stderr:
            print(f"Stderr: {e.stderr}")
        return False

def main():
    """Main update process."""
    print("🚀 Starting complete research page update...")
    
    # Check if we're in the right directory
    if not os.path.exists('_config.yml'):
        print("❌ Error: Not in Jekyll site root directory")
        print("Please run this script from the root of your Jekyll site")
        sys.exit(1)
    
    steps = [
        ("python update_publications.py", "Updating publications from Google Scholar"),
        ("python generate_thumbnails.py", "Generating paper thumbnails"),
        ("bundle exec jekyll build", "Building Jekyll site")
    ]
    
    success_count = 0
    
    for command, description in steps:
        if run_command(command, description):
            success_count += 1
        else:
            print(f"\n❌ Update process stopped at: {description}")
            break
    
    print(f"\n📊 Update Summary:")
    print(f"   ✅ {success_count}/{len(steps)} steps completed successfully")
    
    if success_count == len(steps):
        print("\n🎉 Research page update completed successfully!")
        print("Your publications now have:")
        print("   • Automated tags based on content")
        print("   • Generated thumbnails from PDFs")
        print("   • Interactive tag-based filtering")
        print("   • Responsive card layout")
        print("\nTo serve locally: bundle exec jekyll serve")
    else:
        print("\n⚠️  Some steps failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()