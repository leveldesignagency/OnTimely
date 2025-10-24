#!/bin/bash

# Script to commit all website assets to GitHub
# Run this from the OnTimely directory

echo "🖼️  Committing website assets to GitHub..."

# Add all image files
git add website/*.png
git add website/*.svg
git add website/*.mp4
git add website/*.jpg
git add website/*.jpeg
git add website/*.gif
git add website/*.webp

# Add favicon
git add website/favicon.ico

# Add any other assets
git add website/assets/
git add website/images/

# Commit with descriptive message
git commit -m "Add website assets: images, videos, and favicon

- Added all PNG images for website sections
- Added logo files (SVG and PNG)
- Added loading screen videos
- Added favicon.ico
- Fixed missing asset 404 errors"

echo "✅ Assets committed successfully!"
echo "📤 Now push to GitHub: git push origin main"
