# generate_image_data.py
import os
import json

BASE_IMAGES_DIR = 'images'

def generate_image_paths_json():
    # --- For Sphere Data (only from images/sphere) ---
    sphere_image_paths = []
    sphere_scan_dir = os.path.join(BASE_IMAGES_DIR, 'sphere')

    if os.path.exists(sphere_scan_dir) and os.path.isdir(sphere_scan_dir):
        for filename in os.listdir(sphere_scan_dir):
            full_local_path = os.path.join(sphere_scan_dir, filename)
            if os.path.isfile(full_local_path) and filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                web_path = f"{sphere_scan_dir}/{filename}".replace('\\', '/')
                sphere_image_paths.append(web_path)
        print(f"Collected {len(sphere_image_paths)} sphere image paths.")
    else:
        print(f"Warning: Sphere directory '{sphere_scan_dir}' not found. Generating empty sphere_data.json.")

    # Write sphere_data.json
    with open('sphere_data.json', 'w') as f:
        json.dump({"imagePaths": sphere_image_paths}, f, indent=2)
    print(f"Successfully generated sphere_data.json.")

    # --- For Gallery Data (from images/ and images/sphere) ---
    gallery_image_paths = []

    # Scan base images directory
    if os.path.exists(BASE_IMAGES_DIR) and os.path.isdir(BASE_IMAGES_DIR):
        for filename in os.listdir(BASE_IMAGES_DIR):
            full_local_path = os.path.join(BASE_IMAGES_DIR, filename)
            if os.path.isfile(full_local_path) and filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                # Exclude 'sphere' folder itself if it's a file (unlikely but safe)
                if filename.lower() != 'sphere': 
                    web_path = f"{BASE_IMAGES_DIR}/{filename}".replace('\\', '/')
                    gallery_image_paths.append(web_path)
        print(f"Collected {len(gallery_image_paths)} base gallery image paths.")
    else:
        print(f"Warning: Base images directory '{BASE_IMAGES_DIR}' not found.")

    # Add sphere images to gallery images
    gallery_image_paths.extend(sphere_image_paths) # Add sphere images to the gallery list

    # Write gallery_data.json
    with open('gallery_data.json', 'w') as f:
        json.dump({"imagePaths": gallery_image_paths}, f, indent=2)
    print(f"Successfully generated gallery_data.json.")

if __name__ == "__main__":
    generate_image_paths_json()