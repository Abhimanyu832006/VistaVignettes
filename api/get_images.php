<?php
// api/get_images.php (Updated to use PDO and include user personalization features)

// 1. Set headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// CRITICAL: Start session to check for logged-in user
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// 2. Include database connection
include_once __DIR__ . '/config/db.php';

// 3. Instantiate database
$database = new Database();
$db = $database->getConnection(); // This returns the secure PDO connection object

// 4. Get query parameters
$searchTerm = isset($_GET['search_term']) ? trim($_GET['search_term']) : '';
// NOTE: is_sphere_image is NULL by default, allowing it to be an optional filter.
$is_sphere_image = isset($_GET['is_sphere_image']) ? $_GET['is_sphere_image'] : null;

// NEW: Check if user is logged in
$user_id = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;

// Check if we're specifically looking for favorited images
$is_favorited = isset($_GET['is_favorited']) ? (int)$_GET['is_favorited'] : null;

// 5. Build the dynamic query for filtering and personalization
$query = "
    SELECT 
        i.id, i.filepath, i.name, i.tags, i.description, i.is_sphere_image
        
        -- NEW: Conditionally include is_favorited status if user is logged in
        " . ($user_id !== null ? ", IF(f.user_id IS NOT NULL, 1, 0) AS is_favorited" : ", 0 AS is_favorited") . "
        
    FROM images i
    
    -- NEW: Conditionally LEFT JOIN the favorites table
    " . ($user_id !== null ? "LEFT JOIN favorites f 
                              ON i.id = f.image_id AND f.user_id = :user_id" : "") . "
    
    WHERE 1=1
";

// 6. Define an array for binding parameters
$params = [];

// 7. Apply filters and bind parameters securely (using named placeholders for PDO)
if ($searchTerm !== '') {
    // Search logic (name, tags, description)
    $query .= " AND (i.name LIKE :search_term OR i.tags LIKE :search_term OR i.description LIKE :search_term)";
    $params[':search_term'] = '%' . $searchTerm . '%';
}
if ($is_sphere_image !== null && ($is_sphere_image === '0' || $is_sphere_image === '1')) {
    // is_sphere_image filter (crucial for Home/Gallery separation)
    $query .= " AND i.is_sphere_image = :is_sphere_image";
    $params[':is_sphere_image'] = (int)$is_sphere_image;
}

// Filter for favorited images - This is critical for the profile page
if ($is_favorited === 1 && $user_id !== null) {
    // Only show images that are actually favorited by this user
    $query .= " AND f.user_id IS NOT NULL";
    // Force the JOIN to be INNER JOIN to only return favorited images
    $query = str_replace("LEFT JOIN favorites f", "INNER JOIN favorites f", $query);
}

// NEW: If user is logged in, bind user_id for the LEFT JOIN condition
if ($user_id !== null) {
    $params[':user_id'] = $user_id;
}

// 8. Finalize the query
$query .= " ORDER BY i.id DESC";

try {
    // 9. Prepare the statement
    $stmt = $db->prepare($query);

    // 10. Bind parameters (loop through the prepared array)
    foreach ($params as $key => &$value) {
        // Determine the correct data type for PDO binding
        $type = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindParam($key, $value, $type);
    }
    
    // 11. Execute the query
    $stmt->execute();
    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 12. Format the output (as requested in the original code, using 'path'/'name' keys)
    $output_images = [];
    foreach ($images as $image) {
        $item = [
            "id" => $image['id'],
            "path" => $image['filepath'],
            "name" => $image['name'],
            "tags" => $image['tags'],
            // Include is_favorited status if it exists in the result set
            "is_favorited" => isset($image['is_favorited']) ? (int)$image['is_favorited'] : 0, 
            // Include description and sphere flag for full context
            "description" => $image['description'],
            "is_sphere_image" => (int)$image['is_sphere_image']
        ];
        $output_images[] = $item;
    }

    // 13. Respond
    http_response_code(200);
    echo json_encode(["imagePaths" => $output_images]);

} catch (PDOException $e) {
    // Log error securely and provide a generic message to the client
    http_response_code(500);
    echo json_encode(["error" => "An internal database error occurred."]);
}
