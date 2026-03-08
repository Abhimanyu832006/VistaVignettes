<?php
// api/log_download.php

// 1. Set headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// CRITICAL: Start session to check for logged-in user
session_start();

// 2. Include database connection
include_once __DIR__ . '/config/db.php';

// 3. Instantiate database and get connection
$database = new Database();
$db = $database->getConnection();

// 4. Get posted data
$data = json_decode(file_get_contents("php://input"));

// 5. Input validation
if (empty($data->image_id)) {
    http_response_code(400);
    echo json_encode(array("message" => "Error: Missing image ID."));
    exit();
}

// 6. Determine user ID (NULL for guests)
$user_id = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;

// Security: Sanitize image ID
$image_id = htmlspecialchars(strip_tags($data->image_id));

// 7. SQL Query: Insert the download record
// Note: user_id is NULL if $user_id is null
$query = "INSERT INTO downloads (user_id, image_id) VALUES (:user_id, :image_id)";

try {
    // 8. Prepare the statement
    $stmt = $db->prepare($query);

    // 9. Bind parameters
    // CRITICAL: Use PDO::PARAM_INT for user_id only if it's not null, otherwise use PARAM_NULL
    if ($user_id !== null) {
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    } else {
        $stmt->bindValue(':user_id', null, PDO::PARAM_NULL);
    }
    $stmt->bindParam(':image_id', $image_id, PDO::PARAM_INT);

    // 10. Execute the query
    $stmt->execute();

    http_response_code(201); // Created
    echo json_encode(array("message" => "Download logged successfully."));

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: Unable to log download."));
}
