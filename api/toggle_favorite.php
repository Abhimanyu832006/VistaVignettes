<?php
// api/toggle_favorite.php

// 1. Set headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 2. Include required files
include_once __DIR__ . '/config/db.php';
include_once 'utils/auth_check.php';

// 3. CRITICAL SECURITY STEP: Enforce login and get the user ID
$user_id = require_login(); 

// 4. Get posted data
$data = json_decode(file_get_contents("php://input"));

// 5. Input validation
if (empty($data->image_id)) {
    http_response_code(400);
    echo json_encode(array("message" => "Error: Missing image ID."));
    exit();
}

// 6. Instantiate database and get connection
$database = new Database();
$db = $database->getConnection();

// Security: Sanitize image ID
$image_id = htmlspecialchars(strip_tags($data->image_id));

try {
    // --- CHECK 1: See if the favorite already exists ---
    $check_query = "SELECT user_id FROM favorites WHERE user_id = :user_id AND image_id = :image_id LIMIT 1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $check_stmt->bindParam(':image_id', $image_id, PDO::PARAM_INT);
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        // --- ACTION 1: Favorite exists, so DELETE (UNFAVORITE) ---
        $delete_query = "DELETE FROM favorites WHERE user_id = :user_id AND image_id = :image_id";
        $delete_stmt = $db->prepare($delete_query);
        $delete_stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $delete_stmt->bindParam(':image_id', $image_id, PDO::PARAM_INT);
        $delete_stmt->execute();

        http_response_code(200);
        echo json_encode(array("message" => "Image unfavorited.", "status" => "removed"));
    } else {
        // --- ACTION 2: Favorite does not exist, so INSERT (FAVORITE) ---
        $insert_query = "INSERT INTO favorites (user_id, image_id) VALUES (:user_id, :image_id)";
        $insert_stmt = $db->prepare($insert_query);
        $insert_stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $insert_stmt->bindParam(':image_id', $image_id, PDO::PARAM_INT);
        $insert_stmt->execute();

        http_response_code(201); // Created
        echo json_encode(array("message" => "Image favorited.", "status" => "added"));
    }
} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(array("message" => "Database error: Unable to process favorite."));
    // Log $e->getMessage() securely, do not display to user in production
}
