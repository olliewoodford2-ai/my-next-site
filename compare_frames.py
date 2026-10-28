#!/usr/bin/env python3
"""
Compare extracted video frames against reference frames using perceptual hashing
to determine which video maps to which scene in the reference video.
"""

import os
import sys
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

REFERENCE_DIR = "/Users/ollie/Documents/website-projects/my-next-site/references/frames"
EXTRACTED_DIR = "/Users/ollie/Documents/website-projects/my-next-site/extracted-frames"

def phash(image_path, hash_size=16):
    """Compute perceptual hash of an image using DCT (simplified)."""
    try:
        img = Image.open(image_path)
        # Convert to grayscale
        img = img.convert('L')
        # Resize to hash_size x hash_size
        img = img.resize((hash_size, hash_size), Image.Resampling.LANCZOS)
        # Get pixel data
        pixels = list(img.getdata())
        # Compute mean
        mean = sum(pixels) / len(pixels)
        # Create hash bits
        bits = ''.join('1' if p > mean else '0' for p in pixels)
        # Convert to integer
        return int(bits, 2)
    except Exception as e:
        print(f"Error processing {image_path}: {e}", file=sys.stderr)
        return None

def hamming_distance(hash1, hash2):
    """Compute Hamming distance between two integer hashes."""
    return bin(hash1 ^ hash2).count('1')

def load_frames(directory, pattern_filter=None):
    """Load all frames from a directory matching pattern."""
    frames = {}
    for fname in sorted(os.listdir(directory)):
        if fname.endswith('.png') and not fname.startswith('edges_') and not fname.startswith('enhanced_') and not fname.startswith('.'):
            if pattern_filter and pattern_filter not in fname:
                continue
            path = os.path.join(directory, fname)
            h = phash(path)
            if h is not None:
                frames[fname] = h
    return frames

def main():
    print("Loading reference frames...")
    ref_frames = load_frames(REFERENCE_DIR)
    print(f"Loaded {len(ref_frames)} reference frames")

    video_dirs = {
        'reveal': [f for f in sorted(os.listdir(EXTRACTED_DIR)) if f.startswith('reveal_')],
        'signal': [f for f in sorted(os.listdir(EXTRACTED_DIR)) if f.startswith('signal_')],
        'colossus': [f for f in sorted(os.listdir(EXTRACTED_DIR)) if f.startswith('colossus_')],
        'footer_loop': [f for f in sorted(os.listdir(EXTRACTED_DIR)) if f.startswith('footer_loop_')],
    }

    for video_name, frame_files in video_dirs.items():
        print(f"\n{'='*60}")
        print(f"Analyzing {video_name} ({len(frame_files)} frames)")
        print(f"{'='*60}")

        # Load all frames for this video
        video_frames = {}
        for fname in frame_files:
            path = os.path.join(EXTRACTED_DIR, fname)
            h = phash(path)
            if h is not None:
                video_frames[fname] = h

        # Compare each video frame against all reference frames
        # Find best matches
        matches = []
        for vname, vhash in video_frames.items():
            best_match = None
            best_dist = float('inf')
            for rname, rhash in ref_frames.items():
                dist = hamming_distance(vhash, rhash)
                if dist < best_dist:
                    best_dist = dist
                    best_match = rname
            matches.append((vname, best_match, best_dist))

        # Sort by distance
        matches.sort(key=lambda x: x[2])

        # Print top matches
        print(f"\nTop 10 matches for {video_name}:")
        for vname, rname, dist in matches[:10]:
            print(f"  {vname} -> {rname} (distance: {dist})")

        # Also show distribution of distances
        distances = [m[2] for m in matches]
        print(f"\nDistance stats: min={min(distances)}, max={max(distances)}, avg={sum(distances)/len(distances):.1f}")

        # Show which reference time ranges match best
        print("\nReference time distribution of matches:")
        time_bins = {}
        for vname, rname, dist in matches:
            # Extract time from reference frame name (e.g., frame_005_t2.5s.png -> 2.5)
            try:
                t_str = rname.split('_t')[1].split('s')[0]
                t = float(t_str)
                bin_key = int(t // 1)  # 1-second bins
                if bin_key not in time_bins:
                    time_bins[bin_key] = []
                time_bins[bin_key].append(dist)
            except:
                pass

        for bin_key in sorted(time_bins.keys()):
            dists = time_bins[bin_key]
            avg = sum(dists) / len(dists)
            print(f"  {bin_key}s-{bin_key+1}s: {len(dists)} matches, avg dist={avg:.1f}")

if __name__ == "__main__":
    main()