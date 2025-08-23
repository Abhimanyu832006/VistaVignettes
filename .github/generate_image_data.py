
# generate_image_data.py v2
import os
import json

# Define the path to your images folder relative to the repository root
IMAGES_DIR = 'images/sphere'
# Define the path where the JSON file will be generated
OUTPUT_JSON_PATH = 'data.json'

def generate_image_paths_json():
    image_paths = []
    # Check if the images directory exists
    if os.path.exists(IMAGES_DIR) and os.path.isdir(IMAGES_DIR):
        # Iterate over all files in the images directory
        for filename in os.listdir(IMAGES_DIR):
            # Construct the full path to the image
            full_path = f"{IMAGES_DIR}/{filename}"
            # Check if it's actually a file and a common image type
            if os.path.isfile(full_path) and filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                image_paths.append(full_path.replace('\\', '/')) # Use forward slashes for web paths

        # Create the data dictionary
        data = {"imagePaths": image_paths}

        # Write the data to the JSON file
        with open(OUTPUT_JSON_PATH, 'w') as f:
            json.dump(data, f, indent=2) # indent=2 makes the JSON nicely formatted
        print(f"Successfully generated {OUTPUT_JSON_PATH} with {len(image_paths)} image paths.")
    else:
        print(f"Error: Images directory '{IMAGES_DIR}' not found or is not a directory.")
        # If images directory is not found, create an empty data.json
        with open(OUTPUT_JSON_PATH, 'w') as f:
            json.dump({"imagePaths": []}, f, indent=2)
        print(f"Generated empty {OUTPUT_JSON_PATH}.")


if __name__ == "__main__":
    generate_image_paths_json()