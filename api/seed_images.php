<?php
header('Content-Type: text/plain');

ini_set('max_execution_time', 3600);

// --- 1. Configuration ---
$api_key = "YOUR_GOOGLE_API_KEY_HERE";
$api_url = "Your_API_Endpoint_URL_Here";

$servername = "your_db_host";
$username = "your_db_username";
$password = "your_db_password";
$dbname = "your_db_name";

$allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'JPG', 'PNG', 'GIF'];

// --- 2. Database Connection ---
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error)
    die("Database Connection failed: " . $conn->connect_error);

// --- 3. Folder & Flag Handling ---
// Step 1: Pick subfolder (default: sphere)
$sub_folder = isset($_GET['folder']) ? trim($_GET['folder']) : 'sphere';

// Step 2: Build path *after* defining sub_folder
$project_root = 'C:/xampp/htdocs/Wallpapersite';  // Use forward slashes (Windows is fine with it)
$images_base_dir = $project_root . "/images/" . $sub_folder . "/";

// Step 3: Safety check
if (!is_dir($images_base_dir)) {
    die("ERROR: Folder not found at -> $images_base_dir");
}

// Step 4: Flag
$is_sphere_flag = (isset($_GET['is_sphere']) && $_GET['is_sphere'] === 'true') ? 1 : 0;

echo "Starting image analysis in folder: $images_base_dir\n";
echo "Setting is_sphere_image flag to: $is_sphere_flag\n\n";

// --- 4. Core AI Loop ---
$files = scandir($images_base_dir);
foreach ($files as $filename) {
    if ($filename === '.' || $filename === '..')
        continue;

    $full_filepath = $images_base_dir . $filename;
    $public_filepath = "images/$sub_folder/$filename";
    $extension = pathinfo($filename, PATHINFO_EXTENSION);

    if (in_array($extension, $allowed_extensions) && is_file($full_filepath)) {
        echo "Processing $filename... ";

        $check_sql = "SELECT id FROM images WHERE filepath = '{$public_filepath}'";
        $check_result = $conn->query($check_sql);

        if ($check_result && $check_result->num_rows === 0) {
            $base64_data = image_to_base64($full_filepath);
            if ($base64_data) {
                $ai_data = generate_tags_and_name($base64_data, $extension);

                if (isset($ai_data['candidates'][0]['content']['parts'][0]['text'])) {
                    $json_response = $ai_data['candidates'][0]['content']['parts'][0]['text'];
                    $parsed_json = json_decode($json_response, true);

                    $name = $conn->real_escape_string($parsed_json['name']);
                    $description = $conn->real_escape_string($parsed_json['description']);
                    $tags = $conn->real_escape_string(implode(', ', $parsed_json['tags']));

                    $insert_sql = "INSERT INTO images (name, description, filepath, tags, is_sphere_image) 
                                   VALUES ('$name', '$description', '$public_filepath', '$tags', $is_sphere_flag)";

                    if ($conn->query($insert_sql) === TRUE) {
                        echo "SUCCESS (ID: " . $conn->insert_id . ") [AI Tagging Complete]\n";
                    } else {
                        echo "ERROR inserting: " . $conn->error . "\n";
                    }
                } else {
                    echo "ERROR: AI response parsing failed.\n";
                }
            } else {
                echo "ERROR: File not found for Base64 conversion.\n";
            }
        } else {
            if ($check_result && $check_result->num_rows > 0) {
                $update_sql = "UPDATE images SET is_sphere_image = $is_sphere_flag WHERE filepath = '{$public_filepath}'";
                $conn->query($update_sql);
                echo "SKIPPED (Already exists, flag updated to $is_sphere_flag)\n";
            } else {
                echo "SKIPPED (Query error or no result)\n";
            }
        }
    }
}

echo "\nSeeding complete!";

$conn->close();

// --- Helpers ---
function image_to_base64($filepath)
{
    if (!file_exists($filepath))
        return false;

    $info = getimagesize($filepath);
    if (!$info)
        return false;

    $max_dim = 2000; // Maximum width/height
    if ($info[0] > $max_dim || $info[1] > $max_dim) {
        $src = imagecreatefromstring(file_get_contents($filepath));
        $ratio = min($max_dim / $info[0], $max_dim / $info[1]);
        $new_w = (int) ($info[0] * $ratio);
        $new_h = (int) ($info[1] * $ratio);

        $dst = imagecreatetruecolor($new_w, $new_h);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $new_w, $new_h, $info[0], $info[1]);

        ob_start();
        imagejpeg($dst, null, 85); // compress to JPEG
        $data = ob_get_clean();

        imagedestroy($src);
        imagedestroy($dst);
    } else {
        $data = file_get_contents($filepath);
    }

    return base64_encode($data);
}


function generate_tags_and_name($base64_image_data, $file_extension)
{
    global $api_url, $api_key;

    $schema = [
        "type" => "OBJECT",
        "properties" => [
            "name" => ["type" => "STRING", "description" => "A short descriptive title"],
            "description" => ["type" => "STRING", "description" => "A 1-sentence summary"],
            "tags" => ["type" => "ARRAY", "items" => ["type" => "STRING"], "description" => "5 to 7 keywords"]
        ]
    ];

    $mime_type = "image/" . ($file_extension === 'jpg' || $file_extension === 'JPG' ? 'jpeg' : strtolower($file_extension));

    $payload = [
        "contents" => [
            [
                "parts" => [
                    ["text" => "Analyze this image. Generate title, description, and tags. Respond with JSON only."],
                    ["inlineData" => ["mimeType" => $mime_type, "data" => $base64_image_data]]
                ]
            ]
        ],
        "generationConfig" => ["responseMimeType" => "application/json", "responseSchema" => $schema]
    ];

    $ch = curl_init($api_url . "?key=" . $api_key);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300);        // Abort if >30s
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 120); // Abort if connect >10s
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}
?>